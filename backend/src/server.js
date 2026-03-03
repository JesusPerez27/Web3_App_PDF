const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pdfService = require('./pdfService');
const pinataService = require('./pinataService');
const web3Service = require('./web3Service');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend Web3 PDF Registry funcionando correctamente' });
});

// Endpoint POST /documents - Flujo A: Emisión y resguardo de PDF
app.post('/documents', async (req, res) => {
  try {
    const { clientName, serviceDescription, consecutiveNumber } = req.body;

    // Validación de datos
    if (!clientName || !serviceDescription || !consecutiveNumber) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: clientName, serviceDescription, consecutiveNumber' 
      });
    }

    console.log('📄 Generando PDF para:', { clientName, serviceDescription, consecutiveNumber });

    // 1. Generar PDF con plantilla legal
    const pdfBuffer = await pdfService.generateContractPdf({
      clientName,
      serviceDescription,
      consecutiveNumber,
      contractDate: new Date().toISOString().split('T')[0]
    });

    console.log('✅ PDF generado, tamaño:', pdfBuffer.length, 'bytes');

    // 2. Calcular hash SHA-256 del PDF
    const fileHash = crypto.createHash('sha256').update(pdfBuffer).digest();
    const fileHashHex = '0x' + fileHash.toString('hex');

    console.log('🔐 Hash SHA-256 calculado:', fileHashHex);

    // 3. Subir PDF a IPFS vía Pinata
    const ipfsCid = await pinataService.pinFileToIPFS(pdfBuffer, {
      name: `contract-${consecutiveNumber}.pdf`
    });

    console.log('📌 PDF subido a IPFS, CID:', ipfsCid);

    // 4. Registrar en blockchain
    const txHash = await web3Service.registerDocument(fileHash, ipfsCid);
    console.log('⛓️ Transacción enviada:', txHash);

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

    return res.status(201).json({
      fileHashHex,
      ipfsCid,
      ipfsUrl,
      txHash
    });
  } catch (err) {
    console.error('❌ Error en POST /documents:', err);
    return res.status(500).json({ error: err.message || 'Error al procesar el documento' });
  }
});

// Endpoint POST /verify - Flujo B: Verificación de PDF
app.post('/verify', async (req, res) => {
  try {
    const { fileHashHex } = req.body;

    if (!fileHashHex || typeof fileHashHex !== 'string') {
      return res.status(400).json({ error: 'Se requiere fileHashHex en el cuerpo de la petición' });
    }

    const hex = fileHashHex.startsWith('0x') ? fileHashHex.slice(2) : fileHashHex;
    if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
      return res.status(400).json({ error: 'fileHashHex debe ser un hash SHA-256 en hexadecimal (64 caracteres)' });
    }

    const fileHash = Buffer.from(hex, 'hex');

    const doc = await web3Service.getDocumentByHash(fileHash);

    const statusMap = { 0: 'No registrado', 1: 'Válido', 2: 'Revocado' };
    const statusText = statusMap[doc.status] ?? 'Desconocido';
    const ipfsUrl = doc.ipfsCid
      ? `https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`
      : null;

    return res.json({
      fileHashHex,
      ipfsCid: doc.ipfsCid || null,
      issuer: doc.issuer,
      timestamp: doc.timestamp ? Number(doc.timestamp) : null,
      status: statusText,
      ipfsUrl,
      isValid: doc.status === 1
    });
  } catch (err) {
    console.error('❌ Error en POST /verify:', err);
    return res.status(500).json({ error: err.message || 'Error al verificar el documento' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
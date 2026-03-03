const axios = require('axios');
const FormData = require('form-data');

/**
 * Servicio para interactuar con Pinata (IPFS pinning service)
 * Requiere PINATA_JWT en las variables de entorno
 */

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.warn('⚠️  PINATA_JWT no está configurado en las variables de entorno');
}

/**
 * Sube un archivo (PDF) a IPFS usando Pinata
 * 
 * @param {Buffer} fileBuffer - Buffer del archivo a subir
 * @param {Object} metadata - Metadatos opcionales
 * @param {string} metadata.name - Nombre del archivo
 * @param {Object} metadata.keyvalues - Pares clave-valor personalizados
 * @returns {Promise<string>} - CID del archivo en IPFS
 */
async function pinFileToIPFS(fileBuffer, metadata = {}) {
  try {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT no está configurado');
    }

    const formData = new FormData();
    
    // Agregar el archivo
    formData.append('file', fileBuffer, {
      filename: metadata.name || 'document.pdf',
      contentType: 'application/pdf'
    });

    // Agregar metadatos opcionales
    const pinataMetadata = {
      name: metadata.name || 'document.pdf',
      keyvalues: metadata.keyvalues || {}
    };

    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Opciones de pinning (opcional)
    const pinataOptions = {
      cidVersion: 1 // Usar CIDv1 para mejor compatibilidad
    };

    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    // Realizar la petición a Pinata
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Archivo subido a Pinata:', response.data);

    return response.data.IpfsHash; // Retorna el CID

  } catch (error) {
    console.error('❌ Error al subir archivo a Pinata:', error.response?.data || error.message);
    throw new Error(`Error al subir a IPFS: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Verifica la conexión con Pinata
 * 
 * @returns {Promise<boolean>} - true si la conexión es exitosa
 */
async function testAuthentication() {
  try {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT no está configurado');
    }

    const response = await axios.get(
      `${PINATA_API_URL}/data/testAuthentication`,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log('✅ Autenticación con Pinata exitosa:', response.data);
    return true;

  } catch (error) {
    console.error('❌ Error de autenticación con Pinata:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Obtiene información de un archivo pinneado por su CID
 * 
 * @param {string} cid - CID del archivo en IPFS
 * @returns {Promise<Object>} - Información del archivo
 */
async function getPinInfo(cid) {
  try {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT no está configurado');
    }

    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?hashContains=${cid}`,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('❌ Error al obtener info del pin:', error.response?.data || error.message);
    throw new Error(`Error al consultar IPFS: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Desancla (unpin) un archivo de Pinata
 * CUIDADO: Esto puede hacer que el archivo deje de estar disponible en IPFS
 * 
 * @param {string} cid - CID del archivo a desanclar
 * @returns {Promise<boolean>} - true si se desancló exitosamente
 */
async function unpinFile(cid) {
  try {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT no está configurado');
    }

    await axios.delete(
      `${PINATA_API_URL}/pinning/unpin/${cid}`,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log(`✅ Archivo ${cid} desanclado de Pinata`);
    return true;

  } catch (error) {
    console.error('❌ Error al desanclar archivo:', error.response?.data || error.message);
    throw new Error(`Error al desanclar: ${error.response?.data?.error || error.message}`);
  }
}

module.exports = {
  pinFileToIPFS,
  testAuthentication,
  getPinInfo,
  unpinFile
};
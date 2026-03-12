const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Servicio para interactuar con el smart contract PdfRegistry en Sepolia
 * Requiere las siguientes variables de entorno:
 * - SEPOLIA_RPC_URL: URL del proveedor RPC (ej. Infura, Alchemy)
 * - PRIVATE_KEY: Clave privada de la cuenta emisora
 * - CONTRACT_ADDRESS: Dirección del contrato PdfRegistry desplegado
 
* - Configuración requerida en .env:
* - SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_PROJECT_ID
* - PRIVATE_KEY=tu_clave_privada_sin_0x
* - CONTRACT_ADDRESS=0x_direccion_del_contrato_desplegado

*/

// ABI del contrato PdfRegistry (solo las funciones que usamos)
const CONTRACT_ABI = [
  "function registerDocument(bytes32 _fileHash, string calldata _ipfsCid) public",
  "function revokeDocument(bytes32 _fileHash) public",
  "function getDocumentByHash(bytes32 _fileHash) public view returns (bytes32, string memory, address, uint256, uint8)",
  "function isValid(bytes32 _fileHash) public view returns (bool)",
  "event DocumentRegistered(bytes32 indexed fileHash, string ipfsCid, address indexed issuer, uint256 timestamp)",
  "event DocumentRevoked(bytes32 indexed fileHash, address indexed revoker, uint256 timestamp)"
];

/**
 * Inicializa el proveedor, wallet y contrato leyendo env en cada llamada
 * (así siempre se usa el contrato configurado en backend/.env, incluso tras reinicio)
 */
function initializeWeb3() {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    throw new Error('Faltan variables de entorno para Web3: SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS. Revisa backend/.env');
  }

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  return { provider, wallet, contract };
}

/**
 * Registra un documento en el smart contract
 * 
 * @param {Buffer} fileHash - Hash SHA-256 del PDF (32 bytes)
 * @param {string} ipfsCid - CID del archivo en IPFS
 * @returns {Promise<string>} - Hash de la transacción
 */
async function registerDocument(fileHash, ipfsCid) {
  try {
    const { contract, wallet } = initializeWeb3();

    console.log('📝 Registrando documento en blockchain...');
    console.log('   Emisor:', wallet.address);
    console.log('   Hash:', '0x' + fileHash.toString('hex'));
    console.log('   CID:', ipfsCid);

    // Convertir Buffer a bytes32
    const fileHashBytes32 = '0x' + fileHash.toString('hex');

    // Llamar a la función registerDocument
    const tx = await contract.registerDocument(fileHashBytes32, ipfsCid);

    console.log('⏳ Transacción enviada:', tx.hash);
    console.log('   Esperando confirmación...');

    // Esperar confirmación
    const receipt = await tx.wait();

    console.log('✅ Transacción confirmada en el bloque:', receipt.blockNumber);
    console.log('   Gas usado:', receipt.gasUsed.toString());

    return tx.hash;

  } catch (error) {
    console.error('❌ Error al registrar documento:', error);
    
    // Manejar errores específicos del contrato
    if (error.reason) {
      throw new Error(`Error del contrato: ${error.reason}`);
    }
    
    throw new Error(`Error al registrar en blockchain: ${error.message}`);
  }
}

/**
 * Revoca un documento en el smart contract
 * Solo el emisor original puede revocar
 * 
 * @param {Buffer} fileHash - Hash SHA-256 del PDF (32 bytes)
 * @returns {Promise<string>} - Hash de la transacción
 */
async function revokeDocument(fileHash) {
  try {
    const { contract, wallet } = initializeWeb3();

    console.log('🚫 Revocando documento en blockchain...');
    console.log('   Emisor:', wallet.address);
    console.log('   Hash:', '0x' + fileHash.toString('hex'));

    // Convertir Buffer a bytes32
    const fileHashBytes32 = '0x' + fileHash.toString('hex');

    // Llamar a la función revokeDocument
    const tx = await contract.revokeDocument(fileHashBytes32);

    console.log('⏳ Transacción enviada:', tx.hash);
    console.log('   Esperando confirmación...');

    // Esperar confirmación
    const receipt = await tx.wait();

    console.log('✅ Transacción confirmada en el bloque:', receipt.blockNumber);
    console.log('   Gas usado:', receipt.gasUsed.toString());

    return tx.hash;

  } catch (error) {
    console.error('❌ Error al revocar documento:', error);
    
    if (error.reason) {
      throw new Error(`Error del contrato: ${error.reason}`);
    }
    
    throw new Error(`Error al revocar en blockchain: ${error.message}`);
  }
}

/**
 * Consulta un documento en un contrato concreto (solo lectura, no requiere wallet)
 */
async function getDocumentByHashAtAddress(fileHash, contractAddress) {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
  if (!SEPOLIA_RPC_URL || !contractAddress) return null;
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
  const fileHashBytes32 = '0x' + fileHash.toString('hex');
  const result = await contract.getDocumentByHash(fileHashBytes32);
  return {
    fileHash: result[0],
    ipfsCid: result[1],
    issuer: result[2],
    timestamp: result[3],
    status: Number(result[4]),
    _contractAddress: contractAddress
  };
}

/**
 * Lista de direcciones de contrato para verificación.
 * Se obtiene automáticamente de frontend/deployments/*.json (todos los deploys)
 * y de CONTRACT_ADDRESS en .env. Así no hace falta configurar nada a mano.
 */
function getVerifyContractAddresses() {
  const current = (process.env.CONTRACT_ADDRESS || '').trim();
  const seen = new Set();
  const list = [];

  if (current) {
    list.push(current);
    seen.add(current.toLowerCase());
  }

  const deploymentsDir = path.join(__dirname, '..', '..', 'frontend', 'deployments');
  try {
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);
      for (const file of files) {
        if (!file.endsWith('.json') || file.includes('-abi.')) continue;
        const filePath = path.join(deploymentsDir, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const addr = data.contractAddress || data.contract_address;
          if (addr && typeof addr === 'string') {
            const a = addr.trim();
            if (a.length === 42 && !seen.has(a.toLowerCase())) {
              seen.add(a.toLowerCase());
              list.push(a);
            }
          }
        } catch (e) {
          // ignorar archivos que no sean de deployment
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ No se pudo leer frontend/deployments:', e.message);
  }

  const fromEnv = (process.env.CONTRACT_ADDRESSES_VERIFY || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const a of fromEnv) {
    if (a.length === 42 && !seen.has(a.toLowerCase())) {
      seen.add(a.toLowerCase());
      list.push(a);
    }
  }

  return list;
}

/**
 * Consulta la información de un documento por su hash (solo contrato actual)
 * 
 * @param {Buffer} fileHash - Hash SHA-256 del PDF (32 bytes)
 * @returns {Promise<Object>} - Información del documento
 */
async function getDocumentByHash(fileHash) {
  try {
    const { contract } = initializeWeb3();

    console.log('🔍 Consultando documento en blockchain...');
    console.log('   Hash:', '0x' + fileHash.toString('hex'));

    const fileHashBytes32 = '0x' + fileHash.toString('hex');
    const result = await contract.getDocumentByHash(fileHashBytes32);

    const documentInfo = {
      fileHash: result[0],
      ipfsCid: result[1],
      issuer: result[2],
      timestamp: result[3],
      status: Number(result[4])
    };

    console.log('📋 Documento encontrado:', documentInfo);
    return documentInfo;

  } catch (error) {
    console.error('❌ Error al consultar documento:', error);
    throw new Error(`Error al consultar blockchain: ${error.message}`);
  }
}

/**
 * Busca un documento en el contrato actual y en todos los contratos anteriores.
 * Así, aunque hagas nuevos deploys, los PDFs registrados en contratos viejos siguen saliendo como Válidos.
 * 
 * @param {Buffer} fileHash - Hash SHA-256 del PDF (32 bytes)
 * @returns {Promise<Object>} - Información del documento (del primer contrato donde exista)
 */
async function getDocumentByHashAny(fileHash) {
  const addresses = getVerifyContractAddresses();
  if (!addresses.length) {
    throw new Error('No hay contratos para verificar. Revisa CONTRACT_ADDRESS en backend/.env y que exista frontend/deployments/ con al menos un JSON de deploy.');
  }

  console.log('🔍 Verificando documento en', addresses.length, 'contrato(s)...');

  for (const addr of addresses) {
    try {
      const doc = await getDocumentByHashAtAddress(fileHash, addr);
      if (doc && doc.status !== 0) {
        console.log('📋 Documento encontrado en contrato', addr.slice(0, 10) + '...');
        return doc;
      }
    } catch (e) {
      console.warn('   Sin resultado en', addr.slice(0, 10) + '...');
    }
  }

  try {
    const doc = await getDocumentByHashAtAddress(fileHash, addresses[0]);
    return doc || { fileHash: '0x', ipfsCid: '', issuer: null, timestamp: null, status: 0 };
  } catch (e) {
    return { fileHash: '0x', ipfsCid: '', issuer: null, timestamp: null, status: 0 };
  }
}

/**
 * Verifica si un documento es válido (status = Activo)
 * 
 * @param {Buffer} fileHash - Hash SHA-256 del PDF (32 bytes)
 * @returns {Promise<boolean>} - true si el documento está activo
 */
async function isValid(fileHash) {
  try {
    const { contract } = initializeWeb3();

    // Convertir Buffer a bytes32
    const fileHashBytes32 = '0x' + fileHash.toString('hex');

    // Llamar a la función isValid (view function)
    const valid = await contract.isValid(fileHashBytes32);

    console.log('✓ Documento válido:', valid);

    return valid;

  } catch (error) {
    console.error('❌ Error al validar documento:', error);
    throw new Error(`Error al validar en blockchain: ${error.message}`);
  }
}

/**
 * Obtiene el balance de ETH de la cuenta emisora
 * 
 * @returns {Promise<string>} - Balance en ETH
 */
async function getBalance() {
  try {
    const { provider, wallet } = initializeWeb3();

    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);

    console.log(`💰 Balance de ${wallet.address}: ${balanceInEth} ETH`);

    return balanceInEth;

  } catch (error) {
    console.error('❌ Error al obtener balance:', error);
    throw new Error(`Error al consultar balance: ${error.message}`);
  }
}

module.exports = {
  registerDocument,
  revokeDocument,
  getDocumentByHash,
  getDocumentByHashAny,
  getVerifyContractAddresses,
  isValid,
  getBalance
};
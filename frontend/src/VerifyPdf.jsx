import React, { useState } from 'react';
import './VerifyPdf.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001');

function VerifyPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileHash, setFileHash] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor seleccione un archivo PDF válido');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setFileHash(null);
    }
  };

  const calculateHash = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          
          // Calcular SHA-256 usando Web Crypto API
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          
          // Convertir a hex string
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          const fileHashHex = '0x' + hashHex;
          
          resolve(fileHashHex);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor seleccione un archivo PDF');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔐 Calculando hash SHA-256 del PDF...');
      
      // Calcular hash en el navegador
      const calculatedHash = await calculateHash(file);
      setFileHash(calculatedHash);
      
      console.log('✅ Hash calculado:', calculatedHash);
      console.log('📤 Enviando hash al backend para verificación...');

      // Enviar hash al backend para verificar en blockchain
      const response = await fetch(`${BACKEND_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileHashHex: calculatedHash })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar el documento');
      }

      console.log('✅ Respuesta del backend:', data);

      setResult(data);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al verificar el documento');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado al portapapeles`);
  };

  const getStatusIcon = (statusText) => {
    switch (statusText) {
      case 'Válido':
        return '✅';
      case 'Revocado':
        return '🚫';
      case 'No registrado':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusClass = (statusText) => {
    switch (statusText) {
      case 'Válido':
        return 'status-valid';
      case 'Revocado':
        return 'status-revoked';
      case 'No registrado':
        return 'status-not-found';
      default:
        return 'status-unknown';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'N/A';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="verify-pdf-container">
      <form onSubmit={handleSubmit} className="verify-form">
        <div className="form-group">
          <label htmlFor="pdfFile" className="file-label">
            📄 Seleccione el archivo PDF a verificar
          </label>
          <div className="file-input-wrapper">
            <input
              type="file"
              id="pdfFile"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
            {file && (
              <div className="file-info">
                <span className="file-name">📎 {file.name}</span>
                <span className="file-size">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading || !file}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Verificando...
            </>
          ) : (
            <>
              🔍 Verificar Documento
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-error">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {fileHash && !result && loading && (
        <div className="alert alert-info">
          <p>🔐 Hash calculado: <code>{fileHash}</code></p>
          <p>⏳ Consultando blockchain...</p>
        </div>
      )}

      {result && (
        <div className={`alert alert-result ${getStatusClass(result.status)}`}>
          <div className="status-header">
            <h3>
              {getStatusIcon(result.status)} Estado del Documento: {result.status}
            </h3>
          </div>

          <div className="result-section">
            <div className="result-item">
              <label>🔐 Hash SHA-256:</label>
              <div className="result-value">
                <code>{result.fileHashHex}</code>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(result.fileHashHex, 'Hash')}
                >
                  📋 Copiar
                </button>
              </div>
            </div>

            {result.ipfsCid && (
              <div className="result-item">
                <label>📌 IPFS CID:</label>
                <div className="result-value">
                  <code>{result.ipfsCid}</code>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(result.ipfsCid, 'CID')}
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
            )}

            {result.issuer && result.issuer !== '0x0000000000000000000000000000000000000000' && (
              <div className="result-item">
                <label>👤 Emisor:</label>
                <div className="result-value">
                  <code title={result.issuer}>{formatAddress(result.issuer)}</code>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(result.issuer, 'Dirección del emisor')}
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
            )}

            {result.timestamp && (
              <div className="result-item">
                <label>🕐 Fecha de Registro:</label>
                <div className="result-value">
                  <span className="timestamp">{formatTimestamp(result.timestamp)}</span>
                </div>
              </div>
            )}

            {result.isValid && result.ipfsUrl && (
              <div className="result-actions">
                <a 
                  href={result.ipfsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button primary"
                >
                  📄 Ver PDF Original en IPFS
                </a>
                {result.issuer && result.issuer !== '0x0000000000000000000000000000000000000000' && (
                  <a 
                    href={`https://sepolia.etherscan.io/address/${result.issuer}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button secondary"
                  >
                    🔗 Ver Emisor en Etherscan
                  </a>
                )}
              </div>
            )}
          </div>

          <div className={`info-box ${getStatusClass(result.status)}`}>
            {result.isValid ? (
              <p>
                <strong>✅ Documento Válido:</strong> Este documento está registrado 
                en la blockchain de Sepolia y su integridad ha sido verificada. 
                El hash coincide con el registro on-chain.
              </p>
            ) : result.status === 'Revocado' ? (
              <p>
                <strong>🚫 Documento Revocado:</strong> Este documento fue registrado 
                previamente pero ha sido revocado por el emisor. No debe considerarse válido.
              </p>
            ) : (
              <p>
                <strong>❌ Documento No Registrado:</strong> Este documento no se encuentra 
                registrado en la blockchain. Puede ser un documento falso o no autorizado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyPdf;
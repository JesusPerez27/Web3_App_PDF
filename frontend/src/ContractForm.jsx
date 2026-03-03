import React, { useState } from 'react';
import './ContractForm.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001');

function ContractForm() {
  const [formData, setFormData] = useState({
    clientName: '',
    serviceDescription: '',
    consecutiveNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.clientName || !formData.serviceDescription || !formData.consecutiveNumber) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📤 Enviando datos al backend:', formData);

      const response = await fetch(`${BACKEND_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el documento');
      }

      console.log('✅ Respuesta del backend:', data);

      setResult(data);
      
      // Limpiar formulario
      setFormData({
        clientName: '',
        serviceDescription: '',
        consecutiveNumber: ''
      });

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado al portapapeles`);
  };

  return (
    <div className="contract-form-container">
      <form onSubmit={handleSubmit} className="contract-form">
        <div className="form-group">
          <label htmlFor="clientName">
            👤 Nombre del Cliente <span className="required">*</span>
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez García"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="serviceDescription">
            📋 Descripción del Servicio <span className="required">*</span>
          </label>
          <textarea
            id="serviceDescription"
            name="serviceDescription"
            value={formData.serviceDescription}
            onChange={handleChange}
            placeholder="Ej: Desarrollo de aplicación web con tecnología React y Node.js"
            rows="4"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="consecutiveNumber">
            🔢 Número Consecutivo <span className="required">*</span>
          </label>
          <input
            type="text"
            id="consecutiveNumber"
            name="consecutiveNumber"
            value={formData.consecutiveNumber}
            onChange={handleChange}
            placeholder="Ej: 2024-001"
            disabled={loading}
            required
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Procesando...
            </>
          ) : (
            <>
              🚀 Generar y Registrar Contrato
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-error">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <h3>✅ Contrato Registrado Exitosamente</h3>
          
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

            <div className="result-item">
              <label>⛓️ Transaction Hash:</label>
              <div className="result-value">
                <code>{result.txHash}</code>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(result.txHash, 'TxHash')}
                >
                  📋 Copiar
                </button>
              </div>
            </div>

            <div className="result-actions">
              <a 
                href={result.ipfsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="action-button primary"
              >
                📄 Ver PDF en IPFS
              </a>
              <a 
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="action-button secondary"
              >
                🔗 Ver en Etherscan
              </a>
            </div>
          </div>

          <div className="info-box">
            <p>
              <strong>ℹ️ Información:</strong> El contrato ha sido generado, 
              almacenado en IPFS y registrado en la blockchain de Sepolia. 
              Guarde el hash SHA-256 para futuras verificaciones.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractForm;
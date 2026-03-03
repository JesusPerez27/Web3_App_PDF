import React, { useState } from 'react';
import './App.css';
import ContractForm from './ContractForm';
import VerifyPdf from './VerifyPdf';

function App() {
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' o 'verify'

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔐 Sistema Web3 - Registro de Contratos PDF</h1>
        <p className="subtitle">IPFS + Pinata + Blockchain (Sepolia)</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab-button ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          📝 Emitir Contrato
        </button>
        <button
          className={`tab-button ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          🔍 Verificar Contrato
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'issue' ? (
          <div className="tab-content">
            <h2>Flujo A: Emisión y Resguardo de Contrato</h2>
            <p className="description">
              Complete el formulario para generar un contrato PDF, subirlo a IPFS 
              y registrarlo en blockchain (Sepolia).
            </p>
            <ContractForm />
          </div>
        ) : (
          <div className="tab-content">
            <h2>Flujo B: Verificación de Contrato</h2>
            <p className="description">
              Suba un PDF para verificar su autenticidad y estado en blockchain.
            </p>
            <VerifyPdf />
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>
          Sistema Web3 para Registro y Verificación de Contratos PDF | 
          <a 
            href="https://sepolia.etherscan.io/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {' '}Ver en Sepolia Etherscan
          </a>
        </p>
        <p className="tech-stack">
          Stack: React.js • Node.js • Solidity • IPFS • Pinata • Hardhat
        </p>
      </footer>
    </div>
  );
}

export default App;
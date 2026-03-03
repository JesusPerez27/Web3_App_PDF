const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Iniciando deployment del contrato PdfRegistry...\n");

  // Obtener el deployer
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Desplegando contrato con la cuenta:", deployer.address);
  
  // Obtener balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", hre.ethers.formatEther(balance), "ETH");
  
  // Verificar que hay suficiente balance
  if (balance === 0n) {
    console.error("\n❌ Error: La cuenta no tiene ETH para desplegar el contrato");
    console.log("   Obtén ETH de Sepolia en: https://sepoliafaucet.com/");
    process.exit(1);
  }
  
  console.log("🌐 Red:", hre.network.name);
  console.log("⛓️  Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("");

  // Obtener el contrato factory
  console.log("📦 Obteniendo ContractFactory...");
  const PdfRegistry = await hre.ethers.getContractFactory("PdfRegistry");
  
  console.log("⏳ Desplegando contrato PdfRegistry...");
  console.log("   (Esto puede tomar unos minutos...)\n");
  
  // Desplegar el contrato
  const pdfRegistry = await PdfRegistry.deploy();
  
  // Esperar a que se despliegue
  await pdfRegistry.waitForDeployment();
  
  const contractAddress = await pdfRegistry.getAddress();
  const deploymentTx = pdfRegistry.deploymentTransaction();
  
  console.log("✅ Contrato PdfRegistry desplegado exitosamente!\n");
  console.log("═══════════════════════════════════════════════════════");
  console.log("📋 INFORMACIÓN DEL DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════════");
  console.log("🌐 Red:                ", hre.network.name);
  console.log("📍 Dirección:          ", contractAddress);
  console.log("👤 Deployer:           ", deployer.address);
  console.log("📦 Transaction Hash:   ", deploymentTx.hash);
  console.log("⛽ Gas usado:          ", deploymentTx.gasLimit.toString());
  console.log("🕐 Timestamp:          ", new Date().toISOString());
  console.log("═══════════════════════════════════════════════════════\n");
  
  // Guardar la información del deployment
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    contractName: "PdfRegistry",
    contractAddress: contractAddress,
    deployer: deployer.address,
    transactionHash: deploymentTx.hash,
    gasLimit: deploymentTx.gasLimit.toString(),
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Crear carpeta deployments si no existe
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Guardar en archivo JSON
  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  // También guardar como "latest"
  const latestFilepath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Información del deployment guardada en:");
  console.log("   -", filepath);
  console.log("   -", latestFilepath);
  console.log("");
  
  // Actualizar el archivo .env con la dirección del contrato
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Actualizar o agregar CONTRACT_ADDRESS
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Archivo .env actualizado con CONTRACT_ADDRESS\n");
  }
  
  // Si estamos en Sepolia, mostrar información adicional
  if (hre.network.name === "sepolia") {
    console.log("🔗 ENLACES ÚTILES");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📄 Contrato en Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("");
    console.log("📝 Transacción en Etherscan:");
    console.log(`   https://sepolia.etherscan.io/tx/${deploymentTx.hash}`);
    console.log("═══════════════════════════════════════════════════════\n");
    
    // Verificación automática en Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("⏳ Esperando 5 confirmaciones antes de verificar en Etherscan...");
      await pdfRegistry.deploymentTransaction().wait(5);
      console.log("✅ Confirmaciones recibidas\n");
      
      try {
        console.log("🔍 Verificando contrato en Etherscan...");
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: []
        });
        console.log("✅ Contrato verificado exitosamente en Etherscan!\n");
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log("ℹ️  El contrato ya está verificado en Etherscan\n");
        } else {
          console.log("⚠️  Error al verificar contrato automáticamente:", error.message);
          console.log("\n🔧 Puedes verificarlo manualmente con:");
          console.log(`   npx hardhat verify --network sepolia ${contractAddress}\n`);
        }
      }
    } else {
      console.log("⚠️  ETHERSCAN_API_KEY no configurado");
      console.log("   Para verificar el contrato, agrega tu API key al .env y ejecuta:");
      console.log(`   npx hardhat verify --network sepolia ${contractAddress}\n`);
    }
  }
  
  // Instrucciones finales
  console.log("✨ DEPLOYMENT COMPLETADO EXITOSAMENTE!\n");
  console.log("📝 PRÓXIMOS PASOS:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("1. Copia la dirección del contrato:");
  console.log(`   ${contractAddress}`);
  console.log("");
  console.log("2. Verifica que esté en tu archivo .env:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("3. Actualiza el archivo backend/src/.env si es diferente");
  console.log("");
  console.log("4. Reinicia el backend:");
  console.log("   cd backend && npm start");
  console.log("");
  console.log("5. Inicia el frontend:");
  console.log("   cd frontend && npm start");
  console.log("═══════════════════════════════════════════════════════\n");
  
  // Mostrar ABI simplificado para referencia
  console.log("📋 ABI del contrato (para referencia):");
  console.log("═══════════════════════════════════════════════════════");
  const artifact = await hre.artifacts.readArtifact("PdfRegistry");
  const abiPath = path.join(deploymentsDir, `${hre.network.name}-abi.json`);
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`   Guardado en: ${abiPath}\n`);
}

// Manejo de errores
main()
  .then(() => {
    console.log("🎉 Script de deployment finalizado correctamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ ERROR DURANTE EL DEPLOYMENT");
    console.error("═══════════════════════════════════════════════════════");
    console.error(error);
    console.error("═══════════════════════════════════════════════════════\n");
    
    // Mensajes de ayuda según el tipo de error
    if (error.message.includes("insufficient funds")) {
      console.log("💡 SOLUCIÓN: Tu cuenta no tiene suficiente ETH");
      console.log("   Obtén ETH de Sepolia en: https://sepoliafaucet.com/\n");
    } else if (error.message.includes("invalid API key")) {
      console.log("💡 SOLUCIÓN: Tu SEPOLIA_RPC_URL no es válida");
      console.log("   Verifica tu API key de Infura o Alchemy\n");
    } else if (error.message.includes("private key")) {
      console.log("💡 SOLUCIÓN: Tu PRIVATE_KEY no es válida");
      console.log("   Verifica que esté en el .env sin el prefijo 0x\n");
    }
    
    process.exit(1);
  });
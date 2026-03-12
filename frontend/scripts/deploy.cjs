const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Iniciando deployment del contrato PdfRegistry...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Desplegando contrato con la cuenta:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("\n❌ Error: La cuenta no tiene ETH para desplegar el contrato");
    console.log("   Obtén ETH de Sepolia en: https://sepoliafaucet.com/");
    process.exit(1);
  }

  console.log("🌐 Red:", hre.network.name);
  console.log("⛓️  Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("");

  console.log("📦 Obteniendo ContractFactory...");
  const PdfRegistry = await hre.ethers.getContractFactory("PdfRegistry");
  console.log("⏳ Desplegando contrato PdfRegistry...\n");

  const pdfRegistry = await PdfRegistry.deploy();
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
  console.log("═══════════════════════════════════════════════════════\n");

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

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

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  const latestFilepath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment guardado en:", latestFilepath, "\n");

  const frontendEnvPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ frontend/.env actualizado con CONTRACT_ADDRESS\n");
  }

  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  if (fs.existsSync(backendEnvPath)) {
    let envContent = fs.readFileSync(backendEnvPath, "utf8");
    const prevMatch = envContent.match(/CONTRACT_ADDRESS=(.+)/);
    const prevAddress = prevMatch ? prevMatch[1].trim() : "";
    const isNewContract = prevAddress && prevAddress !== contractAddress;

    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }

    if (isNewContract && prevAddress) {
      const verifyKey = "CONTRACT_ADDRESSES_VERIFY";
      const verifyMatch = envContent.match(new RegExp(verifyKey + "=(.*)"));
      const existing = verifyMatch ? verifyMatch[1].trim() : "";
      const list = existing ? existing.split(",").map((s) => s.trim()).filter(Boolean) : [];
      if (!list.includes(prevAddress)) list.push(prevAddress);
      const value = list.join(",");
      if (envContent.includes(verifyKey + "=")) {
        envContent = envContent.replace(new RegExp(verifyKey + "=.*"), verifyKey + "=" + value);
      } else {
        envContent += `\n${verifyKey}=${value}\n`;
      }
      console.log("✅ backend/.env: CONTRACT_ADDRESS actualizado y anterior añadido a CONTRACT_ADDRESSES_VERIFY");
      console.log("   La verificación seguirá encontrando documentos de contratos anteriores.\n");
    } else {
      console.log("✅ backend/.env actualizado con CONTRACT_ADDRESS\n");
    }
    fs.writeFileSync(backendEnvPath, envContent);
  }

  if (hre.network.name === "sepolia") {
    console.log("🔗 Contrato:", "https://sepolia.etherscan.io/address/" + contractAddress);
    console.log("🔗 Tx:", "https://sepolia.etherscan.io/tx/" + deploymentTx.hash + "\n");
  }

  console.log("✨ DEPLOYMENT COMPLETADO. Reinicia el backend y prueba emitir/verificar.\n");

  const artifact = await hre.artifacts.readArtifact("PdfRegistry");
  const abiPath = path.join(deploymentsDir, `${hre.network.name}-abi.json`);
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("📋 ABI guardado en:", abiPath, "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    if (error.message.includes("insufficient funds")) console.log("💡 Obtén ETH: https://sepoliafaucet.com/");
    if (error.message.includes("SEPOLIA_RPC") || error.message.includes("API key")) console.log("💡 Configura SEPOLIA_RPC_URL y PRIVATE_KEY en frontend/.env");
    process.exit(1);
  });

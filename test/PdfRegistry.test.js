const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PdfRegistry", function () {
  let PdfRegistry;
  let pdfRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Obtener cuentas de prueba
    [owner, addr1, addr2] = await ethers.getSigners();

    // Desplegar el contrato
    PdfRegistry = await ethers.getContractFactory("PdfRegistry");
    pdfRegistry = await PdfRegistry.deploy();
    await pdfRegistry.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Debe desplegar el contrato correctamente", async function () {
      expect(await pdfRegistry.getAddress()).to.be.properAddress;
    });
  });

  describe("Registro de documentos", function () {
    it("Debe registrar un documento correctamente", async function () {
      const fileHash = ethers.id("test-document-hash");
      const ipfsCid = "QmTestCID123456789";

      await expect(pdfRegistry.registerDocument(fileHash, ipfsCid))
        .to.emit(pdfRegistry, "DocumentRegistered")
        .withArgs(fileHash, ipfsCid, owner.address, await getBlockTimestamp());

      const [hash, cid, issuer, timestamp, status] = await pdfRegistry.getDocumentByHash(fileHash);
      
      expect(hash).to.equal(fileHash);
      expect(cid).to.equal(ipfsCid);
      expect(issuer).to.equal(owner.address);
      expect(status).to.equal(1); // DocumentStatus.Activo
    });

    it("No debe permitir registrar un documento duplicado", async function () {
      const fileHash = ethers.id("test-document-hash");
      const ipfsCid = "QmTestCID123456789";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);

      await expect(
        pdfRegistry.registerDocument(fileHash, ipfsCid)
      ).to.be.revertedWith("El documento ya esta registrado.");
    });

    it("Debe permitir a diferentes usuarios registrar documentos diferentes", async function () {
      const fileHash1 = ethers.id("document-1");
      const fileHash2 = ethers.id("document-2");
      const ipfsCid1 = "QmCID1";
      const ipfsCid2 = "QmCID2";

      await pdfRegistry.connect(owner).registerDocument(fileHash1, ipfsCid1);
      await pdfRegistry.connect(addr1).registerDocument(fileHash2, ipfsCid2);

      const [, , issuer1, , status1] = await pdfRegistry.getDocumentByHash(fileHash1);
      const [, , issuer2, , status2] = await pdfRegistry.getDocumentByHash(fileHash2);

      expect(issuer1).to.equal(owner.address);
      expect(issuer2).to.equal(addr1.address);
      expect(status1).to.equal(1); // Activo
      expect(status2).to.equal(1); // Activo
    });
  });

  describe("Consulta de documentos", function () {
    it("Debe devolver status Inexistente para documentos no registrados", async function () {
      const fileHash = ethers.id("non-existent-document");
      const [, , , , status] = await pdfRegistry.getDocumentByHash(fileHash);
      
      expect(status).to.equal(0); // DocumentStatus.Inexistente
    });

    it("Debe devolver la información correcta de un documento registrado", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);

      const [hash, cid, issuer, timestamp, status] = await pdfRegistry.getDocumentByHash(fileHash);

      expect(hash).to.equal(fileHash);
      expect(cid).to.equal(ipfsCid);
      expect(issuer).to.equal(owner.address);
      expect(timestamp).to.be.gt(0);
      expect(status).to.equal(1); // Activo
    });
  });

  describe("Revocación de documentos", function () {
    it("Debe permitir al emisor revocar su documento", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);

      await expect(pdfRegistry.revokeDocument(fileHash))
        .to.emit(pdfRegistry, "DocumentRevoked")
        .withArgs(fileHash, owner.address, await getBlockTimestamp());

      const [, , , , status] = await pdfRegistry.getDocumentByHash(fileHash);
      expect(status).to.equal(2); // DocumentStatus.Revocado
    });

    it("No debe permitir a un tercero revocar un documento", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.connect(owner).registerDocument(fileHash, ipfsCid);

      await expect(
        pdfRegistry.connect(addr1).revokeDocument(fileHash)
      ).to.be.revertedWith("Solo el emisor puede revocar este documento.");
    });

    it("No debe permitir revocar un documento inexistente", async function () {
      const fileHash = ethers.id("non-existent-document");

      await expect(
        pdfRegistry.revokeDocument(fileHash)
      ).to.be.revertedWith("Solo el emisor puede revocar este documento.");
    });

    it("No debe permitir revocar un documento ya revocado", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);
      await pdfRegistry.revokeDocument(fileHash);

      await expect(
        pdfRegistry.revokeDocument(fileHash)
      ).to.be.revertedWith("El documento no esta activo o no existe.");
    });
  });

  describe("Validación de documentos (isValid)", function () {
    it("Debe devolver true para un documento activo", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);

      expect(await pdfRegistry.isValid(fileHash)).to.be.true;
    });

    it("Debe devolver false para un documento revocado", async function () {
      const fileHash = ethers.id("test-document");
      const ipfsCid = "QmTestCID";

      await pdfRegistry.registerDocument(fileHash, ipfsCid);
      await pdfRegistry.revokeDocument(fileHash);

      expect(await pdfRegistry.isValid(fileHash)).to.be.false;
    });

    it("Debe devolver false para un documento inexistente", async function () {
      const fileHash = ethers.id("non-existent-document");

      expect(await pdfRegistry.isValid(fileHash)).to.be.false;
    });
  });

  // Función auxiliar para obtener el timestamp del último bloque
  async function getBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});
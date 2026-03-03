const PDFDocument = require('pdfkit');

/**
 * Genera un PDF de contrato de servicio con plantilla legal
 * Generación determinista: mismo input = mismo PDF = mismo hash
 * 
 * @param {Object} data - Datos del contrato
 * @param {string} data.clientName - Nombre del cliente
 * @param {string} data.serviceDescription - Descripción del servicio
 * @param {string} data.consecutiveNumber - Número consecutivo del contrato
 * @param {string} data.contractDate - Fecha del contrato (YYYY-MM-DD)
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generateContractPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const { clientName, serviceDescription, consecutiveNumber, contractDate } = data;

      // Crear documento PDF con opciones deterministas
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        },
        info: {
          Title: `Contrato de Servicio ${consecutiveNumber}`,
          Author: 'Mi Empresa Demo S.A. de C.V.',
          Subject: 'Contrato de Prestación de Servicios',
          CreationDate: new Date(contractDate) // Fecha fija para determinismo
        }
      });

      const chunks = [];

      // Capturar el PDF en memoria
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- CONTENIDO DEL CONTRATO ---

      // Encabezado
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('CONTRATO DE PRESTACIÓN DE SERVICIOS', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Contrato No. ${consecutiveNumber}`, { align: 'center' })
         .moveDown(1.5);

      // Cláusula: PARTES
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('I. PARTES', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `El presente contrato se celebra entre Mi Empresa Demo S.A. de C.V., ` +
           `en adelante "EL PRESTADOR", y ${clientName}, en adelante "EL CLIENTE".`,
           { align: 'justify' }
         )
         .moveDown(1);

      // Cláusula: OBJETO
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('II. OBJETO DEL CONTRATO', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `EL PRESTADOR se compromete a proporcionar a EL CLIENTE los siguientes servicios: ` +
           `${serviceDescription}.`,
           { align: 'justify' }
         )
         .moveDown(1);

      // Cláusula: VIGENCIA
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('III. VIGENCIA', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `El presente contrato tendrá una vigencia de 12 (doce) meses contados a partir ` +
           `de la fecha de firma, pudiendo ser renovado mediante acuerdo por escrito entre las partes.`,
           { align: 'justify' }
         )
         .moveDown(1);

      // Cláusula: CONTRAPRESTACIÓN
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('IV. CONTRAPRESTACIÓN', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `EL CLIENTE se obliga a pagar a EL PRESTADOR la cantidad acordada según lo estipulado ` +
           `en la propuesta comercial anexa al presente contrato. Los pagos se realizarán de forma ` +
           `mensual mediante transferencia bancaria.`,
           { align: 'justify' }
         )
         .moveDown(1);

      // Cláusula: CONFIDENCIALIDAD
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('V. CONFIDENCIALIDAD', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `Ambas partes se comprometen a mantener en estricta confidencialidad toda la información ` +
           `que se intercambie durante la vigencia del presente contrato, así como a no divulgarla ` +
           `a terceros sin el consentimiento previo y por escrito de la otra parte.`,
           { align: 'justify' }
         )
         .moveDown(1);

      // Cláusula: JURISDICCIÓN
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('VI. JURISDICCIÓN Y LEY APLICABLE', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(
           `Para la interpretación y cumplimiento del presente contrato, las partes se someten ` +
           `expresamente a las leyes aplicables en la Ciudad de México y a la jurisdicción de ` +
           `los tribunales competentes en dicha ciudad, renunciando a cualquier otro fuero que ` +
           `pudiera corresponderles por razón de sus domicilios presentes o futuros.`,
           { align: 'justify' }
         )
         .moveDown(2);

      // Pie de firma
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Firmado en Ciudad de México, a ${contractDate}`, { align: 'center' })
         .moveDown(3);

      // Espacios para firmas
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('_______________________________', 100, doc.y, { continued: false })
         .text('_______________________________', 350, doc.y - 12, { continued: false });

      doc.fontSize(9)
         .font('Helvetica')
         .text('EL PRESTADOR', 100, doc.y + 5, { continued: false })
         .text('EL CLIENTE', 350, doc.y - 9, { continued: false });

      doc.moveDown(1);

      doc.fontSize(9)
         .font('Helvetica')
         .text('Mi Empresa Demo S.A. de C.V.', 100, doc.y, { continued: false })
         .text(clientName, 350, doc.y - 9, { continued: false });

      // Footer con información del contrato
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text(
           `Documento generado electrónicamente | Contrato ${consecutiveNumber} | ${contractDate}`,
           72,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 144 }
         );

      // Finalizar el documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateContractPdf
};
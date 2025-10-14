import jsPDF from "jspdf";
import "jspdf-autotable";

export const generatePlanilla = (ayuda, setAlert) => {
  try {
    const doc = new jsPDF();
    let y = 10; // Starting Y position
    const margin = 10;
    const maxWidth = 190; // A4 width minus margins, in mm
    const pageWidth = 210; // A4 width in mm
    const imageWidth = 50;
    const imageHeight = 50;

    // Helper function to add text and update Y position with text wrapping
    const addText = (text, x, fontSize = 10, isBold = false, lineSpacing = 5) => {
      doc.setFontSize(fontSize);
      doc.setFont("arial", isBold ? "bold" : "normal");
      const splitText = doc.splitTextToSize(text, maxWidth - x);
      doc.text(splitText, x, y, { align: "justify" }); // Justified text
      y += lineSpacing * splitText.length;
    };

    // Add header image from public folder
    const headerImage = 'cabezaradocumento.jpg'; // Ruta corregida para la imagen en public/
    const headerWidth = 150; // Modifica este valor para cambiar el ancho en mm (ejemplo: 150mm)
    const xHeaderPosition = (pageWidth - headerWidth) / 2; // Calcula la posición x para centrar la imagen
    doc.addImage(headerImage, 'JPEG', xHeaderPosition, 10, headerWidth, 20); // Imagen centrada, altura de 20mm
    y = 30; // Move y position below header

    // Document content matching the template
    // Move N° to right side with ayuda.codigo in uppercase
    const codigo = ayuda.codigo ? ayuda.codigo.toUpperCase() : '_______';
    addText(codigo, pageWidth - margin - 30, 10, false); // Right-aligned at 30mm from right edge
    y += 6; // Reduced space after N°
    addText("RECEPCIÓN DE DOCUMENTOS DE SOLICITUD DE AYUDA ECONÓMICA", margin, 12, true); // Title slightly larger
    y += 10; // Reduced space after title
    addText("", margin, 10); // Empty line
    addText(`NOMBRES Y APELLIDOS: ${(ayuda.beneficiario || '_______________________________').toUpperCase()}`, margin, 10);
    y += 3; // Reduced small space
    addText(`CÉDULA: ${(ayuda.nacionalidad || '')}-${(ayuda.cedula || '_____________').toUpperCase()}`, margin, 10);
    y += 3; // Reduced small space
    addText(`DIRECCIÓN: ${(ayuda.direccion || '______________________________________').toUpperCase()}`, margin, 10);
    addText("_________________________________________________________________________________________", margin, 10);
    addText("_________________________________________________________________________________________", margin, 10);
    y += 6; // Reduced space after lines
    addText("TELEFONOS:", margin, 10, true);
    y += 3; // Reduced small space
    addText(`MOVIL: ${(ayuda.telefono || '______________________________').toUpperCase()}`, margin + 5, 10);
    addText(`FIJO: ${('' || '______________________________').toUpperCase()}`, margin + 5, 10);
    addText(`CORREO: ${('' || '______________________________________').toUpperCase()}`, margin + 5, 10);
    y += 6; // Reduced space after phones
    addText(`MOTIVO DE LA AYUDA: ${(ayuda.observacion || '_______________________________').toUpperCase()}`, margin, 10);
    y += 6; // Reduced space after motive
    addText("TIPO DE AYUDA:", margin, 10, true);
    y += 3; // Reduced small space

    // Types of aid with "o" bullets in two-column layout
    const tipos = [
      "EXAMENES DE LABORATORIO", "TANQUE",
      "ECOS",                    "LAMINAS",
      "RX",                      "MANTO",
      "AYUDA ECONOMICA",         "CEMENTO",
      "RECETAS MÉDICAS",
    ];
    let currentY = y; // Store the current y position
    for (let i = 0; i < tipos.length; i += 2) {
      const leftText = `o    ${ayuda.tipo === tipos[i] ? 'X ' : ''}${tipos[i]}`;
      const rightText = i + 1 < tipos.length ? `o    ${ayuda.tipo === tipos[i + 1] ? 'X ' : ''}${tipos[i + 1]}` : '';
      doc.setFontSize(10);
      doc.setFont("arial", "normal");
      const leftSplit = doc.splitTextToSize(leftText, (maxWidth - margin) / 2 - 5); // Half width minus padding
      const rightSplit = doc.splitTextToSize(rightText, (maxWidth - margin) / 2 - 5);
      doc.text(leftSplit, margin + 5, currentY);
      if (rightText) {
        doc.text(rightSplit, margin + (maxWidth / 2) + 5, currentY); // Second column
      }
      currentY += 4; // Reduced line spacing for rows
    }
    y = currentY; // Update y for the next section

    addText(
      `o    OTROS: ${(tipos.includes(ayuda.tipo) ? (ayuda.subtipo || '_________________') : (ayuda.tipo || ayuda.subtipo || '_________________')).toUpperCase()}`,
      margin + 5,
      10,
      false, 4
    );

    y += 6; // Reduced space after aid types
    addText(`DATOS BANCARIOS: ${('' || '______________________________________').toUpperCase()}`, margin, 10);
    y += 6; // Reduced space after bank data
    addText("FIRMA DEL BENEFICIOARIO:", margin, 10, true);
    y += 3; // Reduced small space
    addText("____________________________", margin + 5, 10);
    y += 6; // Reduced space after signature
    addText(`OBSERVACIÓN: ${(ayuda.observacion || '_______________________________').toUpperCase()}`, margin, 10);
    y += 6; // Reduced space after observation
    // Combine FECHA DE RECIBIDO and RECIBIDO POR on the same line
    const fechaText = `FECHA DE RECIBIDO: ${(ayuda.fecha || new Date().toLocaleDateString('es-ES')).toUpperCase()}             __________________`;
    addText(fechaText, margin, 10, false, 0, 'left');
    addText("RECIBIDO POR: ______________________", margin + 70, 10, false, 0, 'left'); // Adjusted x position for alignment
    y += 10; // Reduced space after combined line

    // Add images at the bottom (before footer)
    const image1Url = 'https://via.placeholder.com/50x50?text=Image1'; // Placeholder for image1.jpeg
    const image2Url = 'https://via.placeholder.com/50x50?text=Image2'; // Placeholder for image2.jpeg
    doc.addImage(image1Url, 'JPEG', margin, y, imageWidth, imageHeight);
    y += imageHeight + 5; // Add spacing between images
    doc.addImage(image2Url, 'JPEG', margin, y, imageWidth, imageHeight);
    y += 6; // Reduced space after images

    // Add footer image from public folder
    const footerImage = 'piedocumento.jpg'; // Ruta corregida para la imagen en public/
    const footerWidth = 150; // Modifica este valor para cambiar el ancho en mm (ejemplo: 150mm)
    const xFooterPosition = (pageWidth - footerWidth) / 2; // Calcula la posición x para centrar la imagen
    const footerHeight = 5; // Ajusta la altura en mm según necesites
    doc.addImage(footerImage, 'JPEG', xFooterPosition, doc.internal.pageSize.height - footerHeight - 10, footerWidth, footerHeight);

    // Save the PDF
    doc.save(`Ficha_Solicitud_${ayuda.codigo || 'Ayuda'}.pdf`);
    setAlert({ show: true, message: "Planilla generada exitosamente.", type: "success" });
  } catch (error) {
    setAlert({ show: true, message: "Error al generar la planilla.", type: "error" });
  }
};
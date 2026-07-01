import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Importación correcta

/**
 * Genera un PDF con el formulario de registro de entrada de embarcaciones foráneas
 * @param {Object} registro - Datos del registro de embarcación
 * @param {Function} setAlert - Función para mostrar alertas
 */
export const generatePlanilla = (registro, setAlert) => {
  if (!registro) {
    setAlert({ show: true, message: "No hay registro seleccionado.", type: "warning" });
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // ============================================
    // 1. ENCABEZADO (logo y título)
    // ============================================
    try {
      // Logo (ajusta la ruta según tu proyecto)
      const logoImg = "/logo_maneiro.png"; // Cambia por la ruta de tu logo
      doc.addImage(logoImg, "PNG", margin, 10, 25, 25);
    } catch (e) {
      // Si no hay logo, continuar
    }

    // Título principal
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Maneiro", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Municipio ejemplar", pageWidth / 2, 28, { align: "center" });

    // Línea divisoria
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, 34, pageWidth - margin, 34);
    y = 40;

    // Título del formulario
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE ENTRADA DE EMBARCACIONES FORÁNEAS", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("PUERTO DE PAMPATAR - MUNICIPIO MANEIRO", pageWidth / 2, y, { align: "center" });
    y += 10;

    // ============================================
    // 2. FECHA, HORA Y N° DE CONTROL
    // ============================================
    const fechaIngreso = registro.fecha_ingreso
      ? new Date(registro.fecha_ingreso).toLocaleDateString("es-ES")
      : "______/______/______";
    const hora = registro.hora_ingreso || "______:______";
    const numeroControl = registro.numero_control || "_______________";

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Ingreso: ${fechaIngreso}`, margin, y);
    doc.text(`Hora: ${hora}`, margin + 70, y);
    doc.text(`N° de Control: ${numeroControl}`, margin + 140, y);
    y += 10;

    // ============================================
    // 3. DATOS DE LA EMBARCACIÓN
    // ============================================
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. DATOS DE LA EMBARCACIÓN", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre de la Embarcación: ${registro.nombre_embarcacion || "_______________"}`, margin, y);
    y += 6;
    doc.text(`Matrícula: ${registro.matricula || "_______________"}`, margin, y);
    y += 6;
    doc.text(`Puerto de Base / Origen: ${registro.puerto_base_origen || "_______________"}`, margin, y);
    y += 10;

    // ============================================
    // 4. DATOS DE LA TRIPULACIÓN (tabla)
    // ============================================
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. DATOS DE LA TRIPULACIÓN", margin, y);
    y += 6;

    // Preparar datos de tripulantes
    const tripulantes = registro.tripulantes || [];
    const tripulantesMap = {};
    tripulantes.forEach((t) => {
      tripulantesMap[t.cargo] = t;
    });

    const cargos = ["PATRON", "MARINERO_1", "MARINERO_2", "MARINERO_3"];
    const tableRows = cargos.map((cargo) => {
      const t = tripulantesMap[cargo] || {};
      const label = cargo === "PATRON" ? "Patrón" : cargo.replace("MARINERO_", "Marinero ");
      return [
        label,
        t.nombre_apellido || "",
        t.cedula_identidad || "",
        t.telefono || "",
      ];
    });

    // ✅ Usar autoTable como función
    autoTable(doc, {
      startY: y,
      head: [["Cargo", "Nombre y Apellido", "Cédula de Identidad", "Teléfono"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ============================================
    // 5. SISTEMA DE PROPULSIÓN (tabla)
    // ============================================
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. SISTEMA DE PROPULSIÓN", margin, y);
    y += 6;

    const motores = registro.motores || [];
    const motoresMap = {};
    motores.forEach((m) => {
      motoresMap[m.numero_motor] = m;
    });

    const motorRows = [1, 2, 3].map((num) => {
      const m = motoresMap[num] || {};
      return [`Motor ${num}`, m.marca || "", m.modelo || "", m.serial_numero || ""];
    });

    // ✅ Usar autoTable como función
    autoTable(doc, {
      startY: y,
      head: [["Motor", "Marca", "Modelo", "Número de Serial"]],
      body: motorRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ============================================
    // 6. AUTORIZACIONES Y PERMISOLOGÍA
    // ============================================
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("4. AUTORIZACIONES Y PERMISOLOGÍA", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`N° de Registro INSOPESCA: ${registro.registro_insopesca || "_______________"}`, margin, y);
    y += 6;
    doc.text(`Arte de Pesca Autorizado: ${registro.arte_pesca_autorizado || "_______________"}`, margin, y);
    y += 6;
    doc.text(`N° de Autorización de COMMPA: ${registro.autorizacion_commpa || "_______________"}`, margin, y);
    y += 10;

    // ============================================
    // 7. OBSERVACIONES
    // ============================================
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("5. OBSERVACIONES", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const observaciones = registro.observaciones || "";
    const obsLines = doc.splitTextToSize(observaciones || "______________________________________", pageWidth - 2 * margin);
    doc.text(obsLines, margin, y);
    y += obsLines.length * 5 + 10;

    // ============================================
    // 8. FIRMAS (Patrón y Funcionario)
    // ============================================
    // Línea de firma del Patrón
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Firma del Patrón", margin, y);
    doc.line(margin, y + 2, margin + 60, y + 2);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("C.I. ________________", margin, y);
    y += 10;

    // Línea de firma del Funcionario
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Nombre y Apellido del Funcionario", margin, y);
    doc.line(margin, y + 2, margin + 60, y + 2);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Firma y C.I. ________________", margin, y);
    y += 10;

    // ============================================
    // 9. PIE DE PÁGINA (opcional)
    // ============================================
    try {
      const footerImage = "piedocumento.jpg";
      const footerWidth = 150;
      const xFooterPosition = (pageWidth - footerWidth) / 2;
      doc.addImage(
        footerImage,
        "JPEG",
        xFooterPosition,
        doc.internal.pageSize.height - 8,
        footerWidth,
        6
      );
    } catch (e) {
      // Si no hay imagen, continuar
    }

    // ============================================
    // Guardar PDF
    // ============================================
    doc.save(`Registro_Embarcacion_${registro.numero_control || 'sin-control'}.pdf`);
    setAlert({
      show: true,
      message: "Planilla generada exitosamente.",
      type: "success",
    });
  } catch (error) {
    console.error("Error al generar planilla:", error);
    setAlert({
      show: true,
      message: "Error al generar la planilla. Revise la consola.",
      type: "error",
    });
  }
};
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Define la interfaz para la estructura de un reporte de ayuda.
interface Ayuda {
  id: number;
  codigo: string;
  fecha: string; // Formato "YYYY-MM-DD"
  cedula: string;
  beneficiario: string;
  nacionalidad: string;
  sexo: string;
  fechaNacimiento: string; // Formato "YYYY-MM-DD"
  municipio: string;
  parroquia: string;
  // Cambiado de 'sector' a 'estructura'
  estructura: string;
  telefono: string;
  // Añadido 'calle'
  calle: string;
  direccion: string;
  institucion: string;
  responsableInstitucion: string;
  tipo: string;
  // Añadido 'subtipo'
  subtipo: string;
  estado: string;
  observacion: string;
  fecha_registro: string; // Formato ISO 8601 datetime string
  fecha_actualizacion: string; // Formato ISO 8601 datetime string
}

const ReportesAyudas: React.FC = () => {
  // Estado para almacenar TODOS los datos de los reportes (sin filtrar)
  const [allReportes, setAllReportes] = useState<Ayuda[]>([]);
  // Estado para almacenar los datos de los reportes filtrados que se muestran en la tabla
  const [filteredReportes, setFilteredReportes] = useState<Ayuda[]>([]);
  // Estado para indicar si los datos están cargando
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para manejar cualquier error que ocurra durante la carga de datos
  const [error, setError] = useState<string | null>(null);

  // Estados para los filtros
  const [filterDate, setFilterDate] = useState<string>(""); // Para fecha de registro
  // Cambiado de 'filterSector' a 'filterEstructura'
  const [filterEstructura, setFilterEstructura] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Por defecto: 10 filas

  // Estados para mostrar mensajes al usuario (reemplazo de alert())
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  // Referencias para los contenedores de scroll
  const topScrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomScrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const contentWidthRef = useRef<HTMLDivElement>(null);

  // Función para mostrar mensajes al usuario
  const displayMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setShowMessage(true);
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      setShowMessage(false);
      setMessage(null);
    }, 5000);
  };

  // Efecto para sincronizar las barras de desplazamiento
  useEffect(() => {
    const topContainer = topScrollContainerRef.current;
    const bottomContainer = bottomScrollContainerRef.current;

    if (topContainer && bottomContainer) {
      const handleScrollTop = () => {
        bottomContainer.scrollLeft = topContainer.scrollLeft;
      };

      const handleScrollBottom = () => {
        topContainer.scrollLeft = bottomContainer.scrollLeft;
      };

      topContainer.addEventListener("scroll", handleScrollTop);
      bottomContainer.addEventListener("scroll", handleScrollBottom);

      // Limpieza de los eventos
      return () => {
        topContainer.removeEventListener("scroll", handleScrollTop);
        bottomContainer.removeEventListener("scroll", handleScrollBottom);
      };
    }
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  // Efecto para ajustar el ancho del div superior
  useEffect(() => {
    const contentWidthDiv = contentWidthRef.current;
    const tableElement = tableRef.current;

    if (contentWidthDiv && tableElement) {
      const observer = new ResizeObserver(() => {
        contentWidthDiv.style.width = `${tableElement.scrollWidth}px`;
      });
      observer.observe(tableElement);

      return () => {
        observer.disconnect();
      };
    }
  }, [filteredReportes]);

  // Efecto para cargar los datos desde el backend de Django al montar el componente
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true); // Inicia el estado de carga
        setError(null); // Limpia cualquier error previo

        // URL de tu API de Django REST Framework
        // URL cambiada para que coincida con la proporcionada por el usuario
        const API_URL = "https://maneiro-api-mem1.onrender.com/api/";

        const response = await axios.get<Ayuda[]>(API_URL); // Usa Axios para la petición GET

        const fetchedData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || [];

        setAllReportes(fetchedData); // Guarda todos los reportes
        setFilteredReportes(fetchedData); // Inicialmente, muestra todos los reportes
      } catch (err) {
        console.error("Error al cargar los reportes desde Django:", err);
        if (axios.isAxiosError(err)) {
          // Intenta obtener más detalles del error si es un error de Axios
          const errorMessage = err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message;
          setError(
            `No se pudieron cargar los reportes: ${errorMessage}. Por favor, verifique la URL de la API y el estado del backend de Django.`
          );
        } else if (err instanceof Error) {
          setError(
            `No se pudieron cargar los reportes: ${err.message}. Por favor, intente de nuevo más tarde.`
          );
        } else {
          setError(
            "No se pudieron cargar los reportes debido a un error desconocido."
          );
        }
      } finally {
        setLoading(false); // Finaliza el estado de carga
      }
    };

    fetchReportes();
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  // Efecto para aplicar los filtros cada vez que cambian los filtros o todos los reportes
  useEffect(() => {
    let currentFiltered = allReportes;

    // --- CORRECCIÓN: Filtrar por el campo 'fecha' en lugar de 'fecha_registro' ---
    if (filterDate) {
      currentFiltered = currentFiltered.filter(
        (reporte) => reporte.fecha === filterDate // Ahora compara el valor del input con el campo de fecha simple
      );
    }

    // Filtro por estructura
    if (filterEstructura) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.estructura.toLowerCase().includes(filterEstructura.toLowerCase())
      );
    }

    // Filtro por tipo de ayuda
    if (filterTipo) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.tipo.toLowerCase().includes(filterTipo.toLowerCase())
      );
    }

    setFilteredReportes(currentFiltered);
    setCurrentPage(1); // Reinicia a la primera página con cada cambio de filtro
  }, [filterDate, filterEstructura, filterTipo, allReportes]); // Dependencias del efecto de filtrado

  // Obtiene los valores únicos para los filtros de estructura y tipo (para los dropdowns)
  const uniqueEstructuras = useMemo(() => {
    const estructuras = new Set<string>();
    allReportes.forEach((reporte) => estructuras.add(reporte.estructura));
    return Array.from(estructuras).sort();
  }, [allReportes]);

  const uniqueTipos = useMemo(() => {
    const tipos = new Set<string>();
    allReportes.forEach((reporte) => tipos.add(reporte.tipo));
    return Array.from(tipos).sort();
  }, [allReportes]);

  // --- INICIO: Cálculo de Totales Dinámicos ---
  const totalAyudas = useMemo(
    () => filteredReportes.length,
    [filteredReportes]
  );
  const totalBeneficiariosUnicos = useMemo(() => {
    const cedulas = new Set<string>();
    filteredReportes.forEach((reporte) => cedulas.add(reporte.cedula));
    return cedulas.size;
  }, [filteredReportes]);

  const { totalHombres, totalMujeres } = useMemo(() => {
    let hombres = 0;
    let mujeres = 0;
    filteredReportes.forEach((reporte) => {
      if (reporte.sexo.toLowerCase() === "m") {
        hombres++;
      } else if (reporte.sexo.toLowerCase() === "f") {
        mujeres++;
      }
    });
    return { totalHombres: hombres, totalMujeres: mujeres };
  }, [filteredReportes]);

  const totalPorEstado = useMemo(() => {
    const estadoCounts: { [key: string]: number } = {};
    filteredReportes.forEach((reporte) => {
      estadoCounts[reporte.estado] = (estadoCounts[reporte.estado] || 0) + 1;
    });
    return estadoCounts;
  }, [filteredReportes]);

  const totalPorTipo = useMemo(() => {
    const tipoCounts: { [key: string]: number } = {};
    filteredReportes.forEach((reporte) => {
      tipoCounts[reporte.tipo] = (tipoCounts[reporte.tipo] || 0) + 1;
    });
    return tipoCounts;
  }, [filteredReportes]);
  // --- FIN: Cálculo de Totales Dinámicos ---

  // --- Lógica de Paginación ---
  const totalPages = useMemo(
    () => Math.ceil(filteredReportes.length / itemsPerPage),
    [filteredReportes, itemsPerPage]
  );

  const currentReportsPaginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReportes.slice(startIndex, endIndex);
  }, [filteredReportes, currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Resetear a la primera página al cambiar la cantidad por página
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (startPage > 1) {
        if (startPage > 2) pageNumbers.unshift("...");
        pageNumbers.unshift(1);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };
  // --- Fin Lógica de Paginación ---

  // Función para exportar a Excel
  const exportToExcel = () => {
    if (filteredReportes.length === 0) {
      displayMessage("No hay datos para exportar a Excel.", "info");
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(filteredReportes);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ayudas");
      XLSX.writeFile(wb, "reporte_ayudas.xlsx");
      displayMessage("Reporte exportado a Excel exitosamente.", "success");
    } catch (excelError) {
      console.error("Error al exportar a Excel:", excelError);
      displayMessage("Ocurrió un error al intentar exportar a Excel.", "error");
    }
  };

  // Función para exportar a PDF
  const exportToPdf = () => {
    if (filteredReportes.length === 0) {
      displayMessage("No hay datos para exportar a PDF.", "info");
      return;
    }

    try {
      const doc = new jsPDF("landscape"); // 'landscape' para orientación horizontal
      doc.text("Reporte de Ayudas", 14, 15); // Título del PDF

      const tableColumn = [
        "ID",
        "Código",
        "Fecha",
        "Cédula",
        "Beneficiario",
        "Nacionalidad",
        "Sexo",
        "Fecha Nacimiento",
        "Municipio",
        "Parroquia",
        "Estructura", // Cambiado de 'Sector'
        "Teléfono",
        "Calle", // Añadido
        "Dirección",
        "Institución",
        "Responsable Institución",
        "Tipo",
        "Subtipo", // Añadido
        "Estado",
        "Observación",
        "Fecha Registro",
        "Fecha Actualización",
      ];
      const tableRows = filteredReportes.map((reporte) => [
        reporte.id,
        reporte.codigo,
        reporte.fecha,
        reporte.cedula,
        reporte.beneficiario,
        reporte.nacionalidad,
        reporte.sexo,
        reporte.fechaNacimiento,
        reporte.municipio,
        reporte.parroquia,
        reporte.estructura, // Cambiado de 'sector'
        reporte.telefono,
        reporte.calle, // Añadido
        reporte.direccion,
        reporte.institucion,
        reporte.responsableInstitucion,
        reporte.tipo,
        reporte.subtipo, // Añadido
        reporte.estado,
        reporte.observacion,
        new Date(reporte.fecha_registro).toLocaleDateString(),
        new Date(reporte.fecha_actualizacion).toLocaleDateString(),
      ]);

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: {
          fillColor: [0, 149, 212], // #0095D4 en RGB
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] }, // Un gris muy claro
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      });

      doc.save("reporte_ayudas.pdf");
      displayMessage("Reporte exportado a PDF exitosamente.", "success");
    } catch (pdfError) {
      console.error("Error al exportar a PDF:", pdfError);
      displayMessage(
        "Ocurrió un error al intentar exportar a PDF. Revisa la consola para más detalles.",
        "error"
      );
    }
  };

  // Mensaje de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-blue-50 p-4 font-sans rounded-xl">
        <div className="text-xl font-semibold text-gray-700 animate-pulse">
          Cargando reportes desde Django... 📊
        </div>
      </div>
    );
  }

  // Mensaje de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 p-4 font-sans rounded-xl text-red-700">
        <div className="text-xl font-semibold text-center p-6 rounded-lg shadow-md bg-white">
          🚨 Error: {error}
          <p className="text-base mt-2">
            Por favor, asegúrate de que tu servidor de Django esté corriendo y
            que la API esté devolviendo JSON en{" "}
            <code className="font-mono text-sm">
              https://maneiro-api-mem1.onrender.com/api/
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-blue-50 min-h-screen font-sans rounded-xl text-gray-800">
      {/* Componente de Mensaje */}
      {showMessage && message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-semibold z-50 transition-all duration-300 ${
            message.type === "success"
              ? "bg-[#0095D4]"
              : message.type === "error"
              ? "bg-[#FF7D00]"
              : "bg-[#0069B6]"
          }`}
        >
          {message.text}
        </div>
      )}

      <h1 className="text-3xl font-extrabold mb-8 text-center rounded-xl bg-gradient-to-r from-[#f7f7f7] to-[#0095d4] text-white p-6 shadow-xl flex items-center justify-center">
        <img
          src="/LOGO.png"
          alt="Logo de la Aplicación"
          className="h-20 w-22 mr-4"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/64x64/cccccc/ffffff?text=LOGO";
            e.currentTarget.onerror = null;
          }}
        />
        Reportes de Ayudas
      </h1>

      {/* --- Sección de Totales Dinámicos --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Resumen de Reportes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {" "}
          {/* Reduced gap */}
          {/* Total de Ayudas */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-100">
            <p className="text-4xl font-extrabold text-[#0095D4]">
              {totalAyudas}
            </p>
            <p className="text-sm font-medium text-gray-600 uppercase">
              Total Ayudas
            </p>
          </div>
          {/* Total Beneficiarios Únicos */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-100">
            <p className="text-4xl font-extrabold text-[#FFCB00]">
              {totalBeneficiariosUnicos}
            </p>
            <p className="text-sm font-medium text-gray-600 uppercase">
              Beneficiarios Únicos
            </p>
          </div>
          {/* Total Hombres y Mujeres */}
          <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2 flex flex-col items-center justify-center border border-blue-100">
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-blue-600">
                  {" "}
                  {/* Azul para hombres */}
                  {totalHombres}
                </p>
                <p className="text-sm font-medium text-gray-600 uppercase">
                  Hombres
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-pink-600">
                  {" "}
                  {/* Rosa para mujeres */}
                  {totalMujeres}
                </p>
                <p className="text-sm font-medium text-gray-600 uppercase">
                  Mujeres
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total Sexo</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {" "}
          {/* Reduced gap */}
          {/* Total por Estado */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <p className="text-lg font-bold text-gray-800 mb-2">
              Total por Estado:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(totalPorEstado).map(([estado, count]) => (
                <li
                  key={estado}
                  className="flex justify-between items-center text-sm mb-1"
                >
                  <span>{estado}:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[#0095D4] text-white">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
            {Object.keys(totalPorEstado).length === 0 && (
              <p className="text-sm text-gray-500">No hay datos por estado.</p>
            )}
          </div>
          {/* Total por Tipo de Ayuda */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <p className="text-lg font-bold text-gray-800 mb-2">
              Total por Tipo de Ayuda:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(totalPorTipo).map(([tipo, count]) => (
                <li
                  key={tipo}
                  className="flex justify-between items-center text-sm mb-1"
                >
                  <span>{tipo}:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[#0095D4] text-white">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
            {Object.keys(totalPorTipo).length === 0 && (
              <p className="text-sm text-gray-500">
                No hay datos por tipo de ayuda.
              </p>
            )}
          </div>
        </div>
      </div>
      {/* --- Fin: Sección de Totales Dinámicos --- */}

      {/* Sección de Filtros y Botones Mejorada */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Contenedor de Filtros (ocupa la mayor parte del espacio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {" "}
          {/* Reduced gap */}
          {/* Filtro de Fecha */}
          <div>
            <label
              htmlFor="filterDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Fecha:
            </label>
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            />
          </div>
          {/* Filtro de Estructura */}
          <div>
            <label
              htmlFor="filterEstructura"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Estructura:
            </label>
            <select
              id="filterEstructura"
              value={filterEstructura}
              onChange={(e) => setFilterEstructura(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueEstructuras.map((estructura) => (
                <option key={estructura} value={estructura}>
                  {estructura}
                </option>
              ))}
            </select>
          </div>
          {/* Filtro de Tipo de Ayuda */}
          <div>
            <label
              htmlFor="filterTipo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tipo:
            </label>
            <select
              id="filterTipo"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueTipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4 md:mt-0">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Excel
          </button>
          <button
            onClick={exportToPdf}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105"
          >
            PDF
          </button>
        </div>
      </div>

      {/* Contenedor de la tabla */}
      {filteredReportes.length === 0 ? (
        <div className="text-center text-gray-600 p-8 bg-white rounded-lg shadow-md mt-6 border border-blue-100">
          {" "}
          {/* Reduced mb-8 to mb-6 */}
          <p className="text-lg">
            No hay reportes que coincidan con los filtros aplicados. 😔
          </p>
          <p className="text-md mt-2">
            Intenta ajustar los criterios de búsqueda o verifica que haya datos
            en tu API.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4 border border-blue-100">
          {/* Contenedor de la tabla principal */}
          <div className="overflow-x-auto" ref={bottomScrollContainerRef}>
            <table
              className="min-w-full divide-y divide-gray-200 text-gray-900"
              ref={tableRef}
            >
              <thead className="bg-[#0095D4] sticky top-0">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Código
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Beneficiario
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Cédula
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Estructura
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg"
                  >
                    Reg.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReportsPaginated.map((reporte) => (
                  <tr
                    key={reporte.id}
                    className="hover:bg-blue-50 transition duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reporte.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.fecha}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.beneficiario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.cedula}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.estructura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {reporte.tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reporte.estado === "VALIDADO / APROBADO"
                            ? "bg-[#0095D4] text-white"
                            : reporte.estado === "PENDIENTE"
                            ? "bg-[#FFCB00] text-gray-900"
                            : "bg-[#FF7D00] text-white"
                        }`}
                      >
                        {reporte.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(reporte.fecha_registro).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Controles de Paginación --- */}
      {filteredReportes.length > 0 && (
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white rounded-lg shadow-md mt-4 border border-blue-100">
          {/* Selector de Items por Página */}
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0069B6] focus:ring focus:ring-[#0069B6] focus:ring-opacity-50 py-1.5 bg-white text-gray-900"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="1000">1000</option>
            </select>
          </div>

          {/* Navegación de Páginas */}
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {getPageNumbers().map((pageNumber, index) =>
              typeof pageNumber === "number" ? (
                <button
                  key={index}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                    pageNumber === currentPage
                      ? "z-10 bg-[#0069B6] border-[#0069B6] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ) : (
                <span
                  key={index}
                  className="relative inline-flex items-center px-4"
                  >
                  {pageNumber}
                </span>
              )
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ReportesAyudas;
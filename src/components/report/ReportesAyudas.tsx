import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define la interfaz para la estructura de un reporte de ayuda
interface Ayuda {
  id: number;
  codigo: string;
  cedula: string;
  beneficiario: string;
  nacionalidad: string;
  sexo: string;
  fechaNacimiento: string | null;
  municipio: string;
  parroquia: string;
  estructura: string;
  telefono: string;
  calle: string;
  direccion: string;
  institucion: string;
  responsableInstitucion: string;
  tipo: string;
  subtipo: string;
  estado: string;
  observacion: string;
  fecha_registro: string;
  fecha_actualizacion: string;
}

const ReportesAyudas: React.FC = () => {
  const [allReportes, setAllReportes] = useState<Ayuda[]>([]);
  const [filteredReportes, setFilteredReportes] = useState<Ayuda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [filterEstructura, setFilterEstructura] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterInstitucion, setFilterInstitucion] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [sortConfig, setSortConfig] = useState<{ key: keyof Ayuda; direction: 'asc' | 'desc' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const topScrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomScrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const contentWidthRef = useRef<HTMLDivElement>(null);

  const displayMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      setMessage(null);
    }, 5000);
  };

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

      return () => {
        topContainer.removeEventListener("scroll", handleScrollTop);
        bottomContainer.removeEventListener("scroll", handleScrollBottom);
      };
    }
  }, []);

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

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = "https://maneiro-api-mem1.onrender.com/api/";
        const response = await axios.get<Ayuda[]>(API_URL);

        const fetchedData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || [];

        setAllReportes(fetchedData);
        setFilteredReportes(fetchedData);
      } catch (err) {
        console.error("Error al cargar los reportes desde Django:", err);
        if (axios.isAxiosError(err)) {
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
        setLoading(false);
      }
    };

    fetchReportes();
  }, []);

  useEffect(() => {
    let currentFiltered = allReportes;

    if (filterFromDate || filterToDate) {
      currentFiltered = currentFiltered.filter((reporte) => {
        const regDate = reporte.fecha_registro.substring(0, 10);
        if (filterFromDate && regDate < filterFromDate) return false;
        if (filterToDate && regDate > filterToDate) return false;
        return true;
      });
    }

    if (filterEstructura) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.estructura.toLowerCase().includes(filterEstructura.toLowerCase())
      );
    }

    if (filterTipo) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.tipo.toLowerCase().includes(filterTipo.toLowerCase())
      );
    }

    if (filterEstado) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.estado.toLowerCase().includes(filterEstado.toLowerCase())
      );
    }

    if (filterInstitucion) {
      currentFiltered = currentFiltered.filter((reporte) =>
        reporte.institucion.toLowerCase().includes(filterInstitucion.toLowerCase())
      );
    }

    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      currentFiltered = currentFiltered.filter((reporte) => {
        const fields = [
          reporte.beneficiario || "",
          reporte.cedula || "",
          reporte.codigo || "",
          reporte.estructura || "",
          reporte.tipo || "",
          reporte.estado || "",
          reporte.institucion || "",
        ];
        return fields.some((field) => field.toLowerCase().includes(lowerSearch));
      });
    }

    setFilteredReportes(currentFiltered);
    setCurrentPage(1);
  }, [filterFromDate, filterToDate, filterEstructura, filterTipo, filterEstado, filterInstitucion, searchQuery, allReportes]);

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

  const uniqueEstados = useMemo(() => {
    const estados = new Set<string>();
    allReportes.forEach((reporte) => estados.add(reporte.estado));
    return Array.from(estados).sort();
  }, [allReportes]);

  const uniqueInstituciones = useMemo(() => {
    const instituciones = new Set<string>();
    allReportes.forEach((reporte) => instituciones.add(reporte.institucion));
    return Array.from(instituciones).sort();
  }, [allReportes]);

  const totalAyudas = useMemo(() => filteredReportes.length, [filteredReportes]);
  const totalBeneficiariosUnicos = useMemo(() => {
    const cedulas = new Set<string>();
    filteredReportes.forEach((reporte) => cedulas.add(reporte.cedula));
    return cedulas.size;
  }, [filteredReportes]);

  const { totalHombres, totalMujeres } = useMemo(() => {
    let hombres = 0;
    let mujeres = 0;
    filteredReportes.forEach((reporte) => {
      if (reporte.sexo.toLowerCase() === "m") hombres++;
      else if (reporte.sexo.toLowerCase() === "f") mujeres++;
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

  const chartData = useMemo(() => {
    return Object.entries(totalPorTipo).map(([name, value]) => ({ name, value }));
  }, [totalPorTipo]);

  const sortedReportes = useMemo(() => {
    let sortableItems = [...filteredReportes];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (aVal === null) aVal = '';
        if (bVal === null) bVal = '';

        if (sortConfig.key === 'id') {
          aVal = Number(aVal);
          bVal = Number(bVal);
        } else if (sortConfig.key === 'fecha_registro' || sortConfig.key === 'fecha_actualizacion') {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredReportes, sortConfig]);

  const requestSort = (key: keyof Ayuda) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Ayuda) => {
    if (!sortConfig || sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const totalPages = useMemo(() => Math.ceil(sortedReportes.length / itemsPerPage), [sortedReportes, itemsPerPage]);
  const currentReportsPaginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedReportes.slice(startIndex, endIndex);
  }, [sortedReportes, currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

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

  const exportToPdf = () => {
    if (filteredReportes.length === 0) {
      displayMessage("No hay datos para exportar a PDF.", "info");
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.text("Reporte de Ayudas", 14, 15);

      const tableColumn = [
        "ID", "Código", "Fecha Registro", "Cédula", "Beneficiario", "Nacionalidad", "Sexo",
        "Fecha Nacimiento", "Municipio", "Parroquia", "Estructura", "Teléfono", "Calle",
        "Dirección", "Institución", "Responsable Institución", "Tipo", "Subtipo",
        "Estado", "Observación", "Fecha Actualización",
      ];
      const tableRows = filteredReportes.map((reporte) => [
        reporte.id, reporte.codigo, reporte.fecha_registro.substring(0, 10),
        reporte.cedula, reporte.beneficiario, reporte.nacionalidad, reporte.sexo,
        reporte.fechaNacimiento ?? "", reporte.municipio, reporte.parroquia, reporte.estructura,
        reporte.telefono, reporte.calle, reporte.direccion, reporte.institucion,
        reporte.responsableInstitucion, reporte.tipo, reporte.subtipo, reporte.estado,
        reporte.observacion, reporte.fecha_actualizacion.substring(0, 10),
      ]);

      (doc as any).autoTable({
        head: [tableColumn], body: tableRows, startY: 20,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [0, 149, 212], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      });

      doc.save("reporte_ayudas.pdf");
      displayMessage("Reporte exportado a PDF exitosamente.", "success");
    } catch (pdfError) {
      console.error("Error al exportar a PDF:", pdfError);
      displayMessage("Ocurrió un error al intentar exportar a PDF. Revisa la consola para más detalles.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-blue-50 p-4 font-sans rounded-xl">
        <div className="text-xl font-semibold text-gray-700 animate-pulse">
          Cargando reportes desde Django... 📊
        </div>
      </div>
    );
  }

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
      {showMessage && message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-semibold z-50 transition-all duration-300 ${
            message.type === "success" ? "bg-[#0095D4]" : message.type === "error" ? "bg-[#FF7D00]" : "bg-[#0069B6]"
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
            e.currentTarget.src = "https://placehold.co/64x64/cccccc/ffffff?text=LOGO";
            e.currentTarget.onerror = null;
          }}
        />
        Reportes de Ayudas
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Resumen de Reportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-100">
            <p className="text-4xl font-extrabold text-[#0095D4]">{totalAyudas}</p>
            <p className="text-sm font-medium text-gray-600 uppercase">Total Ayudas</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center border border-blue-100">
            <p className="text-4xl font-extrabold text-[#FFCB00]">{totalBeneficiariosUnicos}</p>
            <p className="text-sm font-medium text-gray-600 uppercase">Beneficiarios Únicos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2 flex flex-col items-center justify-center border border-blue-100">
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-blue-600">{totalHombres}</p>
                <p className="text-sm font-medium text-gray-600 uppercase">Hombres</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-pink-600">{totalMujeres}</p>
                <p className="text-sm font-medium text-gray-600 uppercase">Mujeres</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total Sexo</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <p className="text-lg font-bold text-gray-800 mb-2">Total por Estado:</p>
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(totalPorEstado).map(([estado, count]) => (
                <li key={estado} className="flex justify-between items-center text-sm mb-1">
                  <span>{estado}:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[#0095D4] text-white">{count}</span>
                </li>
              ))}
              {Object.keys(totalPorEstado).length === 0 && (
                <p className="text-sm text-gray-500">No hay datos por estado.</p>
              )}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
            <p className="text-lg font-bold text-gray-800 mb-2">Total por Tipo de Ayuda:</p>
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(totalPorTipo).map(([tipo, count]) => (
                <li key={tipo} className="flex justify-between items-center text-sm mb-1">
                  <span>{tipo}:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[#0095D4] text-white">{count}</span>
                </li>
              ))}
              {Object.keys(totalPorTipo).length === 0 && (
                <p className="text-sm text-gray-500">No hay datos por tipo de ayuda.</p>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Gráfico de Total por Tipo de Ayuda</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0095D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 w-full">
          <div>
            <label htmlFor="filterFromDate" className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde:</label>
            <input
              type="date"
              id="filterFromDate"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="filterToDate" className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta:</label>
            <input
              type="date"
              id="filterToDate"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="filterEstructura" className="block text-sm font-medium text-gray-700 mb-2">Estructura:</label>
            <select
              id="filterEstructura"
              value={filterEstructura}
              onChange={(e) => setFilterEstructura(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueEstructuras.map((estructura) => (
                <option key={estructura} value={estructura}>{estructura}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterTipo" className="block text-sm font-medium text-gray-700 mb-2">Tipo:</label>
            <select
              id="filterTipo"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueTipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterEstado" className="block text-sm font-medium text-gray-700 mb-2">Estado:</label>
            <select
              id="filterEstado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueEstados.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterInstitucion" className="block text-sm font-medium text-gray-700 mb-2">Institución:</label>
            <select
              id="filterInstitucion"
              value={filterInstitucion}
              onChange={(e) => setFilterInstitucion(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
            >
              <option value="">Todos</option>
              {uniqueInstituciones.map((institucion) => (
                <option key={institucion} value={institucion}>{institucion}</option>
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

      {/* Mover el input de búsqueda fuera del condicional de la tabla */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100 mb-6">
        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">Buscar:</label>
        <input
          type="text"
          id="searchQuery"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por beneficiario, cédula, código, etc."
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0069B6] focus:border-[#0069B6] sm:text-sm bg-white text-gray-900"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 border border-blue-100">
        <div ref={bottomScrollContainerRef} className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200 text-gray-900 table-auto"
            ref={tableRef}
          >
            <thead className="bg-[#0095D4] sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg cursor-pointer" onClick={() => requestSort('id')}>
                  ID{getSortIndicator('id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('codigo')}>
                  Código{getSortIndicator('codigo')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('fecha_registro')}>
                  Fecha{getSortIndicator('fecha_registro')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('beneficiario')}>
                  Beneficiario{getSortIndicator('beneficiario')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('cedula')}>
                  Cédula{getSortIndicator('cedula')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('estructura')}>
                  Estructura{getSortIndicator('estructura')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('institucion')}>
                  Institución{getSortIndicator('institucion')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('tipo')}>
                  Tipo{getSortIndicator('tipo')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('estado')}>
                  Estado{getSortIndicator('estado')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg cursor-pointer" onClick={() => requestSort('fecha_registro')}>
                  Reg.{getSortIndicator('fecha_registro')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReportsPaginated.length > 0 ? (
                currentReportsPaginated.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reporte.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.fecha_registro.substring(0, 10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.beneficiario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.cedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.estructura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.institucion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reporte.estado === "PENDIENTE POR INSPECTION" ? "bg-[#FF7D00] text-white" :
                          (reporte.estado === "FINALIZADO" || reporte.estado === "APROBADO / PRIMERA ENTREGA") ? "bg-green-500 text-white" :
                          reporte.estado === "EN PROCESO DE EVALUACION" ? "bg-blue-500 text-white" :
                          "bg-[#FF7D00] text-white"
                        }`}
                      >
                        {reporte.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{reporte.fecha_registro.substring(0, 10)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron resultados para los filtros aplicados. 😔
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReportes.length > 0 && (
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white rounded-lg shadow-md mt-4 border border-blue-100">
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

          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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
                    pageNumber === currentPage ? "z-10 bg-[#0069B6] border-[#0069B6] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ) : (
                <span
                  key={index}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
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
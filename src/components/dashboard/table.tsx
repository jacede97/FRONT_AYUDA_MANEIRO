import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react"; // Para las flechas de ordenamiento

const Table = ({
  sortedAyudas, // Recibe el array de ayudas ya ordenado desde el componente padre
  selectedAyuda,
  handleRowSelect,
  requestSort, // Recibe la función de ordenamiento desde el padre
  renderSortArrow, // Recibe la función para renderizar la flecha de ordenamiento desde el padre
}) => {
  // --- Estado y Lógica de Paginación Interna ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Valor inicial ahora es 10

  const totalItems = sortedAyudas.length; // Usa el array ya ordenado que viene por prop
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Resetear a la primera página al cambiar la cantidad por página
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAyudas = sortedAyudas.slice(startIndex, endIndex); // Pagina el array ya ordenado

  // Genera los números de página para mostrar en la paginación
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Número máximo de botones de página a mostrar

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

      // Añadir puntos suspensivos si es necesario
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
  // --- Fin Lógica de Paginación Interna ---

  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-blue-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#0095D4]">
          <tr>
            <th
              onClick={() => requestSort("codigo")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-tl-xl"
            >
              Código {renderSortArrow("codigo")}
            </th>
            <th
              onClick={() => requestSort("fecha")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20"
            >
              Fecha {renderSortArrow("fecha")}
            </th>
            <th
              onClick={() => requestSort("cedula")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20"
            >
              Cédula {renderSortArrow("cedula")}
            </th>
            <th
              onClick={() => requestSort("beneficiario")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20"
            >
              Beneficiario {renderSortArrow("beneficiario")}
            </th>
            <th
              onClick={() => requestSort("sector")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer bg-orange-500 hover:bg-orange-600"
            >
              Sector {renderSortArrow("sector")}
            </th>
            <th
              onClick={() => requestSort("estado")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20"
            >
              Estado {renderSortArrow("estado")}
            </th>
            <th
              onClick={() => requestSort("tipo")}
              className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer bg-orange-500 hover:bg-orange-600 rounded-tr-xl"
            >
              Tipo de Solicitud {renderSortArrow("tipo")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentAyudas.length > 0 ? (
            currentAyudas.map((ayuda) => (
              <tr
                key={ayuda.id}
                onClick={() => handleRowSelect(ayuda)}
                className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedAyuda?.id === ayuda.id ? "bg-blue-100" : ""
                }`}
              >
                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                  {ayuda.codigo}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {ayuda.fecha}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {ayuda.cedula}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  <div className="max-w-[120px] overflow-hidden text-ellipsis">
                    {ayuda.beneficiario}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-[#0069B6]">
                    {ayuda.sector}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ayuda.estado === "Aprobado"
                        ? "bg-green-100 text-green-800"
                        : ayuda.estado === "Pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ayuda.estado}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#E0F2F7] text-[#0069B6]">
                    {ayuda.tipo}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="7"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No se encontraron registros que coincidan con los criterios de
                búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Controles de Paginación */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        {/* Selector de Items por Página */}
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0069B6] focus:ring-2 focus:ring-[#0095D4] focus:ring-opacity-50 py-1.5"
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
          className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px"
          aria-label="Pagination"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? "z-10 bg-[#0095D4] border-[#0095D4] text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50"
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
            className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Table;

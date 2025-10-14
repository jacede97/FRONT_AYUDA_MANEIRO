import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronUp, ChevronDown } from "lucide-react"; // Se agregó ChevronRight para el botón de expansión

const Table = React.memo(
  ({
    sortedAyudas, // Recibe el array de ayudas ya ordenado desde el componente padre
    selectedAyuda,
    handleRowSelect,
    requestSort, // Recibe la función de ordenamiento desde el padre
    renderSortArrow, // Recibe la función para renderizar la flecha de ordenamiento
  }) => {
    // --- Estado para la fila expandida ---
    const [expandedRowId, setExpandedRowId] = useState(null);

    const handleExpandToggle = (id) => {
      setExpandedRowId(expandedRowId === id ? null : id);
    };

    // --- Estado y Lógica de Paginación Interna ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Valor inicial por defecto

    // useMemo para memorizar el cálculo del total de páginas.
    const totalItems = sortedAyudas.length;
    const totalPages = useMemo(() => {
      return Math.ceil(totalItems / itemsPerPage);
    }, [totalItems, itemsPerPage]);

    const handlePageChange = (pageNumber) => {
      setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event) => {
      setItemsPerPage(Number(event.target.value));
      setCurrentPage(1); // Reiniciar a la primera página al cambiar la cantidad
    };

    // useMemo para memorizar el subconjunto de datos de la página actual.
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAyudas = useMemo(() => {
      return sortedAyudas.slice(startIndex, endIndex);
    }, [sortedAyudas, startIndex, endIndex]);

    // useMemo para memorizar la lógica de los números de página.
    const getPageNumbers = useMemo(() => {
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
    }, [totalPages, currentPage]);

    return (
      <div className="bg-white shadow-lg rounded-xl border border-blue-100 flex flex-col">
        {/*
          ============ VISTA DE TABLA para DESKTOP (md y superior) ============
        */}
        <div className="hidden md:block md:overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Encabezado fijo */}
            <thead className="bg-[#0095D4] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider w-10">
                  <span className="sr-only">Expandir</span>
                </th>
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
                  onClick={() => requestSort("estructura")}
                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer bg-orange-500 hover:bg-orange-600"
                >
                  Sector {renderSortArrow("estructura")}
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
            {/* Contenedor para el scroll vertical del cuerpo de la tabla */}
            <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto max-h-[400px]">
              {currentAyudas.length > 0 ? (
                currentAyudas.map((ayuda) => (
                  <React.Fragment key={ayuda.id}>
                    <tr
                      onClick={() => handleRowSelect(ayuda)}
                      className={`cursor-pointer transition-colors ${
                        selectedAyuda?.id === ayuda.id
                          ? "bg-blue-300"
                          : (ayuda.estado === "APROBADO / PRIMERA ENTREGA" || ayuda.estado === "FINALIZADA")
                          ? "bg-green-100"
                          : "hover:bg-blue-300"
                      }`}
                    >
                      <td className="p-1 text-center w-10">
                        <button onClick={(e) => { e.stopPropagation(); handleExpandToggle(ayuda.id); }} className="p-1 rounded-full hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <ChevronRight className={`transition-transform duration-300 ${expandedRowId === ayuda.id ? 'rotate-90' : 'rotate-0'}`} size={16} />
                        </button>
                      </td>
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
                          {ayuda.estructura}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ayuda.estado === "APROBADO / PRIMERA ENTREGA" || ayuda.estado === "FINALIZADA"
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
                    {expandedRowId === ayuda.id && (
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <td colSpan="8" className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                            <div>
                              <p><span className="font-semibold">Subtipo:</span> {ayuda.subtipo || 'N/A'}</p>
                              <p><span className="font-semibold">Nacionalidad:</span> {ayuda.nacionalidad || 'N/A'}</p>
                              <p><span className="font-semibold">Sexo:</span> {ayuda.sexo || 'N/A'}</p>
                              <p><span className="font-semibold">Fecha de Nacimiento:</span> {ayuda.fechaNacimiento || 'N/A'}</p>
                              <p><span className="font-semibold">Municipio:</span> {ayuda.municipio || 'N/A'}</p>
                              <p><span className="font-semibold">Parroquia:</span> {ayuda.parroquia || 'N/A'}</p>
                            </div>
                            <div>
                              <p><span className="font-semibold">Teléfono:</span> {ayuda.telefono || 'N/A'}</p>
                              <p><span className="font-semibold">Calle:</span> {ayuda.calle || 'N/A'}</p>
                              <p><span className="font-semibold">Dirección:</span> {ayuda.direccion || 'N/A'}</p>
                              <p><span className="font-semibold">Institución:</span> {ayuda.institucion || 'N/A'}</p>
                              <p><span className="font-semibold">Responsable Institución:</span> {ayuda.responsableInstitucion || 'N/A'}</p>
                              <p><span className="font-semibold">Observación:</span> {ayuda.observacion || 'N/A'}</p>
                              <p><span className="font-semibold">Fecha de Registro:</span> {ayuda.fecha_registro || 'N/A'}</p>
                              <p><span className="font-semibold">Fecha de Actualización:</span> {ayuda.fecha_actualizacion || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron registros que coincidan con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/*
          ============ VISTA DE TARJETAS para MOBILE (por defecto, oculto en md y superior) ============
        */}
        <div className="md:hidden p-4 space-y-4">
          {currentAyudas.length > 0 ? (
            currentAyudas.map((ayuda) => (
              <div
                key={ayuda.id}
                onClick={() => handleRowSelect(ayuda)}
                className={`block p-4 border rounded-xl shadow-sm cursor-pointer transition-colors ${
                  selectedAyuda?.id === ayuda.id
                    ? "bg-blue-300 border-blue-400"
                    : (ayuda.estado === "APROBADO / PRIMERA ENTREGA" || ayuda.estado === "FINALIZADA")
                    ? "bg-green-100 border-green-300"
                    : "bg-white border-gray-200 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {ayuda.beneficiario}
                  </h3>
                  <span className="text-sm font-semibold text-gray-600">
                    Cédula: {ayuda.cedula}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Código:</span> {ayuda.codigo}
                  </p>
                  <p>
                    <span className="font-semibold">Fecha:</span> {ayuda.fecha}
                  </p>
                  <p>
                    <span className="font-semibold">Sector:</span>{" "}
                    <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-[#0069B6]">
                      {ayuda.estructura}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Estado:</span>{" "}
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ayuda.estado === "APROBADO / PRIMERA ENTREGA" || ayuda.estado === "FINALIZADA"
                          ? "bg-green-100 text-green-800"
                          : ayuda.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ayuda.estado}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Tipo de Solicitud:</span>{" "}
                    <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#E0F2F7] text-[#0069B6]">
                      {ayuda.tipo}
                    </span>
                  </p>
                  {/* Botón para expandir en la vista móvil */}
                  <div className="mt-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleExpandToggle(ayuda.id); }} className="text-sm text-blue-600 hover:underline flex items-center justify-end w-full">
                      {expandedRowId === ayuda.id ? 'Ver menos detalles' : 'Ver más detalles'}
                      <ChevronRight className={`ml-1 transition-transform duration-300 ${expandedRowId === ayuda.id ? 'rotate-90' : 'rotate-0'}`} size={16} />
                    </button>
                  </div>
                  {/* Detalles adicionales en la vista móvil */}
                  {expandedRowId === ayuda.id && (
                    <div className="mt-2 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p><span className="font-semibold">Subtipo:</span> {ayuda.subtipo || 'N/A'}</p>
                      <p><span className="font-semibold">Nacionalidad:</span> {ayuda.nacionalidad || 'N/A'}</p>
                      <p><span className="font-semibold">Sexo:</span> {ayuda.sexo || 'N/A'}</p>
                      <p><span className="font-semibold">Fecha de Nacimiento:</span> {ayuda.fechaNacimiento || 'N/A'}</p>
                      <p><span className="font-semibold">Municipio:</span> {ayuda.municipio || 'N/A'}</p>
                      <p><span className="font-semibold">Parroquia:</span> {ayuda.parroquia || 'N/A'}</p>
                      <p><span className="font-semibold">Teléfono:</span> {ayuda.telefono || 'N/A'}</p>
                      <p><span className="font-semibold">Calle:</span> {ayuda.calle || 'N/A'}</p>
                      <p><span className="font-semibold">Dirección:</span> {ayuda.direccion || 'N/A'}</p>
                      <p><span className="font-semibold">Institución:</span> {ayuda.institucion || 'N/A'}</p>
                      <p><span className="font-semibold">Responsable Institución:</span> {ayuda.responsableInstitucion || 'N/A'}</p>
                      <p><span className="font-semibold">Observación:</span> {ayuda.observacion || 'N/A'}</p>
                      <p><span className="font-semibold">Fecha de Registro:</span> {ayuda.fecha_registro || 'N/A'}</p>
                      <p><span className="font-semibold">Fecha de Actualización:</span> {ayuda.fecha_actualizacion || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No se encontraron registros que coincidan con los criterios de búsqueda.
            </div>
          )}
        </div>

        {/* Controles de Paginación (visibles en ambos casos) */}
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
            {getPageNumbers.map((pageNumber, index) =>
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
  }
);

export default Table;
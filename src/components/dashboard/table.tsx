import React, { useState, useMemo } from "react";
import { ChevronRight, Phone } from "lucide-react";

const Table = React.memo(
  ({
    sortedAyudas,
    selectedAyuda,
    handleRowSelect,
    requestSort,
    renderSortArrow,
  }) => {
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- Función auxiliar para mostrar el sector con la nueva lógica ---
    const getSectorDisplay = (ayuda) => {
      const { estructura, municipio } = ayuda;
      if (!estructura && municipio && municipio.trim() !== "MP. MANEIRO") {
        return "DE OTRO MUNICIPIO";
      }
      return estructura || "N/A";
    };

    // ✅ Función para generar el enlace de WhatsApp
    const getWhatsAppLink = (ayuda) => {
      const mensaje = `
*Ayuda Social - Código: ${ayuda.codigo}*
Beneficiario: ${ayuda.beneficiario}
Cédula: ${ayuda.cedula}
Estado: ${ayuda.estado}
Fecha: ${ayuda.fecha}
Tipo: ${ayuda.tipo}
Subtipo: ${ayuda.subtipo || "N/A"}
Sector: ${getSectorDisplay(ayuda)}
Institución: ${ayuda.institucion || "N/A"}
${ayuda.observacion ? `Observación: ${ayuda.observacion}` : ''}
      `.trim();

      const mensajeCodificado = encodeURIComponent(mensaje);
      return `https://wa.me/?text=${mensajeCodificado}`;
    };

    // ✅ Función para abrir WhatsApp
    const openWhatsApp = (ayuda) => {
      const link = getWhatsAppLink(ayuda);
      window.open(link, 'whatsappWindow');
    };

    const handleExpandToggle = (id) => {
      setExpandedRowId(expandedRowId === id ? null : id);
    };

    const totalItems = sortedAyudas.length;
    const totalPages = useMemo(() => {
      return Math.ceil(totalItems / itemsPerPage);
    }, [totalItems, itemsPerPage]);

    const handlePageChange = (pageNumber) => {
      setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event) => {
      setItemsPerPage(Number(event.target.value));
      setCurrentPage(1);
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAyudas = useMemo(() => {
      return sortedAyudas.slice(startIndex, endIndex);
    }, [sortedAyudas, startIndex, endIndex]);

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
        {/* Vista desktop */}
        <div className="hidden md:block md:overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer bg-orange-500 hover:bg-orange-600"
                >
                  Tipo de Solicitud {renderSortArrow("tipo")}
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider rounded-tr-xl">
                  WhatsApp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto max-h-[400px]">
              {currentAyudas.length > 0 ? (
                currentAyudas.map((ayuda) => (
                  <React.Fragment key={ayuda.id}>
                    <tr
                      onClick={() => handleRowSelect(ayuda)}
                      className={`cursor-pointer transition-colors ${
                        selectedAyuda?.id === ayuda.id
                          ? "bg-blue-300"
                          : (ayuda.estado === "APROBADO / PRIMERA ENTREGA" ||
                             ayuda.estado === "FINALIZADA")
                          ? "bg-green-100"
                          : "hover:bg-blue-300"
                      }`}
                    >
                      <td className="p-1 text-center w-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandToggle(ayuda.id);
                          }}
                          className="p-1 rounded-full hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <ChevronRight
                            className={`transition-transform duration-300 ${
                              expandedRowId === ayuda.id ? "rotate-90" : "rotate-0"
                            }`}
                            size={16}
                          />
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
                        {(() => {
                          const sectorText = getSectorDisplay(ayuda);
                          const isOtroMunicipio = sectorText === "DE OTRO MUNICIPIO";
                          return (
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isOtroMunicipio
                                  ? "bg-yellow-300 text-yellow-900 border border-yellow-500"
                                  : "bg-blue-100 text-[#0069B6]"
                              }`}
                            >
                              {sectorText}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ayuda.estado === "APROBADO / PRIMERA ENTREGA" ||
                            ayuda.estado === "FINALIZADA"
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
                      {/* Botón WhatsApp */}
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(ayuda);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 transition-all duration-200"
                          title="Compartir por WhatsApp"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === ayuda.id && (
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <td colSpan="9" className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                            <div>
                              <p>
                                <span className="font-semibold">Subtipo:</span>{" "}
                                {ayuda.subtipo || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Nacionalidad:</span>{" "}
                                {ayuda.nacionalidad || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Sexo:</span>{" "}
                                {ayuda.sexo || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha de Nacimiento:
                                </span>{" "}
                                {ayuda.fechaNacimiento || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Municipio:</span>{" "}
                                {ayuda.municipio || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Parroquia:</span>{" "}
                                {ayuda.parroquia || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Registrado por:</span>{" "}
                                {ayuda.usuario_registro_nombre || "N/A"}
                              </p>
                            </div>
                            <div>
                              {/* ✅ TELÉFONO COMO ENLACE */}
                              <p>
                                <span className="font-semibold">Teléfono:</span>{" "}
                                {ayuda.telefono ? (
                                  <a
                                    href={`tel:${ayuda.telefono}`}
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone size={14} />
                                    {ayuda.telefono}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </p>
                              <p>
                                <span className="font-semibold">Calle:</span>{" "}
                                {ayuda.calle || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Dirección:</span>{" "}
                                {ayuda.direccion || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Institución:</span>{" "}
                                {ayuda.institucion || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Responsable Institución:
                                </span>{" "}
                                {ayuda.responsableInstitucion || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Observación:</span>{" "}
                                {ayuda.observacion || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha de Registro:
                                </span>{" "}
                                {ayuda.fecha_registro || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Fecha de Actualización:
                                </span>{" "}
                                {ayuda.fecha_actualizacion || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">Actualizado por:</span>{" "}
                                {ayuda.usuario_actualizacion_nombre || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No se encontraron registros que coincidan con los criterios de
                    búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden p-4 space-y-4">
          {currentAyudas.length > 0 ? (
            currentAyudas.map((ayuda) => (
              <div
                key={ayuda.id}
                onClick={() => handleRowSelect(ayuda)}
                className={`block p-4 border rounded-xl shadow-sm cursor-pointer transition-colors ${
                  selectedAyuda?.id === ayuda.id
                    ? "bg-blue-300 border-blue-400"
                    : ayuda.estado === "APROBADO / PRIMERA ENTREGA" ||
                      ayuda.estado === "FINALIZADA"
                    ? "bg-green-100 border-green-300"
                    : "bg-white border-gray-200 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {ayuda.beneficiario}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Cédula: {ayuda.cedula}
                    </span>
                    {/* Botón WhatsApp móvil */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsApp(ayuda);
                      }}
                      className="inline-flex items-center justify-center p-1.5 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 transition-all duration-200"
                      title="Compartir por WhatsApp"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </button>
                  </div>
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
                    {(() => {
                      const sectorText = getSectorDisplay(ayuda);
                      const isOtroMunicipio = sectorText === "DE OTRO MUNICIPIO";
                      return (
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isOtroMunicipio
                              ? "bg-yellow-300 text-yellow-900 border border-yellow-500"
                              : "bg-blue-100 text-[#0069B6]"
                          }`}
                        >
                          {sectorText}
                        </span>
                      );
                    })()}
                  </p>
                  <p>
                    <span className="font-semibold">Estado:</span>{" "}
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ayuda.estado === "APROBADO / PRIMERA ENTREGA" ||
                        ayuda.estado === "FINALIZADA"
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
                  <div className="mt-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandToggle(ayuda.id);
                      }}
                      className="text-sm text-blue-600 hover:underline flex items-center justify-end w-full"
                    >
                      {expandedRowId === ayuda.id
                        ? "Ver menos detalles"
                        : "Ver más detalles"}
                      <ChevronRight
                        className={`ml-1 transition-transform duration-300 ${
                          expandedRowId === ayuda.id ? "rotate-90" : "rotate-0"
                        }`}
                        size={16}
                      />
                    </button>
                  </div>
                  {expandedRowId === ayuda.id && (
                    <div className="mt-2 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p>
                        <span className="font-semibold">Subtipo:</span>{" "}
                        {ayuda.subtipo || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Nacionalidad:</span>{" "}
                        {ayuda.nacionalidad || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Sexo:</span>{" "}
                        {ayuda.sexo || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Fecha de Nacimiento:
                        </span>{" "}
                        {ayuda.fechaNacimiento || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Municipio:</span>{" "}
                        {ayuda.municipio || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Parroquia:</span>{" "}
                        {ayuda.parroquia || "N/A"}
                      </p>
                      {/* ✅ TELÉFONO COMO ENLACE EN MÓVIL */}
                      <p>
                        <span className="font-semibold">Teléfono:</span>{" "}
                        {ayuda.telefono ? (
                          <a
                            href={`tel:${ayuda.telefono}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={14} />
                            {ayuda.telefono}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                      <p>
                        <span className="font-semibold">Calle:</span>{" "}
                        {ayuda.calle || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Dirección:</span>{" "}
                        {ayuda.direccion || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Institución:</span>{" "}
                        {ayuda.institucion || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Responsable Institución:
                        </span>{" "}
                        {ayuda.responsableInstitucion || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Observación:</span>{" "}
                        {ayuda.observacion || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Fecha de Registro:
                        </span>{" "}
                        {ayuda.fecha_registro || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Fecha de Actualización:
                        </span>{" "}
                        {ayuda.fecha_actualizacion || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Registrado por:</span>{" "}
                        {ayuda.usuario_registro_nombre || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Actualizado por:</span>{" "}
                        {ayuda.usuario_actualizacion_nombre || "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No se encontraron registros que coincidan con los criterios de
              búsqueda.
            </div>
          )}
        </div>

        {/* Paginación (sin cambios) */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
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
import React, { useState, useMemo } from "react";
import { ChevronRight, Users, Gauge, Phone, X } from "lucide-react";

// ✅ CAMBIA ESTO SEGÚN TU BACKEND (local o producción)
//const API_BASE_URL = "http://localhost:8000"; // Para local
const API_BASE_URL = "https://maneiro-api-mem1.onrender.com"; // Para producción

interface Tripulante {
  cargo: string;
  nombre_apellido: string;
  cedula_identidad: string;
  telefono?: string;
  sector?: string;
  direccion?: string;
  foto?: string;
}

interface Motor {
  numero_motor: number;
  marca: string;
  modelo?: string;
  serial_numero?: string;
}

interface Registro {
  id: number;
  numero_control: string;
  fecha_ingreso: string;
  hora_ingreso: string;
  nombre_embarcacion: string;
  matricula: string;
  puerto_base_origen: string;
  registro_insopesca?: string;
  arte_pesca_autorizado?: string;
  autorizacion_commpa?: string;
  observaciones?: string;
  tripulantes: Tripulante[];
  motores: Motor[];
  usuario_registro?: string;
  fecha_registro?: string;
  usuario_actualizacion?: string;
  fecha_actualizacion?: string;
}

interface TableProps {
  registros: Registro[];
  inscripciones?: any[]; // ✅ Nuevo: inscripciones en zafras
  selectedRegistro: Registro | null;
  handleRowSelect: (registro: Registro) => void;
  requestSort: (key: string) => void;
  renderSortArrow: (key: string) => string;
}

// ✅ Función para construir URL absoluta de la foto
const getFotoUrl = (foto?: string) => {
  if (!foto) return null;
  if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:image')) {
    return foto;
  }
  if (foto.startsWith('/media/')) {
    return `${API_BASE_URL}${foto}`;
  }
  return foto;
};

// ✅ Función para generar mensaje de WhatsApp
const getWhatsAppMessage = (registro: Registro) => {
  const tripulantesText = registro.tripulantes
    .map(t => `${getCargoLabel(t.cargo)}: ${t.nombre_apellido} (${t.cedula_identidad})`)
    .join('\n');

  const mensaje = `
*Registro de Embarcación*
N° Control: ${registro.numero_control}
Embarcación: ${registro.nombre_embarcacion}
Matrícula: ${registro.matricula || "N/A"}
Origen: ${registro.puerto_base_origen || "N/A"}
Fecha ingreso: ${registro.fecha_ingreso}
Hora ingreso: ${registro.hora_ingreso}
INSOPESCA: ${registro.registro_insopesca || "N/A"}
Arte de Pesca: ${registro.arte_pesca_autorizado || "N/A"}
COMMPA: ${registro.autorizacion_commpa || "N/A"}
Observaciones: ${registro.observaciones || "N/A"}

Tripulantes:
${tripulantesText}

Motores:
${registro.motores.map(m => `Motor ${m.numero_motor}: ${m.marca} ${m.modelo || ''} (Serial: ${m.serial_numero || 'N/A'})`).join('\n')}
  `.trim();

  return encodeURIComponent(mensaje);
};

const getCargoLabel = (cargo: string) => {
  const map: Record<string, string> = {
    'PATRON': 'Patrón',
    'MARINERO_1': 'Marinero 1',
    'MARINERO_2': 'Marinero 2',
    'MARINERO_3': 'Marinero 3'
  };
  return map[cargo] || cargo;
};

const Table = React.memo<TableProps>(({
  registros = [],
  inscripciones = [], // ✅ Nuevo: recibe inscripciones
  selectedRegistro,
  handleRowSelect,
  requestSort,
  renderSortArrow,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const safeRegistros = Array.isArray(registros) ? registros : [];

  // ✅ Mapa para obtener el nombre de la zafra de cada embarcación
  const inscripcionesMap = useMemo(() => {
    const map = new Map<number, { nombre: string; estado: string }>();
    if (!inscripciones || !Array.isArray(inscripciones)) return map;
    
    inscripciones.forEach((ins) => {
      const embarcacionId = ins.embarcacion;
      const nombreZafra = ins.zafra_nombre || ins.zafra || 'Sin nombre';
      const estado = ins.estado || 'ACTIVO';
      
      // Si ya tiene una zafra, la agregamos (podría tener varias)
      if (!map.has(embarcacionId)) {
        map.set(embarcacionId, { nombre: nombreZafra, estado });
      } else {
        // Si tiene varias, concatenamos con coma
        const existing = map.get(embarcacionId)!;
        if (!existing.nombre.includes(nombreZafra)) {
          map.set(embarcacionId, { 
            nombre: `${existing.nombre}, ${nombreZafra}`, 
            estado: existing.estado 
          });
        }
      }
    });
    return map;
  }, [inscripciones]);

  const getTripulantesCount = (tripulantes?: Tripulante[]) => tripulantes?.length || 0;
  const getMotoresCount = (motores?: Motor[]) => motores?.length || 0;

  const handleExpandToggle = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Lightbox
  const openImage = (url: string) => setSelectedImage(url);
  const closeImage = () => setSelectedImage(null);

  // WhatsApp
  const openWhatsApp = (registro: Registro) => {
    const message = getWhatsAppMessage(registro);
    window.open(`https://wa.me/?text=${message}`, 'whatsappWindow');
  };

  // Paginación
  const totalItems = safeRegistros.length;
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);
  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRegistros = useMemo(() => safeRegistros.slice(startIndex, endIndex), [safeRegistros, startIndex, endIndex]);

  const getPageNumbers = useMemo(() => {
    const pageNumbers: (number | string)[] = [];
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
        if (startPage > 2) pageNumbers.unshift("…");
        pageNumbers.unshift(1);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("…");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  }, [totalPages, currentPage]);

  return (
    <>
      <div className="bg-white shadow-lg rounded-xl border border-blue-100 flex flex-col">
        {/* ============ VISTA DESKTOP ============ */}
        <div className="hidden md:block md:overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#0095D4] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider w-10">
                  <span className="sr-only">Expandir</span>
                </th>
                <th onClick={() => requestSort("numero_control")} className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-tl-xl">
                  N° Control {renderSortArrow("numero_control")}
                </th>
                <th onClick={() => requestSort("fecha_ingreso")} className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20">
                  Fecha {renderSortArrow("fecha_ingreso")}
                </th>
                <th onClick={() => requestSort("nombre_embarcacion")} className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20">
                  Embarcación {renderSortArrow("nombre_embarcacion")}
                </th>
                <th onClick={() => requestSort("matricula")} className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white hover:bg-opacity-20">
                  Matrícula {renderSortArrow("matricula")}
                </th>
                <th onClick={() => requestSort("puerto_base_origen")} className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer bg-orange-500 hover:bg-orange-600">
                  Origen {renderSortArrow("puerto_base_origen")}
                </th>
                {/* ✅ NUEVA COLUMNA: ZAFRA */}
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider bg-green-600">
                  Zafra
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider">Tripulantes</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider">Motores</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider rounded-tr-xl">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto max-h-[400px]">
              {currentRegistros.length > 0 ? (
                currentRegistros.map((registro) => {
                  const zafraInfo = inscripcionesMap.get(registro.id);
                  const tieneZafra = zafraInfo && zafraInfo.nombre && zafraInfo.nombre !== 'Sin nombre';
                  
                  return (
                    <React.Fragment key={registro.id}>
                      <tr
                        onClick={() => handleRowSelect(registro)}
                        className={`cursor-pointer transition-colors ${
                          selectedRegistro?.id === registro.id ? "bg-blue-300" : "hover:bg-blue-100"
                        }`}
                      >
                        <td className="p-1 text-center w-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExpandToggle(registro.id); }}
                            className="p-1 rounded-full hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <ChevronRight className={`transition-transform duration-300 ${expandedRowId === registro.id ? "rotate-90" : "rotate-0"}`} size={16} />
                          </button>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{registro.numero_control}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">{registro.fecha_ingreso}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          <div className="max-w-[120px] overflow-hidden text-ellipsis">{registro.nombre_embarcacion}</div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">{registro.matricula || "N/A"}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-[#0069B6]">
                            {registro.puerto_base_origen || "N/A"}
                          </span>
                        </td>
                        {/* ✅ COLUMNA ZAFRA */}
                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                          {tieneZafra ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              zafraInfo.estado === 'ACTIVO' 
                                ? 'bg-green-100 text-green-800' 
                                : zafraInfo.estado === 'SUSPENDIDO'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {zafraInfo.nombre}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            <Users size={14} /> {getTripulantesCount(registro.tripulantes)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            <Gauge size={14} /> {getMotoresCount(registro.motores)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsApp(registro);
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 transition-all duration-200"
                            title="Compartir por WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* ========== FILA EXPANDIDA ========== */}
                      {expandedRowId === registro.id && (
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <td colSpan={10} className="p-4">
                            {/* Datos generales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                              <div>
                                <p><span className="font-semibold">Hora de Ingreso:</span> {registro.hora_ingreso || "N/A"}</p>
                                <p><span className="font-semibold">N° INSOPESCA:</span> {registro.registro_insopesca || "N/A"}</p>
                                <p><span className="font-semibold">Arte de Pesca:</span> {registro.arte_pesca_autorizado || "N/A"}</p>
                                <p><span className="font-semibold">N° COMMPA:</span> {registro.autorizacion_commpa || "N/A"}</p>
                                <p><span className="font-semibold">Observaciones:</span> {registro.observaciones || "N/A"}</p>
                              </div>
                              <div>
                                <p><span className="font-semibold">Registrado por:</span> {registro.usuario_registro || "N/A"}</p>
                                <p><span className="font-semibold">Fecha Registro:</span> {registro.fecha_registro || "N/A"}</p>
                                <p><span className="font-semibold">Actualizado por:</span> {registro.usuario_actualizacion || "N/A"}</p>
                                <p><span className="font-semibold">Fecha Actualización:</span> {registro.fecha_actualizacion || "N/A"}</p>
                                {/* ✅ Mostrar información de zafra en el detalle */}
                                {tieneZafra && (
                                  <p className="mt-2">
                                    <span className="font-semibold">Zafra:</span> 
                                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      zafraInfo.estado === 'ACTIVO' 
                                        ? 'bg-green-100 text-green-800' 
                                        : zafraInfo.estado === 'SUSPENDIDO'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {zafraInfo.nombre}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* ===== TRIPULACIÓN CON FOTO Y TELÉFONO ===== */}
                            {registro.tripulantes && registro.tripulantes.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Users size={16} /> Tripulación</h4>
                                <div className="overflow-x-auto mt-2">
                                  <table className="min-w-full divide-y divide-gray-300 text-xs">
                                    <thead className="bg-gray-200">
                                      <tr>
                                        <th className="px-3 py-1 text-left">Foto</th>
                                        <th className="px-3 py-1 text-left">Cargo</th>
                                        <th className="px-3 py-1 text-left">Nombre</th>
                                        <th className="px-3 py-1 text-left">Cédula</th>
                                        <th className="px-3 py-1 text-left">Teléfono</th>
                                        <th className="px-3 py-1 text-left">Sector</th>
                                        <th className="px-3 py-1 text-left">Dirección</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {registro.tripulantes.map((trip, idx) => {
                                        const fotoUrl = getFotoUrl(trip.foto);
                                        return (
                                          <tr key={idx}>
                                            <td className="px-3 py-1">
                                              {fotoUrl ? (
                                                <img
                                                  src={fotoUrl}
                                                  alt={trip.nombre_apellido}
                                                  className="w-10 h-10 object-cover rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                                  loading="lazy"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openImage(fotoUrl);
                                                  }}
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const parent = (e.target as HTMLImageElement).parentElement;
                                                    if (parent) {
                                                      const placeholder = document.createElement('div');
                                                      placeholder.className = 'w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs';
                                                      placeholder.textContent = '📷';
                                                      parent.appendChild(placeholder);
                                                      (e.target as HTMLImageElement).remove();
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">📷</div>
                                              )}
                                            </td>
                                            <td className="px-3 py-1 font-medium">{getCargoLabel(trip.cargo)}</td>
                                            <td className="px-3 py-1">{trip.nombre_apellido}</td>
                                            <td className="px-3 py-1">{trip.cedula_identidad}</td>
                                            <td className="px-3 py-1">
                                              {trip.telefono ? (
                                                <a
                                                  href={`tel:${trip.telefono}`}
                                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <Phone size={14} />
                                                  {trip.telefono}
                                                </a>
                                              ) : (
                                                "N/A"
                                              )}
                                            </td>
                                            <td className="px-3 py-1">{trip.sector || "N/A"}</td>
                                            <td className="px-3 py-1">{trip.direccion || "N/A"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Motores */}
                            {registro.motores && registro.motores.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Gauge size={16} /> Sistema de Propulsión</h4>
                                <div className="overflow-x-auto mt-2">
                                  <table className="min-w-full divide-y divide-gray-300 text-xs">
                                    <thead className="bg-gray-200">
                                      <tr>
                                        <th className="px-3 py-1 text-left">N° Motor</th>
                                        <th className="px-3 py-1 text-left">Marca</th>
                                        <th className="px-3 py-1 text-left">Modelo</th>
                                        <th className="px-3 py-1 text-left">Serial</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {registro.motores.map((motor, idx) => (
                                        <tr key={idx}>
                                          <td className="px-3 py-1 font-medium">{motor.numero_motor}</td>
                                          <td className="px-3 py-1">{motor.marca}</td>
                                          <td className="px-3 py-1">{motor.modelo || "N/A"}</td>
                                          <td className="px-3 py-1">{motor.serial_numero || "N/A"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron registros de embarcaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ============ VISTA MÓVIL ============ */}
        <div className="md:hidden p-4 space-y-4">
          {currentRegistros.length > 0 ? (
            currentRegistros.map((registro) => {
              const zafraInfo = inscripcionesMap.get(registro.id);
              const tieneZafra = zafraInfo && zafraInfo.nombre && zafraInfo.nombre !== 'Sin nombre';
              
              return (
                <div
                  key={registro.id}
                  onClick={() => handleRowSelect(registro)}
                  className={`block p-4 border rounded-xl shadow-sm cursor-pointer transition-colors ${
                    selectedRegistro?.id === registro.id ? "bg-blue-300 border-blue-400" : "bg-white border-gray-200 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900">{registro.nombre_embarcacion}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">{registro.numero_control}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsApp(registro);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 transition-all duration-200"
                        title="Compartir por WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-semibold">Matrícula:</span> {registro.matricula || "N/A"}</p>
                    <p><span className="font-semibold">Origen:</span> {registro.puerto_base_origen || "N/A"}</p>
                    <p><span className="font-semibold">Fecha ingreso:</span> {registro.fecha_ingreso}</p>
                    
                    {/* ✅ Zafra en móvil */}
                    <p>
                      <span className="font-semibold">Zafra:</span>{" "}
                      {tieneZafra ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          zafraInfo.estado === 'ACTIVO' 
                            ? 'bg-green-100 text-green-800' 
                            : zafraInfo.estado === 'SUSPENDIDO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {zafraInfo.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </p>
                    
                    <p className="flex items-center gap-2"><Users size={14} /> <span className="font-semibold">Tripulantes:</span> {getTripulantesCount(registro.tripulantes)}</p>
                    <p className="flex items-center gap-2"><Gauge size={14} /> <span className="font-semibold">Motores:</span> {getMotoresCount(registro.motores)}</p>

                    <div className="mt-2 text-right">
                      <button onClick={(e) => { e.stopPropagation(); handleExpandToggle(registro.id); }} className="text-sm text-blue-600 hover:underline flex items-center justify-end w-full">
                        {expandedRowId === registro.id ? "Ver menos detalles" : "Ver más detalles"}
                        <ChevronRight className={`ml-1 transition-transform duration-300 ${expandedRowId === registro.id ? "rotate-90" : "rotate-0"}`} size={16} />
                      </button>
                    </div>

                    {expandedRowId === registro.id && (
                      <div className="mt-2 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p><span className="font-semibold">Hora:</span> {registro.hora_ingreso || "N/A"}</p>
                        <p><span className="font-semibold">INSOPESCA:</span> {registro.registro_insopesca || "N/A"}</p>
                        <p><span className="font-semibold">Arte de Pesca:</span> {registro.arte_pesca_autorizado || "N/A"}</p>
                        <p><span className="font-semibold">COMMPA:</span> {registro.autorizacion_commpa || "N/A"}</p>
                        <p><span className="font-semibold">Observaciones:</span> {registro.observaciones || "N/A"}</p>

                        {/* Tripulación en móvil */}
                        {registro.tripulantes && registro.tripulantes.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-semibold text-gray-800">Tripulación</h4>
                            {registro.tripulantes.map((trip, idx) => {
                              const fotoUrl = getFotoUrl(trip.foto);
                              return (
                                <div key={idx} className="mt-1 p-2 bg-white rounded border border-gray-200 text-xs">
                                  <div className="flex items-center gap-2">
                                    {fotoUrl ? (
                                      <img
                                        src={fotoUrl}
                                        alt={trip.nombre_apellido}
                                        className="w-10 h-10 object-cover rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                        loading="lazy"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openImage(fotoUrl);
                                        }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs';
                                            placeholder.textContent = '📷';
                                            parent.appendChild(placeholder);
                                            (e.target as HTMLImageElement).remove();
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">📷</div>
                                    )}
                                    <div>
                                      <p><span className="font-semibold">Nombre:</span> {trip.nombre_apellido}</p>
                                      <p><span className="font-semibold">Cargo:</span> {getCargoLabel(trip.cargo)}</p>
                                    </div>
                                  </div>
                                  <p><span className="font-semibold">Cédula:</span> {trip.cedula_identidad}</p>
                                  <p>
                                    <span className="font-semibold">Teléfono:</span>{" "}
                                    {trip.telefono ? (
                                      <a
                                        href={`tel:${trip.telefono}`}
                                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Phone size={14} />
                                        {trip.telefono}
                                      </a>
                                    ) : (
                                      "N/A"
                                    )}
                                  </p>
                                  <p><span className="font-semibold">Sector:</span> {trip.sector || "N/A"}</p>
                                  <p><span className="font-semibold">Dirección:</span> {trip.direccion || "N/A"}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Motores en móvil */}
                        {registro.motores && registro.motores.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-semibold text-gray-800">Motores</h4>
                            {registro.motores.map((motor, idx) => (
                              <div key={idx} className="mt-1 p-2 bg-white rounded border border-gray-200 text-xs">
                                <p><span className="font-semibold">N° Motor:</span> {motor.numero_motor}</p>
                                <p><span className="font-semibold">Marca:</span> {motor.marca}</p>
                                <p><span className="font-semibold">Modelo:</span> {motor.modelo || "N/A"}</p>
                                <p><span className="font-semibold">Serial:</span> {motor.serial_numero || "N/A"}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">No se encontraron registros de embarcaciones.</div>
          )}
        </div>

        {/* ============ PAGINACIÓN ============ */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <span>Mostrar</span>
            <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0069B6] focus:ring-2 focus:ring-[#0095D4] focus:ring-opacity-50 py-1.5">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="1000">1000</option>
            </select>
          </div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
            {getPageNumbers.map((pageNumber, index) =>
              typeof pageNumber === "number" ? (
                <button key={index} onClick={() => handlePageChange(pageNumber)} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${pageNumber === currentPage ? "z-10 bg-[#0095D4] border-[#0095D4] text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`}>
                  {pageNumber}
                </button>
              ) : (
                <span key={index} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">{pageNumber}</span>
              )
            )}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
          </nav>
        </div>
      </div>

      {/* ============ LIGHTBOX PARA FOTOS ============ */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
          onClick={closeImage}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Foto ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={closeImage}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors"
            >
              <X size={28} />
            </button>
            <button
              onClick={closeImage}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
});

Table.displayName = 'Table';
export default Table;
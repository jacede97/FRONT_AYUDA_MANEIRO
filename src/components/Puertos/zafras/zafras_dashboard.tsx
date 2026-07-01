import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Alert from "../../Alert";
import ConfirmDeleteModal from "../../../layout/ConfirmDeleteModal";
import ZafraModal from "./ZafraModal";
import RegistroZafraModal from "./RegistroZafraModal";
import JornadaModal from "./JornadaModal";

interface Zafra {
  id: number;
  nombre: string;
  especie: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_semana: number[];
  cuota_total: string | null;
  observaciones: string;
}

interface RegistroZafra {
  id: number;
  zafra: number;
  embarcacion: number;
  embarcacion_matricula: string;
  embarcacion_nombre: string;
  fecha_inscripcion: string;
  estado: string;
}

interface Jornada {
  id: number;
  zafra: number;
  embarcacion: number;
  embarcacion_matricula: string;
  embarcacion_nombre: string;
  fecha: string;
  hora_salida: string;
  hora_llegada: string | null;
  tripulantes: any[];
  observaciones: string;
  capturas: { especie: string; cantidad: number; unidad: string }[];
}

const ZafrasDashboard: React.FC = () => {
  const [zafras, setZafras] = useState<Zafra[]>([]);
  const [selectedZafraId, setSelectedZafraId] = useState<number | null>(null);
  const [registrosZafra, setRegistrosZafra] = useState<RegistroZafra[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [selectedZafra, setSelectedZafra] = useState<Zafra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistroModalOpen, setIsRegistroModalOpen] = useState(false);
  const [isJornadaModalOpen, setIsJornadaModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "nombre", direction: "asc" });

  // Fetch zafras
  const fetchZafras = useCallback(async (showAlert = true) => {
    setLoading(true);
    try {
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/zafras/");
      setZafras(response.data);
      if (showAlert) {
        setAlert({ show: true, message: "Zafras cargadas exitosamente.", type: "success" });
      }
    } catch (error) {
      console.error("Error al cargar zafras:", error);
      setAlert({ show: true, message: "Error al conectar con la API de zafras.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detalle de una zafra (inscripciones y jornadas)
  const fetchZafraDetail = useCallback(async (zafraId: number) => {
    try {
      const [registrosRes, jornadasRes] = await Promise.all([
        axios.get(`https://maneiro-api-mem1.onrender.com/api/zafras/registros-zafra/?zafra_id=${zafraId}`),
        axios.get(`https://maneiro-api-mem1.onrender.com/api/zafras/jornadas/?zafra_id=${zafraId}`),
      ]);
      setRegistrosZafra(registrosRes.data);
      setJornadas(jornadasRes.data);
    } catch (error) {
      console.error("Error cargando detalle de zafra:", error);
      setAlert({ show: true, message: "Error al cargar inscripciones y jornadas.", type: "error" });
    }
  }, []);

  useEffect(() => {
    fetchZafras(true);
  }, [fetchZafras]);

  // Al seleccionar una zafra
  const selectZafra = (zafra: Zafra) => {
    if (selectedZafraId === zafra.id) {
      setSelectedZafraId(null);
      setSelectedZafra(null);
      setRegistrosZafra([]);
      setJornadas([]);
    } else {
      setSelectedZafraId(zafra.id);
      setSelectedZafra(zafra);
      fetchZafraDetail(zafra.id);
    }
  };

  // Abrir modales
  const openModal = (zafra: Zafra | null = null) => {
    setSelectedZafra(zafra);
    setIsModalOpen(true);
  };

  const openRegistroModal = () => {
    if (!selectedZafra) return;
    setIsRegistroModalOpen(true);
  };

  const openJornadaModal = () => {
    if (!selectedZafra) return;
    setIsJornadaModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedZafra(null);
    setAlert({ show: false, message: "", type: "" });
  };

  const closeRegistroModal = () => {
    setIsRegistroModalOpen(false);
    if (selectedZafra) {
      fetchZafraDetail(selectedZafra.id);
    }
  };

  const closeJornadaModal = () => {
    setIsJornadaModalOpen(false);
    if (selectedZafra) {
      fetchZafraDetail(selectedZafra.id);
    }
  };

  // Eliminar zafra
  const handleDelete = (zafra: Zafra) => {
    setItemToDelete(zafra);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`https://maneiro-api-mem1.onrender.com/api/zafras/zafras/${itemToDelete.id}/`);
      setAlert({ show: true, message: "Zafra eliminada exitosamente.", type: "success" });
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
      setSelectedZafraId(null);
      setSelectedZafra(null);
      fetchZafras(false);
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setAlert({ show: true, message: `Error al eliminar: ${error.response?.data?.detail || error.message}`, type: "error" });
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  // Filtros y ordenamiento
  const filteredZafras = useMemo(() => {
    return zafras.filter((z) =>
      z.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      z.especie.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [zafras, searchTerm]);

  const sortedZafras = useMemo(() => {
    const sortable = [...filteredZafras];
    if (sortConfig.key) {
      return sortable.sort((a, b) => {
        const aVal = (a[sortConfig.key as keyof Zafra] || "").toString().toLowerCase();
        const bVal = (b[sortConfig.key as keyof Zafra] || "").toString().toLowerCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return sortable;
  }, [filteredZafras, sortConfig]);

  const requestSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (columnName: string) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === "asc" ? " ↑" : " ↓";
    }
    return "";
  };

  const formatDiasSemana = (dias: number[]) => {
    const map: Record<number, string> = {
      1: "Lun",
      2: "Mar",
      3: "Mié",
      4: "Jue",
      5: "Vie",
      6: "Sáb",
      7: "Dom",
    };
    return dias.map(d => map[d] || d).join(", ");
  };

  return (
    <div className="flex-1 p-2 font-sans bg-gray-50 rounded-xl">
      {alert.show && <Alert message={alert.message} type={alert.type} setAlert={setAlert} />}

      <div className="mb-6 flex flex-col justify-center sm:flex-row items-center gap-4 rounded-xl bg-white p-4 shadow-lg border border-gray-300">
        <img src="/LOGO.png" alt="Logo" className="h-16 w-auto object-contain" />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Zafras / Temporadas</h2>
          <p className="text-gray-600 mt-1">Administre temporadas, inscripciones y jornadas de pesca</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nombre o especie</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Sardina 2026..."
              className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button onClick={() => openModal(null)} className="bg-[#0069B6] text-white px-4 py-2 rounded-xl hover:bg-[#003578] transition-all font-medium flex items-center shadow-lg text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Zafra
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow-lg mt-6 border border-blue-100 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => requestSort("nombre")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Nombre {renderSortArrow("nombre")}
              </th>
              <th
                onClick={() => requestSort("especie")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Especie {renderSortArrow("especie")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días Permitidos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cuota Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Cargando zafras...
                </td>
              </tr>
            ) : sortedZafras.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No hay zafras registradas
                </td>
              </tr>
            ) : (
              sortedZafras.map((zafra) => (
                <React.Fragment key={zafra.id}>
                  <tr
                    onClick={() => selectZafra(zafra)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedZafraId === zafra.id ? "bg-blue-100" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zafra.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zafra.especie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zafra.fecha_inicio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zafra.fecha_fin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDiasSemana(zafra.dias_semana)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zafra.cuota_total || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(zafra); }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(zafra); }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  {/* Detalle expandido */}
                  {selectedZafraId === zafra.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-blue-50">
                        <div className="space-y-4">
                          {/* Información de la zafra */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm">
                            <div>
                              <span className="text-xs text-gray-500">Nombre:</span>
                              <p className="font-medium">{zafra.nombre}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Especie:</span>
                              <p className="font-medium">{zafra.especie}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Cuota Total:</span>
                              <p className="font-medium">{zafra.cuota_total || "No definida"}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Observaciones:</span>
                              <p className="font-medium text-sm">{zafra.observaciones || "Sin observaciones"}</p>
                            </div>
                          </div>

                          {/* Acciones rápidas */}
                          <div className="flex gap-2">
                            <button
                              onClick={openRegistroModal}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              + Inscribir Embarcación
                            </button>
                            <button
                              onClick={openJornadaModal}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                            >
                              + Registrar Jornada
                            </button>
                          </div>

                          {/* Tabs para mostrar inscripciones y jornadas */}
                          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="border-b border-gray-200">
                              <nav className="flex -mb-px">
                                <button
                                  className="py-2 px-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
                                  onClick={() => {}}
                                >
                                  Inscripciones ({registrosZafra.length})
                                </button>
                                <button
                                  className="py-2 px-4 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                                  onClick={() => {}}
                                >
                                  Jornadas ({jornadas.length})
                                </button>
                              </nav>
                            </div>
                            <div className="p-4">
                              {/* Lista de inscripciones */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Embarcaciones Inscritas</h4>
                                {registrosZafra.length === 0 ? (
                                  <p className="text-sm text-gray-500">No hay embarcaciones inscritas</p>
                                ) : (
                                  <ul className="divide-y divide-gray-200">
                                    {registrosZafra.map((reg) => (
                                      <li key={reg.id} className="py-2 flex justify-between items-center">
                                        <div>
                                          <span className="font-medium">{reg.embarcacion_matricula}</span>
                                          <span className="text-sm text-gray-600 ml-2">{reg.embarcacion_nombre}</span>
                                          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                            reg.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                                            reg.estado === 'SUSPENDIDO' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {reg.estado}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {reg.fecha_inscripcion}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Lista de jornadas */}
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Jornadas Registradas</h4>
                                {jornadas.length === 0 ? (
                                  <p className="text-sm text-gray-500">No hay jornadas registradas</p>
                                ) : (
                                  <ul className="divide-y divide-gray-200">
                                    {jornadas.map((j) => (
                                      <li key={j.id} className="py-2">
                                        <div className="flex justify-between">
                                          <div>
                                            <span className="font-medium">{j.embarcacion_matricula}</span>
                                            <span className="text-sm text-gray-600 ml-2">{j.fecha}</span>
                                            <span className="text-sm text-gray-500 ml-2">{j.hora_salida} - {j.hora_llegada || "—"}</span>
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {j.capturas?.length || 0} capturas
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center bg-white p-3 rounded-xl shadow-md border border-blue-100">
        Mostrando {sortedZafras.length} de {zafras.length} zafras
      </div>

      {/* Modales */}
      <ZafraModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => fetchZafras(false)}
        zafra={selectedZafra}
      />

      <RegistroZafraModal
        isOpen={isRegistroModalOpen}
        onClose={closeRegistroModal}
        onSuccess={() => {
          if (selectedZafra) fetchZafraDetail(selectedZafra.id);
        }}
        zafraId={selectedZafra?.id}
      />

      <JornadaModal
        isOpen={isJornadaModalOpen}
        onClose={closeJornadaModal}
        onSuccess={() => {
          if (selectedZafra) fetchZafraDetail(selectedZafra.id);
        }}
        zafraId={selectedZafra?.id}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.nombre || "esta zafra"}
      />
    </div>
  );
};

export default ZafrasDashboard;
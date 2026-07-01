import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Table from "./puertos_table";
import Modal from "./puertos_modal";
import Alert from "../Alert";
import ConfirmDeleteModal from "../../layout/ConfirmDeleteModal";
import { generatePlanilla } from "./puertos_documento";

interface FormData {
  fecha_ingreso: string;
  hora_ingreso: string;
  numero_control: string;
  nombre_embarcacion: string;
  matricula: string;
  puerto_base_origen: string;
  registro_insopesca: string;
  arte_pesca_autorizado: string;
  autorizacion_commpa: string;
  observaciones: string;
  tripulantes: any[];
  motores: any[];
}

const PuertosDashboard = () => {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [registros, setRegistros] = useState<any[]>([]);
  const [inscripciones, setInscripciones] = useState<any[]>([]); // ✅ Nuevo: inscripciones en zafras
  const [selectedRegistro, setSelectedRegistro] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchControl, setSearchControl] = useState("");
  const [searchPalabra, setSearchPalabra] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "numero_control", direction: "desc" });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [modalProps, setModalProps] = useState({
    title: "",
    headerColor: "",
  });

  const [formData, setFormData] = useState<FormData>({
    fecha_ingreso: "",
    hora_ingreso: "",
    numero_control: "",
    nombre_embarcacion: "",
    matricula: "",
    puerto_base_origen: "",
    registro_insopesca: "",
    arte_pesca_autorizado: "",
    autorizacion_commpa: "",
    observaciones: "",
    tripulantes: [],
    motores: [],
  });

  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinForAction, setPinForAction] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || "basico";

  const getCargoLabel = (cargo: string) => {
    const map: Record<string, string> = {
      'PATRON': 'Patrón',
      'MARINERO_1': 'Marinero 1',
      'MARINERO_2': 'Marinero 2',
      'MARINERO_3': 'Marinero 3'
    };
    return map[cargo] || cargo;
  };

  // ---- Fetch de registros e inscripciones ----
  const fetchRegistros = useCallback(async (showAlert = true, force = false) => {
    const cacheKey = "registros_puerto_cache";
    const cacheExpiration = 86400000;
    const cachedData = localStorage.getItem(cacheKey);

    if (!force && cachedData) {
      const { data: cachedRegistros, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheExpiration) {
        console.log("Cargando registros desde caché");
        setRegistros(cachedRegistros);
        await fetchInscripciones(false); // Cargar inscripciones siempre actualizadas
        return;
      }
    }

    try {
      // Obtener registros de embarcaciones
      const registrosRes = await axios.get("https://maneiro-api-mem1.onrender.com/api/registros_puerto/");
      const data = registrosRes.data;
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      setRegistros(data);
      
      // Obtener inscripciones en zafras
      await fetchInscripciones(showAlert);
      
      if (showAlert) {
        setAlert({ show: true, message: "Registros cargados exitosamente.", type: "success" });
      }
    } catch (error) {
      console.error("Error al cargar registros:", error);
      setAlert({ show: true, message: "Error al conectar con la API de puertos.", type: "error" });
    }
  }, []);

  const fetchInscripciones = async (showAlert = false) => {
    try {
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/registros-zafra/");
      setInscripciones(response.data);
    } catch (error) {
      console.error("Error al cargar inscripciones:", error);
      if (showAlert) {
        setAlert({ show: true, message: "Error al cargar inscripciones en zafras.", type: "warning" });
      }
    }
  };

  useEffect(() => {
    fetchRegistros(true);
    const interval = setInterval(() => fetchRegistros(false), 300000);
    return () => clearInterval(interval);
  }, [fetchRegistros]);

  // ---- Handlers para el modal ----
  const openModal = (registro: any = null) => {
    if (registro) {
      setSelectedRegistro(registro);
      setFormData({
        fecha_ingreso: registro.fecha_ingreso || "",
        hora_ingreso: registro.hora_ingreso || "",
        numero_control: registro.numero_control || "",
        nombre_embarcacion: registro.nombre_embarcacion || "",
        matricula: registro.matricula || "",
        puerto_base_origen: registro.puerto_base_origen || "",
        registro_insopesca: registro.registro_insopesca || "",
        arte_pesca_autorizado: registro.arte_pesca_autorizado || "",
        autorizacion_commpa: registro.autorizacion_commpa || "",
        observaciones: registro.observaciones || "",
        tripulantes: registro.tripulantes || [],
        motores: registro.motores || [],
      });
      setModalProps({ title: "Editar Registro", headerColor: "bg-[#FFCB00]" });
    } else {
      setSelectedRegistro(null);
      setFormData({
        fecha_ingreso: "",
        hora_ingreso: "",
        numero_control: "",
        nombre_embarcacion: "",
        matricula: "",
        puerto_base_origen: "",
        registro_insopesca: "",
        arte_pesca_autorizado: "",
        autorizacion_commpa: "",
        observaciones: "",
        tripulantes: [],
        motores: [],
      });
      setModalProps({ title: "Nuevo Registro de Embarcación", headerColor: "bg-[#0095D4]" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAlert({ show: false, message: "", type: "" });
  };

  // ---- Normalizar cargos ----
  const normalizeCargos = (tripList: any[]) => {
    if (!tripList.length) return [];
    const hasPatron = tripList.some(t => t.cargo === 'PATRON');
    let normalized = [...tripList];
    if (!hasPatron) {
      normalized[0] = { ...normalized[0], cargo: 'PATRON' };
    } else {
      const patronIndex = normalized.findIndex(t => t.cargo === 'PATRON');
      if (patronIndex > 0) {
        const [patron] = normalized.splice(patronIndex, 1);
        normalized.unshift(patron);
      }
    }
    let marineroCount = 0;
    return normalized.map((t, idx) => {
      if (idx === 0) return { ...t, cargo: 'PATRON' };
      marineroCount++;
      return { ...t, cargo: `MARINERO_${marineroCount}` };
    });
  };

  // ---- Guardar ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fecha_ingreso || !formData.hora_ingreso || !formData.nombre_embarcacion) {
      setAlert({ show: true, message: "Fecha, hora y nombre de embarcación son obligatorios.", type: "error" });
      return;
    }

    const patron = formData.tripulantes?.find(t => t.cargo === "PATRON");
    if (!patron) {
      setAlert({ show: true, message: "Debe incluir al menos un Patrón en la tripulación.", type: "error" });
      return;
    }

    if (pinRequired && pinInput !== "270725") {
      setAlert({ show: true, message: "PIN incorrecto. No se puede realizar la acción.", type: "error" });
      return;
    }

    const payload: any = { ...formData };
    if (!payload.numero_control || payload.numero_control.trim() === "") {
      delete payload.numero_control;
    }

    const normalizedTripulantes = normalizeCargos(payload.tripulantes);
    payload.tripulantes = normalizedTripulantes
      .map((t: any) => {
        const clean = { ...t };
        if (selectedRegistro) {
          delete clean.registro;
          if (clean.foto && typeof clean.foto === 'string' && (clean.foto.startsWith('http') || clean.foto.startsWith('/media'))) {
            delete clean.foto;
          }
          if (!clean.foto) {
            delete clean.foto;
          }
        } else {
          delete clean.id;
          delete clean.registro;
          if (!clean.foto || typeof clean.foto === 'string' && clean.foto === '') {
            delete clean.foto;
          }
        }
        return {
          ...clean,
          telefono: clean.telefono || null,
          sector: clean.sector || null,
          direccion: clean.direccion || null,
          fecha_nacimiento: clean.fecha_nacimiento || null,
        };
      })
      .filter((t: any) => t.nombre_apellido && t.nombre_apellido.trim() !== '');

    payload.motores = payload.motores
      .map((m: any) => {
        const clean = { ...m };
        if (selectedRegistro) {
          delete clean.registro;
        } else {
          delete clean.id;
          delete clean.registro;
        }
        return {
          ...clean,
          modelo: clean.modelo || null,
          serial_numero: clean.serial_numero || null,
        };
      })
      .filter((m: any) => m.marca && m.marca.trim() !== '');

    console.log("📦 Payload a enviar:", JSON.stringify(payload, null, 2));

    try {
      let response;
      if (selectedRegistro) {
        response = await axios.put(`https://maneiro-api-mem1.onrender.com/api/registros_puerto/${selectedRegistro.id}/`, payload);
      } else {
        response = await axios.post("https://maneiro-api-mem1.onrender.com/api/registros_puerto/", payload);
      }

      setAlert({
        show: true,
        message: selectedRegistro ? "Registro actualizado correctamente." : "Registro creado correctamente.",
        type: "success",
      });
      closeModal();
      fetchRegistros(false, true);
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      let errorMessage = "Error al guardar el registro.";
      if (error.response) {
        const errorData = error.response.data;
        console.error("📄 Datos de error del backend:", JSON.stringify(errorData, null, 2));
        if (typeof errorData === 'object' && errorData !== null) {
          const formatErrors = (obj: any, prefix = ''): string => {
            if (!obj || typeof obj !== 'object') return String(obj);
            const lines: string[] = [];
            for (const [key, value] of Object.entries(obj)) {
              const newPrefix = prefix ? `${prefix}.${key}` : key;
              if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                value.forEach((item, idx) => {
                  lines.push(formatErrors(item, `${newPrefix}[${idx}]`));
                });
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                lines.push(formatErrors(value, newPrefix));
              } else {
                const msg = Array.isArray(value) ? value.join(', ') : value;
                lines.push(`${newPrefix}: ${msg}`);
              }
            }
            return lines.join('\n');
          };
          errorMessage = `Error ${error.response.status}:\n${formatErrors(errorData)}`;
        } else {
          errorMessage = errorData?.detail || error.response.statusText || errorMessage;
        }
      } else if (error.request) {
        errorMessage = "No se recibió respuesta del servidor.";
      } else {
        errorMessage = error.message;
      }
      setAlert({ show: true, message: errorMessage, type: "error" });
    }
  };

  // ---- Eliminar ----
  const handleDelete = () => {
    if (selectedRegistro) {
      setItemToDelete(selectedRegistro);
      setIsConfirmModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`https://maneiro-api-mem1.onrender.com/api/registros_puerto/${itemToDelete.id}/`);
      setAlert({ show: true, message: "Registro eliminado exitosamente.", type: "success" });
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
      setSelectedRegistro(null);
      fetchRegistros(false, true);
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

  // ---- Filtros y ordenamiento ----
  const filteredRegistros = useMemo(() => {
    return registros.filter((r) => {
      const matchesControl =
        r.numero_control?.toLowerCase().includes(searchControl.toLowerCase()) ||
        r.nombre_embarcacion?.toLowerCase().includes(searchControl.toLowerCase()) ||
        r.matricula?.toLowerCase().includes(searchControl.toLowerCase());
      const matchesPalabra =
        r.nombre_embarcacion?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
        r.matricula?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
        r.puerto_base_origen?.toLowerCase().includes(searchPalabra.toLowerCase());
      return matchesControl && matchesPalabra;
    });
  }, [registros, searchControl, searchPalabra]);

  const sortedRegistros = useMemo(() => {
    const sortable = [...filteredRegistros];
    if (sortConfig.key) {
      return sortable.sort((a, b) => {
        const aVal = (a[sortConfig.key] || "").toString().toLowerCase();
        const bVal = (b[sortConfig.key] || "").toString().toLowerCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return sortable;
  }, [filteredRegistros, sortConfig]);

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

  // ---- Funciones PIN ----
  const requirePinForAction = (action: string) => {
    setActionToConfirm(action);
    setIsPinModalOpen(true);
    setPinForAction("");
  };

  const confirmPinAction = () => {
    if (pinForAction !== "270725") {
      setAlert({ show: true, message: "PIN incorrecto. Acción denegada.", type: "error" });
      setIsPinModalOpen(false);
      setPinForAction("");
      setActionToConfirm(null);
      return;
    }
    if (actionToConfirm === "edit") {
      openModal(selectedRegistro);
    } else if (actionToConfirm === "delete") {
      handleDelete();
    }
    setIsPinModalOpen(false);
    setPinForAction("");
    setActionToConfirm(null);
  };

  // ---- Render ----
  return (
    <div className="flex-1 p-2 font-sans bg-gray-50 rounded-xl">
      {alert.show && <Alert message={alert.message} type={alert.type} setAlert={setAlert} />}

      <div className="mb-6 flex flex-col justify-center sm:flex-row items-center gap-4 rounded-xl bg-white p-4 shadow-lg border border-gray-300">
        <img src="/LOGO.png" alt="Logo" className="h-16 w-auto object-contain" />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800">Registro de Embarcaciones Foráneas</h2>
          <p className="text-gray-600 mt-1">Puerto de Pampatar - Municipio Maneiro</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por N° Control / Embarcación</label>
              <input
                type="text"
                value={searchControl}
                onChange={(e) => setSearchControl(e.target.value)}
                placeholder="N° Control, nombre o matrícula..."
                className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por palabra clave</label>
              <input
                type="text"
                value={searchPalabra}
                onChange={(e) => setSearchPalabra(e.target.value)}
                placeholder="Origen, observaciones..."
                className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button onClick={() => openModal()} className="bg-[#0069B6] text-white px-4 py-2 rounded-xl hover:bg-[#003578] transition-all font-medium flex items-center shadow-lg text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo
            </button>
            <button
              onClick={() => {
                if (selectedRegistro) {
                  openModal(selectedRegistro);
                } else {
                  setAlert({ show: true, message: "Seleccione un registro para editar.", type: "warning" });
                }
              }}
              disabled={!selectedRegistro}
              className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm ${
                selectedRegistro ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => selectedRegistro && generatePlanilla(selectedRegistro, setAlert)}
              disabled={!selectedRegistro}
              className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm ${
                selectedRegistro ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Planilla
            </button>
            {userRole !== "recepcion" && (
              <button
                onClick={() => {
                  if (!selectedRegistro) {
                    setAlert({ show: true, message: "Seleccione un registro para eliminar.", type: "warning" });
                    return;
                  }
                  if (userRole === "admin") {
                    handleDelete();
                  } else {
                    requirePinForAction("delete");
                  }
                }}
                disabled={!selectedRegistro}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm ${
                  selectedRegistro ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow-lg mt-6 border border-blue-100 bg-white">
        <Table
          registros={sortedRegistros}
          inscripciones={inscripciones} // ✅ Pasamos las inscripciones a la tabla
          selectedRegistro={selectedRegistro}
          handleRowSelect={setSelectedRegistro}
          requestSort={requestSort}
          renderSortArrow={renderSortArrow}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center bg-white p-3 rounded-xl shadow-md border border-blue-100">
        Mostrando {sortedRegistros.length} de {registros.length} registros
      </div>

      <Modal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        selectedRegistro={selectedRegistro}
        alert={alert}
        setAlert={setAlert}
        modalTitle={modalProps.title}
        modalHeaderColor={modalProps.headerColor}
        pinRequired={pinRequired}
        pinInput={pinInput}
        handlePinInputChange={(e) => setPinInput(e.target.value)}
        setPinRequired={setPinRequired}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.nombre_embarcacion || "este registro"}
      />

      {isPinModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔐 Validación de Seguridad</h3>
            <p className="text-sm text-gray-600 mb-4">
              Para {actionToConfirm === "edit" ? "editar" : "eliminar"} este registro, ingrese el PIN de seguridad.
            </p>
            <input
              type="password"
              value={pinForAction}
              onChange={(e) => setPinForAction(e.target.value)}
              placeholder="Ingrese PIN (6 dígitos)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] text-center text-lg tracking-widest"
              maxLength="6"
              autoFocus
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinForAction("");
                  setActionToConfirm(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button onClick={confirmPinAction} className="px-4 py-2 bg-[#0069B6] text-white rounded-xl hover:bg-[#003578]">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuertosDashboard;
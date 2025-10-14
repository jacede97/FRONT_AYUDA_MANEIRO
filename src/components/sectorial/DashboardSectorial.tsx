import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Table from "./tableSectorial"; // Asume que Table.jsx se adaptará a los nuevos campos
import Modal from "../../layout/Modal"; // Asume que Modal.jsx se adaptará al nuevo formulario
import Alert from "../Alert";
import ConfirmDeleteModal from "../../layout/ConfirmDeleteModal";
import { generatePlanilla } from "./documentoSectorial"; // Esta función probablemente necesitará adaptación

// ----------------------------------------------------------------------
// URL BASE ADAPTADA PARA AYUDAS SECTORIALES
// ----------------------------------------------------------------------
const API_BASE_URL = "https://maneiro-api-mem1.onrender.com/api/sectoriales/";

const DashboardSectorial = () => {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyuda, setSelectedAyuda] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mantengo los filtros, aunque la palabra clave ahora buscará en sector, responsable, etc.
  const [searchCodigo, setSearchCodigo] = useState(""); 
  const [searchPalabra, setSearchPalabra] = useState(""); 
  const [sortConfig, setSortConfig] = useState({ key: "codigo", direction: "desc" });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [modalProps, setModalProps] = useState({
    title: "",
    headerColor: "",
  });

  // ----------------------------------------------------------------------
  // ESTADO DE FORMULARIO ADAPTADO PARA AYUDAS SECTORIALES
  // ----------------------------------------------------------------------
  const [formData, setFormData] = useState({
    municipio: "",
    parroquia: "",
    sector: "", // Campo clave
    estructura: "",
    calle: "",
    direccion_completa: "", // Cambiado de 'direccion'
    institucion: "", // Mantenido, asumo que la institución que lo gestiona
    estado: "",
    tipo_solicitud: "", // Cambiado de 'tipo'
    responsible: "", // Cambiado de 'responsableInstitucion'
    subtipo: "",
    observacion: "",
  });

  // PIN solo para acciones sensibles (eliminar/finalizar/editar)
  const [pinForAction, setPinForAction] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalizeObservation, setFinalizeObservation] = useState("");

  // Obtener el rol del usuario desde localStorage
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const userRole = user.role || "basico";

  // Ref para almacenar la última versión de ayudas desde la API
  const lastApiData = useRef(null);

  // Alerta
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  // Ya no es necesario, solo para mantener la consistencia del código original
  const formatToYYYYMMDD = (dateString) => {
    return dateString; // Los datos de AyudaSectorial no contienen fechas de nacimiento
  };

  // ----------------------------------------------------------------------
  // FUNCIÓN FETCH ADAPTADA
  // ----------------------------------------------------------------------
  const fetchAyudas = useCallback(async (showAlert = true, force = false) => {
    console.log("INTENTANDO: Cargar ayudas sectoriales...");
    const cacheKey = "ayudas_sectoriales_cache";
    const cacheExpiration = 86400000; // 24 horas en milisegundos
    const cachedData = localStorage.getItem(cacheKey);

    if (!force && cachedData) {
      const { data: cachedAyudas, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheExpiration) {
        console.log("ÉXITO: Cargando desde caché");
        setAyudas(cachedAyudas);
        compareWithApi(cachedAyudas); // background check
        return;
      }
    }

    try {
      // ⚠️ Ruta adaptada
      const response = await axios.get(API_BASE_URL); 
      console.log("ÉXITO: Respuesta de la API (datos crudos de Ayudas Sectoriales):", response.data);

      const apiAyudas = response.data.map((ayuda) => {
        return {
          ...ayuda,
          id: ayuda.id,
          // Mapeo de campos a la estructura de la tabla (si es necesario)
          fecha: new Date(ayuda.fecha_registro).toISOString().split("T")[0],
          // Los campos como cedula, beneficiario, etc. se eliminan aquí
        };
      });

      // Guarda en caché con timestamp
      localStorage.setItem(cacheKey, JSON.stringify({ data: apiAyudas, timestamp: Date.now() }));
      setAyudas(apiAyudas);
      lastApiData.current = apiAyudas;

      if (showAlert) {
        setAlert({
          show: true,
          message: "Datos de Ayudas Sectoriales cargados exitosamente desde la API.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("ERROR: Fallo al cargar las ayudas sectoriales desde la API.", error);
      let errorMessage = "¡Error al conectar con la API de Ayudas Sectoriales! No se pudieron cargar los datos.";
      // ... (manejo de errores es igual)
      if (error.response) {
        errorMessage = `Error de la API: ${error.response.status}. Mensaje: ${
          error.response.data.detail || error.response.data.message || "Error desconocido"
        }`;
      } else if (error.request) {
        errorMessage = "No se pudo conectar al servidor de la API. Por favor, intente de nuevo más tarde.";
      } else {
        errorMessage = `Error al procesar la solicitud: ${error.message}`;
      }

      setAlert({
        show: true,
        message: errorMessage,
        type: "error",
      });
    }
  }, []); // Dependencias vacías

  // Función de comparación adaptada
  const compareWithApi = async (cachedAyudas) => {
    try {
      const response = await axios.get(API_BASE_URL, { timeout: 5000 });
      const apiAyudas = response.data.map((ayuda) => ({
        ...ayuda,
        fecha: new Date(ayuda.fecha_registro).toISOString().split("T")[0],
        // Mapeo de campos sectoriales
      }));

      // ... (lógica de comparación se mantiene)
      const hasChanges = cachedAyudas.length !== apiAyudas.length || 
        !cachedAyudas.every((cached) => apiAyudas.some((api) => api.id === cached.id && JSON.stringify(api) === JSON.stringify(cached)));

      if (hasChanges) {
        console.log("Detectados cambios en la API, actualizando datos...");
        setAyudas(apiAyudas);
        localStorage.setItem("ayudas_sectoriales_cache", JSON.stringify({ data: apiAyudas, timestamp: Date.now() }));
        setAlert({
          show: true,
          message: "Datos actualizados desde la API debido a cambios detectados.",
          type: "success",
        });
      } else {
        console.log("No hay cambios en la API.");
      }
    } catch (error) {
      console.warn("No se pudo comparar con la API en background:", error);
    }
  };

  useEffect(() => {
    fetchAyudas(true); 

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAyudas(false);
      }
    };

    const checkInterval = setInterval(() => {
      const cachedData = localStorage.getItem("ayudas_sectoriales_cache");
      if (cachedData) {
        const { data: cachedAyudas } = JSON.parse(cachedData);
        compareWithApi(cachedAyudas);
      }
    }, 300000); // 5 minutos

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [fetchAyudas]);

  // ----------------------------------------------------------------------
  // LÓGICA DE BÚSQUEDA DE BENEFICIARIO (ELIMINADA)
  // ----------------------------------------------------------------------
  // Se elimina la función handleSearchBeneficiary y checkIfPinRequired
  // porque el registro ya no depende de la cédula ni del historial.

  const handleRowSelect = (ayuda) => {
    setSelectedAyuda(ayuda);
  };

  // ----------------------------------------------------------------------
  // FUNCIÓN OPEN MODAL ADAPTADA
  // ----------------------------------------------------------------------
  const openModal = (ayuda = null) => {
    if (ayuda) {
      setSelectedAyuda(ayuda);
      setFormData({
        // Adaptamos los nombres de campos al modelo Sectorial
        municipio: ayuda.municipio || "",
        parroquia: ayuda.parroquia || "",
        sector: ayuda.sector || "",
        estructura: ayuda.estructura || "",
        calle: ayuda.calle || "",
        direccion_completa: ayuda.direccion_completa || "", // Nuevo nombre
        institucion: ayuda.institucion || "",
        estado: ayuda.estado || "",
        tipo_solicitud: ayuda.tipo_solicitud || "", // Nuevo nombre
        subtipo: ayuda.subtipo || "",
        observacion: ayuda.observacion || "",
        responsible: ayuda.responsible || "", // Nuevo nombre
      });
      setModalProps({
        title: "Editar Ayuda Sectorial",
        headerColor: "bg-[#FFCB00]",
      });
    } else {
      setSelectedAyuda(null);
      setFormData({
        // Valores por defecto para crear
        municipio: "",
        parroquia: "",
        sector: "",
        estructura: "",
        calle: "",
        direccion_completa: "",
        institucion: "",
        estado: "REGISTRADO / RECIBIDO",
        tipo_solicitud: "",
        subtipo: "",
        observacion: "",
        responsible: "",
      });
      setModalProps({
        title: "Nueva Ayuda Sectorial",
        headerColor: "bg-[#0095D4]",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPinInput("");
    setAlert({ show: false, message: "", type: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------------------------------------
  // FUNCIÓN SUBMIT ADAPTADA
  // ----------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación mínima para Ayudas Sectoriales
    if (
      !formData.municipio ||
      !formData.parroquia ||
      !formData.sector ||
      !formData.tipo_solicitud ||
      !formData.responsible
    ) {
      setAlert({
        show: true,
        message:
          "Por favor, complete los campos requeridos: Municipio, Parroquia, Sector, Tipo de Solicitud y Responsable.",
        type: "error",
      });
      return;
    }

    // Eliminada la validación de teléfono y la validación de PIN para registrar.

    // La generación del código se maneja en el backend (Django).
    // Aquí solo creamos el objeto de datos que se enviará
    const apiData = {
      // No incluimos 'codigo', 'fecha_registro' ni 'fecha_actualizacion' en el POST/PUT
      // ya que el backend las maneja automáticamente (o son de solo lectura).
      municipio: formData.municipio,
      parroquia: formData.parroquia,
      sector: formData.sector,
      estructura: formData.estructura || "",
      calle: formData.calle || "",
      direccion_completa: formData.direccion_completa || "",
      institucion: formData.institucion || "",
      estado: formData.estado || "REGISTRADO / RECIBIDO",
      tipo_solicitud: formData.tipo_solicitud || "",
      responsible: formData.responsible || "",
      subtipo: formData.subtipo || "",
      observacion: formData.observacion || "",
    };

    let tempId = null;
    if (!selectedAyuda) {
      tempId = Date.now(); // Simulación de ID para optimismo
      const newAyuda = { 
        ...apiData, 
        id: tempId, 
        codigo: 'PENDIENTE', 
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
      };
      setAyudas((prev) => [newAyuda, ...prev]);
    }

    try {
      if (selectedAyuda) {
        // PATCH/PUT a la URL con ID
        await axios.put(
          `${API_BASE_URL}${selectedAyuda.id}/`,
          apiData // Enviamos solo los campos modificables
        );
        setAlert({
          show: true,
          message: "Ayuda Sectorial actualizada exitosamente.",
          type: "success",
        });
      } else {
        // POST a la URL base
        await axios.post(API_BASE_URL, apiData);
        setAlert({
          show: true,
          message: "Nueva Ayuda Sectorial registrada exitosamente.",
          type: "success",
        });
      }
      closeModal();
      setSelectedAyuda(null);
      fetchAyudas(false, true); // Fuerza refresco inmediato
    } catch (error) {
      console.error("Error al guardar la ayuda sectorial:", error);
      // Revertir el estado optimista
      if (!selectedAyuda && tempId) {
        setAyudas((prev) => prev.filter((a) => a.id !== tempId));
      }
      setAlert({
        show: true,
        message: `Error al guardar la ayuda sectorial: ${
          error.response?.data?.detail || error.message
        }`,
        type: "error",
      });
    }
  };
  
  // ----------------------------------------------------------------------
  // LÓGICA DE CONFIRMACIÓN DE PIN (Se mantiene)
  // ----------------------------------------------------------------------
  const requirePinForAction = (action) => {
    if (!selectedAyuda) return;
    setActionToConfirm(action);
    setIsPinModalOpen(true);
    setPinForAction("");
  };

  const confirmPinAction = () => {
    // PIN de ejemplo, debe ser reemplazado por un endpoint de verificación
    if (pinForAction !== "270725") { 
      setAlert({
        show: true,
        message: "PIN incorrecto. Acción denegada. ⚠️",
        type: "error",
      });
      setIsPinModalOpen(false);
      setPinForAction("");
      setActionToConfirm(null);
      return;
    }

    if (actionToConfirm === "edit") {
      openModal(selectedAyuda);
    } else if (actionToConfirm === "delete") {
      setItemToDelete(selectedAyuda);
      setIsConfirmModalOpen(true);
    } else if (actionToConfirm === "finalize") {
      setIsFinalizeModalOpen(true);
    }

    setIsPinModalOpen(false);
    setPinForAction("");
    setActionToConfirm(null);
  };

  const handleDelete = () => {
    if (selectedAyuda) {
      requirePinForAction("delete");
    }
  };
  
  const handleEdit = () => {
    if (selectedAyuda) {
        requirePinForAction("edit");
    }
  };


  const handleFinalize = () => {
    if (selectedAyuda) {
      requirePinForAction("finalize");
    }
  };

  const confirmFinalize = async () => {
    if (!selectedAyuda) return;

    const updatedData = {
      // Se adapta a los campos del modelo sectorial
      estado: "FINALIZADA",
      observacion: finalizeObservation || selectedAyuda.observacion || "",
      // No incluimos fecha_actualizacion, el backend lo maneja con auto_now
    };

    try {
      await axios.put(
        `${API_BASE_URL}${selectedAyuda.id}/`,
        updatedData
      );
      setAlert({
        show: true,
        message: "Ayuda Sectorial finalizada exitosamente.",
        type: "success",
      });
      setIsFinalizeModalOpen(false);
      setFinalizeObservation("");
      fetchAyudas(false, true); 
    } catch (error) {
      console.error("Error al finalizar la ayuda sectorial:", error);
      setAlert({
        show: true,
        message: `Error al finalizar la ayuda: ${
          error.response?.data?.detail || error.message
        }`,
        type: "error",
      });
    }
  };

  const closeFinalizeModal = () => {
    setIsFinalizeModalOpen(false);
    setFinalizeObservation("");
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await axios.delete(
          `${API_BASE_URL}${itemToDelete.id}/` // Ruta adaptada
        );
        setAlert({
          show: true,
          message: "Ayuda Sectorial eliminada exitosamente. ❌",
          type: "success",
        });
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
        setSelectedAyuda(null);
        fetchAyudas(false, true); 
      } catch (error) {
        console.error("Error al eliminar la ayuda sectorial:", error);
        setAlert({
          show: true,
          message: `Error al eliminar la ayuda: ${
            error.response?.data?.detail || error.message
          }`,
          type: "error",
        });
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  // ----------------------------------------------------------------------
  // LÓGICA DE FILTRADO ADAPTADA
  // ----------------------------------------------------------------------
  const filteredAyudas = ayudas.filter((ayuda) => {
    // Busca en sector, municipio, tipo de solicitud, o responsable
    const matchesPalabra =
      ayuda.sector?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.responsible?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.municipio?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.tipo_solicitud?.toLowerCase().includes(searchPalabra.toLowerCase());

    const matchesCodigo = () => {
      if (!searchCodigo.trim()) return true;

      const userQuery = searchCodigo.trim().toUpperCase();
      const codigo = ayuda.codigo?.toUpperCase();
      if (!codigo) return false;

      // El código sectorial es "SEC-..."
      if (codigo.includes(userQuery)) return true;
      
      const match = codigo.match(/SEC-(\w+)/);
      if (match) {
        return match[1].includes(userQuery);
      }

      return false;
    };

    return matchesCodigo() && matchesPalabra;
  });

  // ----------------------------------------------------------------------
  // LÓGICA DE ORDENAMIENTO (Se mantiene)
  // ----------------------------------------------------------------------
  const sortedAyudas = [...filteredAyudas].sort((a, b) => {
    if (sortConfig.key === "codigo") {
      // Ordenamiento alfanumérico para códigos como SEC-ABC12345
      const aCode = a.codigo || "";
      const bCode = b.codigo || "";
      return sortConfig.direction === "asc" ? aCode.localeCompare(bCode) : bCode.localeCompare(aCode);
    } else if (sortConfig.key) {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      return sortConfig.direction === "asc" ? 
        String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === "asc" ? " ↑" : " ↓";
    }
    return "";
  };

  // ----------------------------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------------------------
  return (
    <div className="flex-1 p-2 font-sans bg-gray-50 rounded-xl">
      <div className="space-y-4">
        {alert.show && (
          <Alert
            message={alert.message}
            type={alert.type}
            setAlert={setAlert}
          />
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col justify-center sm:flex-row items-center sm:items-start gap-4 rounded-xl bg-white p-4 shadow-lg border border-gray-300">
          <img
            src="/LOGO.png"
            alt="Logo de la Aplicación"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/64x64/e2e8f0/000000?text=LOGO";
              e.currentTarget.onerror = null;
            }}
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl text-center font-bold text-gray-800">
              Gestión de Ayudas Sectoriales
            </h2>
            <p className="text-gray-600 mt-1">
              Administre las ayudas sociales sectoriales de la Alcaldía de Maneiro
            </p>
          </div>
        </div>
        
        {/* Controles de búsqueda y acción */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por Código
                </label>
                <input
                  type="text"
                  value={searchCodigo}
                  onChange={(e) => setSearchCodigo(e.target.value)}
                  placeholder="Código (ej: SEC-)"
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por Palabra
                </label>
                <input
                  type="text"
                  value={searchPalabra}
                  onChange={(e) => setSearchPalabra(e.target.value)}
                  placeholder="Sector, Responsable, Municipio..."
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => openModal()}
                className="bg-[#0069B6] text-white px-4 py-2 rounded-xl hover:bg-[#003578] transition-all font-medium flex items-center shadow-lg text-sm transform hover:scale-105"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Nuevo
              </button>
              <button
                onClick={handleEdit} // Ahora requiere PIN
                disabled={!selectedAyuda}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                  selectedAyuda
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
              <button
                onClick={() => selectedAyuda && generatePlanilla(selectedAyuda, setAlert)}
                disabled={!selectedAyuda}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                  selectedAyuda ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                  Planilla
              </button>
              {userRole !== "recepcion" && (
                <button
                  onClick={handleDelete} // Requiere PIN
                  disabled={!selectedAyuda}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                    selectedAyuda
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Eliminar
                </button>
              )}
              <button
                onClick={handleFinalize} // Requiere PIN
                disabled={!selectedAyuda}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                  selectedAyuda
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Finalizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl shadow-lg mt-6 border border-blue-100 bg-white">
          <Table
            sortedAyudas={sortedAyudas}
            selectedAyuda={selectedAyuda}
            handleRowSelect={handleRowSelect}
            requestSort={requestSort}
            renderSortArrow={renderSortArrow}
          />
        </div>

        {/* Contador */}
        <div className="mt-4 text-sm text-gray-600 text-center bg-white p-3 rounded-xl shadow-md border border-blue-100">
          Mostrando {sortedAyudas.length} de {ayudas.length} registros
        </div>
      </div>

      {/* Modal de Formulario */}
      {/* ⚠️ ADVERTENCIA: Debes adaptar el componente 'Modal' para renderizar el formulario sectorial
          en lugar del formulario de ayuda individual que usaba cédula y beneficiario. */}
      <Modal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        formData={formData}
        handleInputChange={handleInputChange}
        // ELIMINADO: handleSearchBeneficiary
        selectedAyuda={selectedAyuda}
        alert={alert}
        setAlert={setAlert}
        modalTitle={modalProps.title}
        modalHeaderColor={modalProps.headerColor}
        // ELIMINADO: pinRequired, pinInput, handlePinInputChange
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.codigo || "este elemento"} // Usar el código o sector para identificar
      />

      {/* Modal de PIN para acciones sensibles */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              🔐 Validación de Seguridad
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Para {actionToConfirm === "edit" ? "editar" : actionToConfirm === "delete" ? "eliminar" : "finalizar"} esta
              ayuda, ingrese el PIN de seguridad.
            </p>
            <input
              type="password"
              value={pinForAction}
              onChange={(e) => setPinForAction(e.target.value)}
              placeholder="Ingrese PIN (6 dígitos)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] text-center text-lg tracking-widest"
              maxLength="6"
              autoFocus
              autoComplete="one-time-code"
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
              <button
                onClick={confirmPinAction}
                className="px-4 py-2 bg-[#0069B6] text-white rounded-xl hover:bg-[#003578]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalización */}
      {isFinalizeModalOpen && selectedAyuda && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              ✅ Finalizar Ayuda Sectorial
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Confirme la finalización de la ayuda **{selectedAyuda.codigo}** ({selectedAyuda.sector}).
              Puede añadir una observación de cierre.
            </p>
            <textarea
              value={finalizeObservation}
              onChange={(e) => setFinalizeObservation(e.target.value)}
              placeholder="Observación de Cierre (Opcional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] text-sm"
              rows={3}
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeFinalizeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinalize}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSectorial;
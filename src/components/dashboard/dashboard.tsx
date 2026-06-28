import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import Table from "./table";
import Modal from "../../layout/Modal";
import Alert from "../Alert";
import ConfirmDeleteModal from "../../layout/ConfirmDeleteModal";
import { generatePlanilla } from "./documento";

interface ValidationInfo {
  show: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  existingAyudas?: any[];
}

const Dashboard = () => {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyuda, setSelectedAyuda] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCodigo, setSearchCodigo] = useState("");
  const [searchPalabra, setSearchPalabra] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "codigo", direction: "desc" });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [modalProps, setModalProps] = useState({
    title: "",
    headerColor: "",
  });

  const [formData, setFormData] = useState({
    cedula: "",
    beneficiario: "",
    nacionalidad: "",
    sexo: "",
    fechaNacimiento: "",
    parroquia: "",
    municipio: "",
    estructura: "",
    telefono: "",
    direccion: "",
    calle: "",
    institucion: "",
    estado: "",
    tipo: "",
    subtipo: "",
    observacion: "",
    responsableInstitucion: "",
  });

  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinForAction, setPinForAction] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalizeObservation, setFinalizeObservation] = useState("");

  const [validationInfo, setValidationInfo] = useState<ValidationInfo>({
    show: false,
    message: '',
    type: 'info',
    existingAyudas: []
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || "basico";
  const userInstitucion = user.institucion ? user.institucion.trim() : "";

  const lastApiData = useRef(null);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const formatToYYYYMMDD = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const parts = dateString.split(/[-/]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const newDate = new Date(year, month, day);
          if (!isNaN(newDate.getTime())) {
            return newDate.toISOString().split("T")[0];
          }
        }
        console.warn(
          "Fecha de nacimiento inválida o formato inesperado (formatToYYYYMMDD):",
          dateString
        );
        return "";
      }
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error(
        "Error formateando fecha en formatToYYYYMMDD:",
        dateString,
        error
      );
      return "";
    }
  };

  const fetchAyudas = useCallback(async (showAlert = true, force = false) => {
    console.log("INTENTANDO: Cargar ayudas...");
    const cacheKey = "ayudas_cache";
    const cacheExpiration = 86400000;
    const cachedData = localStorage.getItem(cacheKey);

    if (!force && cachedData) {
      const { data: cachedAyudas, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheExpiration) {
        console.log("ÉXITO: Cargando desde caché");
        setAyudas(cachedAyudas);
        compareWithApi(cachedAyudas);
        return;
      }
    }

    try {
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/");
      console.log("ÉXITO: Respuesta de la API (datos crudos de Ayudas):", response.data);

      const apiAyudas = response.data.map((ayuda) => {
        let nacionalidad = ayuda.nacionalidad || "";
        if (!nacionalidad && ayuda.cedula && typeof ayuda.cedula === "string" && ayuda.cedula.startsWith("V")) {
          nacionalidad = "V";
        } else if (!nacionalidad) {
          nacionalidad = "E";
        }

        return {
          ...ayuda,
          id: ayuda.id,
          fecha: new Date(ayuda.fecha_registro).toISOString().split("T")[0],
          beneficiario: ayuda.beneficiario || "",
          nacionalidad,
          sexo: ayuda.sexo === "M" ? "Masculino" : "Femenino",
          fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
          responsableInstitucion: ayuda.responsableInstitucion || "",
          tipo: ayuda.tipo || "Desconocido",
        };
      });

      localStorage.setItem(cacheKey, JSON.stringify({ data: apiAyudas, timestamp: Date.now() }));
      setAyudas(apiAyudas);
      lastApiData.current = apiAyudas;

      if (showAlert) {
        setAlert({
          show: true,
          message: "Datos cargados exitosamente desde la API.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("ERROR: Fallo al cargar las ayudas desde la API.", error);
      let errorMessage = "¡Error al conectar con la API! No se pudieron cargar los datos.";

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
  }, []);

  const compareWithApi = async (cachedAyudas) => {
    try {
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/", { timeout: 5000 });
      const apiAyudas = response.data.map((ayuda) => ({
        ...ayuda,
        fecha: new Date(ayuda.fecha_registro).toISOString().split("T")[0],
        beneficiario: ayuda.beneficiario || "",
        nacionalidad: ayuda.nacionalidad || (ayuda.cedula?.startsWith("V") ? "V" : "E"),
        sexo: ayuda.sexo === "M" ? "Masculino" : "Femenino",
        fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
        responsableInstitucion: ayuda.responsableInstitucion || "",
        tipo: ayuda.tipo || "Desconocido",
      }));

      const hasChanges = cachedAyudas.length !== apiAyudas.length ||
        !cachedAyudas.every((cached) => apiAyudas.some((api) => api.id === cached.id && JSON.stringify(api) === JSON.stringify(cached)));

      if (hasChanges) {
        console.log("Detectados cambios en la API, actualizando datos...");
        setAyudas(apiAyudas);
        localStorage.setItem("ayudas_cache", JSON.stringify({ data: apiAyudas, timestamp: Date.now() }));
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
        console.log("App visible, intentando refrescar datos en background...");
        fetchAyudas(false);
      }
    };

    const checkInterval = setInterval(() => {
      const cachedData = localStorage.getItem("ayudas_cache");
      if (cachedData) {
        const { data: cachedAyudas } = JSON.parse(cachedData);
        compareWithApi(cachedAyudas);
      }
    }, 300000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [fetchAyudas]);

  const checkIfPinRequired = (cedula, allAyudas) => {
    if (!cedula) return false;

    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const recentAyudas = allAyudas.filter((ayuda) => {
      const ayudaDate = new Date(ayuda.fecha);
      return ayuda.cedula === cedula && ayudaDate >= threeMonthsAgo && ayudaDate <= today;
    });

    return recentAyudas.length >= 2;
  };

  const checkBeneficiaryHistory = (cedula: string, tipoActual?: string) => {
    const existing = ayudas.filter(a => 
      a.cedula === cedula && 
      (selectedAyuda ? a.id !== selectedAyuda.id : true)
    );

    if (existing.length === 0) {
      setValidationInfo({
        show: false,
        message: '',
        type: 'info',
        existingAyudas: []
      });
      return null;
    }

    const tiposPrevios = [...new Set(existing.map(a => a.tipo))];
    const sameType = tipoActual && tiposPrevios.includes(tipoActual);

    let message = '';
    let type: 'info' | 'warning' | 'error' = 'info';

    if (sameType) {
      message = `⚠️ Esta persona ya ha recibido el tipo de ayuda "${tipoActual}" anteriormente. Tipos previos: ${tiposPrevios.join(', ')}. ¿Desea registrar de todas formas?`;
      type = 'warning';
    } else {
      message = `ℹ️ Esta persona ya ha sido beneficiada anteriormente con: ${tiposPrevios.join(', ')}.${tipoActual ? ` El nuevo registro es de tipo "${tipoActual}".` : ''}`;
      type = 'info';
    }

    setValidationInfo({
      show: true,
      message,
      type,
      existingAyudas: existing
    });

    return existing;
  };

  const handleRowSelect = (ayuda) => {
    setSelectedAyuda(ayuda);
  };

  const handleSearchBeneficiary = async () => {
    const cedula = formData.cedula;
    if (!cedula) {
      setAlert({
        show: true,
        message: "Por favor, ingrese una cédula para buscar.",
        type: "warning",
      });
      return;
    }

    try {
      const response = await axios.get(
        `https://maneiro-api-mem1.onrender.com/registro_electoral/buscar/?cedula=${cedula}`
      );
      const data = response.data;

      setFormData((prev) => ({
        ...prev,
        beneficiario: data.nombre?.trim() || "",
        nacionalidad: data.nacionalidad?.trim() || "",
        sexo: data.sexo === "F" ? "Femenino" : "Masculino",
        fechaNacimiento: formatToYYYYMMDD(data.fecha_nacimiento),
        parroquia: data.parroquia || "",
        municipio: data.municipio || "",
        estructura: data.estructura || "",
      }));

      checkBeneficiaryHistory(cedula);

      const requiresPin = checkIfPinRequired(cedula, ayudas);
      setPinRequired(requiresPin);
      if (!requiresPin) setPinInput("");

      setAlert({
        show: true,
        message: "Beneficiario encontrado y datos rellenados.",
        type: "success",
      });
    } catch (error) {
      console.error("Error al buscar la cédula:", error);
      setAlert({
        show: true,
        message:
          "Error en la conexión con el servidor de registro electoral. Intente de nuevo más tarde o la cédula no fue encontrada.",
        type: "error",
      });

      setFormData((prev) => ({
        ...prev,
        beneficiario: "",
        nacionalidad: "",
        sexo: "",
        fechaNacimiento: "",
        parroquia: "",
        municipio: "",
      }));
      setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
    }
  };

  const openModal = (ayuda = null) => {
    if (ayuda) {
      setSelectedAyuda(ayuda);
      setFormData({
        cedula: ayuda.cedula || "",
        beneficiario: ayuda.beneficiario || "",
        nacionalidad: ayuda.nacionalidad || "",
        sexo: ayuda.sexo || "",
        fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
        parroquia: ayuda.parroquia || "",
        municipio: ayuda.municipio || "",
        estructura: ayuda.estructura || "",
        telefono: ayuda.telefono || "",
        direccion: ayuda.direccion || "",
        calle: ayuda.calle || "",
        institucion: ayuda.institucion || "",
        estado: ayuda.estado || "",
        tipo: ayuda.tipo || "",
        subtipo: ayuda.subtipo || "",
        observacion: ayuda.observacion || "",
        responsableInstitucion: ayuda.responsableInstitucion || "",
      });
      setPinRequired(false);
      setPinInput("");
      setModalProps({
        title: "Editar Ayuda",
        headerColor: "bg-[#FFCB00]",
      });
      setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
    } else {
      setSelectedAyuda(null);
      setFormData({
        cedula: "",
        beneficiario: "",
        nacionalidad: "",
        sexo: "",
        fechaNacimiento: "",
        parroquia: "",
        municipio: "",
        estructura: "",
        telefono: "",
        direccion: "",
        calle: "",
        institucion: "",
        estado: "REGISTRADO / RECIBIDO",
        tipo: "",
        subtipo: "",
        observacion: "",
        responsableInstitucion: "",
      });
      setPinRequired(false);
      setPinInput("");
      setModalProps({
        title: "Nueva Ayuda",
        headerColor: "bg-[#0095D4]",
      });
      setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPinInput("");
    setAlert({ show: false, message: "", type: "" });
    setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "cedula" && !selectedAyuda) {
      const requiresPin = checkIfPinRequired(value, ayudas);
      setPinRequired(requiresPin);
      if (!requiresPin) setPinInput("");
      if (validationInfo.show) {
        setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
      }
    }

    if (name === "tipo" && formData.cedula) {
      const tipo = value;
      checkBeneficiaryHistory(formData.cedula, tipo);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.cedula ||
      !formData.beneficiario ||
      !formData.nacionalidad ||
      !formData.sexo ||
      !formData.municipio ||
      !formData.parroquia
    ) {
      setAlert({
        show: true,
        message: "Por favor, complete todos los campos requeridos (cédula, beneficiario, nacionalidad, sexo, municipio, parroquia).",
        type: "error",
      });
      return;
    }

    if (formData.telefono && !/^\d{10}$/.test(formData.telefono)) {
      setAlert({
        show: true,
        message: "El teléfono debe tener exactamente 10 dígitos numéricos.",
        type: "error",
      });
      return;
    }

    if (pinRequired && (!pinInput || pinInput !== "270725")) {
      setAlert({
        show: true,
        message: "PIN incorrecto. No se puede registrar la ayuda.",
        type: "error",
      });
      return;
    }

    let generatedCodigo = selectedAyuda ? selectedAyuda.codigo : "";
    if (!selectedAyuda) {
      const maxId = ayudas.reduce((max, ayuda) => {
        const num = parseInt(ayuda.codigo?.replace("AYU-", "") || "0", 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      generatedCodigo = `AYU-${String(maxId + 1).padStart(3, "0")}`;
    }

    const currentDate = new Date().toISOString();

    // ✅ Obtener el username del usuario
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username = user.username || null;

    // ✅ Base de datos para crear o editar
    const baseData = {
      codigo: generatedCodigo,
      cedula: formData.cedula,
      beneficiario: formData.beneficiario,
      nacionalidad: formData.nacionalidad === "V" ? "V" : "E",
      sexo: formData.sexo === "Masculino" ? "M" : "F",
      fechaNacimiento: formData.fechaNacimiento,
      parroquia: formData.parroquia,
      municipio: formData.municipio,
      estructura: formData.estructura || "",
      telefono: formData.telefono || "",
      direccion: formData.direccion || "",
      calle: formData.calle || "",
      institucion: formData.institucion || "",
      estado: formData.estado || "REGISTRADO / RECIBIDO",
      tipo: formData.tipo || "",
      observacion: formData.observacion || "",
      responsableInstitucion: formData.responsableInstitucion || "",
      subtipo: formData.subtipo || "",
      fecha_actualizacion: currentDate,
      usuario_actualizacion_username: username,
    };

    let tempId = null;
    if (!selectedAyuda) {
      tempId = Date.now();
      const newAyuda = { ...baseData, fecha_registro: currentDate, usuario_registro_username: username, id: tempId };
      setAyudas((prev) => [newAyuda, ...prev]);
    }

    try {
      let savedAyuda;

      if (selectedAyuda) {
        // ✅ En edición: NO enviar fecha_registro ni usuario_registro
        const updateData = { ...baseData };
        delete updateData.fecha_registro;
        delete updateData.usuario_registro_username;

        await axios.put(
          `https://maneiro-api-mem1.onrender.com/api/${selectedAyuda.id}/`,
          updateData
        );
        savedAyuda = { ...selectedAyuda, ...baseData };
      } else {
        // ✅ En creación: enviar fecha_registro y usuario_registro
        const createData = {
          ...baseData,
          fecha_registro: currentDate,
          usuario_registro_username: username,
        };
        const response = await axios.post("https://maneiro-api-mem1.onrender.com/api/", createData);
        savedAyuda = response.data;
      }

      await axios.post(
        "https://maneiro.app.n8n.cloud/webhook/ayuda-registrada",
        {
          accion: selectedAyuda ? "editada" : "creada",
          ayuda: savedAyuda,
          usuario: username || "desconocido",
        }
      ).catch((err) => {
        console.warn("n8n no respondió (no crítico):", err);
      });

      setAlert({
        show: true,
        message: selectedAyuda
          ? "Ayuda actualizada y enviada a n8n."
          : "Nueva ayuda registrada y enviada a n8n.",
        type: "success",
      });

      closeModal();
      setSelectedAyuda(null);
      fetchAyudas(false, true);

    } catch (error) {
      console.error("Error al guardar la ayuda:", error);
      if (!selectedAyuda && tempId) {
        setAyudas((prev) => prev.filter((a) => a.id !== tempId));
      }
      setAlert({
        show: true,
        message: `Error al guardar la ayuda: ${
          error.response?.data?.detail || error.message
        }`,
        type: "error",
      });
    }
  };

  const requirePinForAction = (action) => {
    if (!selectedAyuda) return;
    setActionToConfirm(action);
    setIsPinModalOpen(true);
    setPinForAction("");
  };

  const confirmPinAction = () => {
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

  const handleFinalize = () => {
    if (selectedAyuda) {
      requirePinForAction("finalize");
    }
  };

  const confirmFinalize = async () => {
    if (!selectedAyuda) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username = user.username || null;
    const currentDate = new Date().toISOString();

    const updatedData = {
      ...selectedAyuda,
      estado: "FINALIZADA",
      observacion: finalizeObservation || selectedAyuda.observacion || "",
      fecha_actualizacion: currentDate, // ✅ Solo actualiza fecha_actualizacion
      usuario_actualizacion_username: username,
    };

    try {
      await axios.put(
        `https://maneiro-api-mem1.onrender.com/api/${selectedAyuda.id}/`,
        updatedData
      );
      setAlert({
        show: true,
        message: "Ayuda finalizada exitosamente.",
        type: "success",
      });
      setIsFinalizeModalOpen(false);
      setFinalizeObservation("");
      fetchAyudas(false, true);
    } catch (error) {
      console.error("Error al finalizar la ayuda:", error);
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
          `https://maneiro-api-mem1.onrender.com/api/${itemToDelete.id}/`
        );
        setAlert({
          show: true,
          message: "Ayuda eliminada exitosamente. ❌",
          type: "success",
        });
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
        setSelectedAyuda(null);
        fetchAyudas(false, true);
      } catch (error) {
        console.error("Error al eliminar la ayuda:", error);
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

  const filteredAyudas = ayudas.filter((ayuda) => {
    if (userInstitucion) {
      const instAyuda = (ayuda.institucion || "").trim();
      if (instAyuda !== userInstitucion) return false;
    }

    const matchesPalabra =
      ayuda.beneficiario?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.cedula?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.estructura?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.institucion?.toLowerCase().includes(searchPalabra.toLowerCase());

    const matchesCodigo = () => {
      if (!searchCodigo.trim()) return true;
      const userQuery = searchCodigo.trim().toUpperCase();
      const codigo = ayuda.codigo?.toUpperCase();
      if (!codigo) return false;
      if (codigo === userQuery) return true;
      const match = codigo.match(/AYU-(\d+)/);
      if (!match) return false;
      const numeroSecuencial = parseInt(match[1], 10);
      const numUsuario = parseInt(userQuery.replace(/^AYU-/, ""), 10);
      if (!isNaN(numUsuario) && !isNaN(numeroSecuencial)) {
        return numeroSecuencial === numUsuario;
      }
      return codigo.includes(userQuery) || match[1].includes(userQuery);
    };

    return matchesCodigo() && matchesPalabra;
  });

  const sortedAyudas = useMemo(() => {
    const sortable = [...filteredAyudas];
    if (sortConfig.key === "codigo") {
      return sortable.sort((a, b) => {
        const aNum = parseInt(a.codigo?.replace("AYU-", "") || "0", 10);
        const bNum = parseInt(b.codigo?.replace("AYU-", "") || "0", 10);
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      });
    } else if (sortConfig.key) {
      return sortable.sort((a, b) => {
        const aVal = (a[sortConfig.key] ?? "").toString().toLowerCase();
        const bVal = (b[sortConfig.key] ?? "").toString().toLowerCase();
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return sortable;
  }, [filteredAyudas, sortConfig]);

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

  const totalAyudas = filteredAyudas.length;
  const totalAyudasAll = ayudas.length;

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
              Gestión de Ayudas
            </h2>
            <p className="text-gray-600 mt-1">
              Administre las ayudas sociales de la Alcaldía de Maneiro
            </p>
            {userInstitucion && (
              <div className="mt-1 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full inline-block">
                🏛️ Institución: {userInstitucion}
              </div>
            )}
          </div>
        </div>

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
                  placeholder="Código..."
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
                  placeholder="Cédula, nombre, estructura..."
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => openModal()}
                className="bg-[#0069B6] text-white px-4 py-2 rounded-xl hover:bg-[#003578] transition-all font-medium flex items-center shadow-lg text-sm transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo
              </button>
              <button
                onClick={() => selectedAyuda && openModal(selectedAyuda)}
                disabled={!selectedAyuda}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                  selectedAyuda
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                  onClick={handleDelete}
                  disabled={!selectedAyuda}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                    selectedAyuda
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              )}
              <button
                onClick={handleFinalize}
                disabled={!selectedAyuda}
                className={`px-4 py-2 rounded-xl font-medium flex items-center shadow-lg text-sm transition-all transform hover:scale-105 ${
                  selectedAyuda
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalizar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-lg mt-6 border border-blue-100 bg-white">
          <Table
            sortedAyudas={sortedAyudas}
            selectedAyuda={selectedAyuda}
            handleRowSelect={handleRowSelect}
            requestSort={requestSort}
            renderSortArrow={renderSortArrow}
          />
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center bg-white p-3 rounded-xl shadow-md border border-blue-100">
          Mostrando {sortedAyudas.length} de {totalAyudas} registros
          {userInstitucion && (
            <span className="ml-2 text-blue-600 font-medium">
              (Filtrado por: {userInstitucion})
            </span>
          )}
          {totalAyudasAll > totalAyudas && (
            <span className="ml-2 text-gray-400">
              (Total general: {totalAyudasAll})
            </span>
          )}
        </div>
      </div>

      <Modal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSearchBeneficiary={handleSearchBeneficiary}
        selectedAyuda={selectedAyuda}
        alert={alert}
        setAlert={setAlert}
        modalTitle={modalProps.title}
        modalHeaderColor={modalProps.headerColor}
        pinRequired={pinRequired}
        pinInput={pinInput}
        handlePinInputChange={(e) => setPinInput(e.target.value)}
        validationInfo={validationInfo}
        setValidationInfo={setValidationInfo}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.beneficiario || "este elemento"}
      />

      {isPinModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔐 Validación de Seguridad</h3>
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

      {isFinalizeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📌 Finalizar Ayuda</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Está seguro de que desea finalizar esta ayuda? El estado cambiará a "FINALIZADA".
            </p>
            <textarea
              value={finalizeObservation}
              onChange={(e) => setFinalizeObservation(e.target.value)}
              placeholder="Observación (opcional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] mb-4"
              rows="3"
            />
            <div className="flex justify-end space-x-4">
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

export default Dashboard;
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import Alert from "../Alert";
import api from "../../lib/axio"; // Para sectores

const Modal = ({
  isModalOpen,
  closeModal,
  handleSubmit,
  formData,
  setFormData,
  selectedRegistro,
  alert,
  setAlert,
  modalTitle,
  modalHeaderColor,
  pinRequired,
  pinInput,
  handlePinInputChange,
  setPinRequired,
}) => {
  // Estados internos
  const [tripulantes, setTripulantes] = useState([]);
  const [motores, setMotores] = useState([]);
  const [searching, setSearching] = useState({});
  const fileInputRefs = useRef({});

  // Estados para el select de Sector
  const [estructuras, setEstructuras] = useState([]);
  const [loadingEstructuras, setLoadingEstructuras] = useState(false);
  const [errorEstructuras, setErrorEstructuras] = useState(null);
  const [sectorFallback, setSectorFallback] = useState(false);

  // ✅ NUEVOS estados para integración con Zafras
  const [zafras, setZafras] = useState([]);
  const [loadingZafras, setLoadingZafras] = useState(false);
  const [registroRapido, setRegistroRapido] = useState(false);
  const [zafraSeleccionada, setZafraSeleccionada] = useState(null);
  const [fechaJornada, setFechaJornada] = useState("");
  const [horaJornada, setHoraJornada] = useState("06:00");
  const [errorZafra, setErrorZafra] = useState("");

  // ✅ Estado para validaciones en vivo (sticky)
  const [validationInfo, setValidationInfo] = useState({
    show: false,
    message: "",
    type: "info",
    existingData: [],
  });

  // ✅ Opciones para Arte de Pesca Autorizado
  const artePescaOptions = [
    { value: "", label: "Seleccione un arte de pesca" },
    { value: "RED DE ARRASTRE", label: "Red de arrastre" },
    { value: "PALANGRE", label: "Palangre" },
    { value: "LÍNEA DE MANO", label: "Línea de mano" },
    { value: "TRAMPA", label: "Trampa" },
    { value: "CERCO", label: "Cerco" },
    { value: "RED DE ENMALLE", label: "Red de enmalle" },
    { value: "CURRIÑO", label: "Curriño" },
    { value: "OTRO", label: "Otro" },
  ];

  // ---- Funciones auxiliares ----
  const getCargoLabel = (cargo) => {
    const map = {
      PATRON: "Patrón",
      MARINERO_1: "Marinero 1",
      MARINERO_2: "Marinero 2",
      MARINERO_3: "Marinero 3",
    };
    return map[cargo] || cargo;
  };

  const getNextMarineroNumber = (tripList) => {
    const existingNumbers = tripList
      .filter((t) => t.cargo && t.cargo.startsWith("MARINERO_"))
      .map((t) => parseInt(t.cargo.split("_")[1], 10))
      .filter((n) => !isNaN(n));
    for (let i = 1; i <= 3; i++) {
      if (!existingNumbers.includes(i)) return i;
    }
    return null;
  };

  const normalizeCargos = (tripList) => {
    if (!tripList.length) return [];
    const hasPatron = tripList.some((t) => t.cargo === "PATRON");
    let normalized = [...tripList];
    if (!hasPatron) {
      normalized[0] = { ...normalized[0], cargo: "PATRON" };
    } else {
      const patronIndex = normalized.findIndex((t) => t.cargo === "PATRON");
      if (patronIndex > 0) {
        const [patron] = normalized.splice(patronIndex, 1);
        normalized.unshift(patron);
      }
    }
    let marineroCount = 0;
    return normalized.map((t, idx) => {
      if (idx === 0) return { ...t, cargo: "PATRON" };
      marineroCount++;
      return { ...t, cargo: `MARINERO_${marineroCount}` };
    });
  };

  // ---- Cargar sectores ----
  const fetchDireccionData = async () => {
    setLoadingEstructuras(true);
    setErrorEstructuras(null);
    try {
      const response = await api.get("/selectores/direccion-completa/");
      const data = response.data;
      if (!data || !Array.isArray(data)) {
        throw new Error("La respuesta no es un array válido");
      }
      const estructurasUnicas = [
        ...new Set(
          data.flatMap((m) =>
            m.parroquias.flatMap((p) =>
              p.bloques.flatMap((b) =>
                b.sectores.flatMap((s) => s.estructuras.map((e) => e.estructura))
              )
            )
          )
        ),
      ].sort();
      setEstructuras([
        { value: "", label: "Seleccione un sector" },
        ...estructurasUnicas.map((e) => ({ value: e, label: e })),
      ]);
      setSectorFallback(false);
    } catch (error) {
      console.error("❌ Error al cargar sectores:", error);
      setErrorEstructuras("Error al cargar sectores");
      setSectorFallback(true);
      setEstructuras([{ value: "", label: "Sector (ingresar manualmente)" }]);
    } finally {
      setLoadingEstructuras(false);
    }
  };

  // ---- Cargar zafras activas (CORREGIDO) ----
  const fetchZafrasActivas = async () => {
  setLoadingZafras(true);
  try {
    const response = await api.get("/zafras/zafras/"); // Ruta correcta si api.baseURL = /api/
    console.log("📦 Zafras recibidas:", response.data);
    const hoy = new Date().toISOString().split('T')[0];
    // Filtra las activas (puedes comentar el filtro para ver todas)
    const activas = response.data.filter((z) => z.fecha_inicio <= hoy && z.fecha_fin >= hoy);
    // Si no hay activas, usa todas para probar
    const opciones = activas.length > 0 ? activas : response.data;
    setZafras(opciones.map((z) => ({ value: z.id, label: `${z.nombre} (${z.especie})` })));
    if (opciones.length === 0) {
      setErrorZafra("No hay zafras activas. Cree una zafra primero.");
    } else {
      setErrorZafra("");
    }
  } catch (error) {
    console.error("❌ Error cargando zafras:", error);
    setErrorZafra("Error al cargar zafras. Verifique la conexión.");
    setZafras([]);
  } finally {
    setLoadingZafras(false);
  }
};

  // ---- Cargar datos al abrir modal ----
  useEffect(() => {
    if (isModalOpen) {
      fetchDireccionData();
      fetchZafrasActivas(); // ✅ Cargar zafras cada vez que se abre el modal

      if (selectedRegistro) {
        const tripList = selectedRegistro.tripulantes ? [...selectedRegistro.tripulantes] : [];
        setTripulantes(normalizeCargos(tripList));
        setMotores(selectedRegistro.motores || []);
        setRegistroRapido(false); // Si es edición, no se puede registrar rápido
      } else {
        setTripulantes([
          {
            cargo: "PATRON",
            nombre_apellido: "",
            cedula_identidad: "",
            fecha_nacimiento: "",
            telefono: "",
            sector: "",
            direccion: "",
            foto: null,
          },
        ]);
        setMotores([{ numero_motor: 1, marca: "", modelo: "", serial_numero: "" }]);
        setRegistroRapido(false);
        setZafraSeleccionada(null);
        setFechaJornada("");
        setHoraJornada("06:00");
      }
      setValidationInfo({ show: false, message: "", type: "info", existingData: [] });
    }
  }, [isModalOpen, selectedRegistro]);

  // ---- Sincronizar con formData ----
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tripulantes: tripulantes,
      motores: motores,
    }));
  }, [tripulantes, motores, setFormData]);

  // ---- Handlers para tripulantes ----
  const handleTripulanteChange = (index, field, value) => {
    const updated = [...tripulantes];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "cedula_identidad" && value) {
      const cleanValue = value.trim().replace(/[-\s]/g, "").toUpperCase();
      const duplicate = updated.some(
        (t, i) => i !== index && t.cedula_identidad && t.cedula_identidad.trim().replace(/[-\s]/g, "").toUpperCase() === cleanValue
      );
      if (duplicate) {
        setValidationInfo({
          show: true,
          message: `⚠️ La cédula "${value}" ya está registrada para otro tripulante en esta embarcación.`,
          type: "error",
          existingData: [],
        });
      } else {
        setValidationInfo((prev) => ({ ...prev, show: false }));
      }
    }
    setTripulantes(normalizeCargos(updated));
  };

  const addTripulante = () => {
    if (tripulantes.length >= 4) {
      setAlert({ show: true, message: "Máximo 4 tripulantes permitidos.", type: "warning" });
      return;
    }
    const nextNum = getNextMarineroNumber(tripulantes);
    if (nextNum === null) {
      setAlert({ show: true, message: "Ya hay 3 marineros. No se puede agregar más.", type: "warning" });
      return;
    }
    const newTrip = {
      cargo: `MARINERO_${nextNum}`,
      nombre_apellido: "",
      cedula_identidad: "",
      fecha_nacimiento: "",
      telefono: "",
      sector: "",
      direccion: "",
      foto: null,
    };
    setTripulantes([...tripulantes, newTrip]);
  };

  const removeTripulante = (index) => {
    if (tripulantes.length <= 1) {
      setAlert({ show: true, message: "Debe haber al menos un tripulante (Patrón).", type: "warning" });
      return;
    }
    const updated = tripulantes.filter((_, i) => i !== index);
    setTripulantes(normalizeCargos(updated));
  };

  // ---- Búsqueda de cédula ----
  const handleSearchTripulante = async (index) => {
    const trip = tripulantes[index];
    let cedula = trip.cedula_identidad?.trim().replace(/[-\s]/g, "").toUpperCase();
    if (!cedula) {
      setAlert({ show: true, message: "Ingrese una cédula para buscar.", type: "warning" });
      return;
    }
    if (searching[index]) return;
    setSearching((prev) => ({ ...prev, [index]: true }));

    try {
      const response = await axios.get(
        `https://maneiro-api-mem1.onrender.com/registro_electoral/buscar/?cedula=${cedula}`
      );
      const data = response.data;
      const updated = [...tripulantes];
      updated[index] = {
        ...updated[index],
        nombre_apellido: data.nombre?.trim() || "",
        fecha_nacimiento: formatToYYYYMMDD(data.fecha_nacimiento),
        sector: data.estructura || "",
        direccion: data.direccion || "",
        telefono: data.telefono || updated[index].telefono || "",
      };
      setTripulantes(updated);
      setAlert({ show: true, message: "Datos del tripulante encontrados.", type: "success" });
    } catch (error) {
      console.error("Error al buscar la cédula:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Cédula no encontrada.";
      setAlert({ show: true, message: errorMsg, type: "error" });
      const updated = [...tripulantes];
      updated[index] = {
        ...updated[index],
        nombre_apellido: "",
        fecha_nacimiento: "",
        sector: "",
        direccion: "",
      };
      setTripulantes(updated);
    } finally {
      setSearching((prev) => ({ ...prev, [index]: false }));
    }
  };

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
          if (!isNaN(newDate.getTime())) return newDate.toISOString().split("T")[0];
        }
        return "";
      }
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // ---- Manejo de foto ----
  const handleFileUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const updated = [...tripulantes];
      updated[index] = { ...updated[index], foto: base64String };
      setTripulantes(updated);
      setAlert({ show: true, message: "Imagen cargada.", type: "success" });
    };
    reader.onerror = () => {
      setAlert({ show: true, message: "Error al leer la imagen.", type: "error" });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (index) => {
    if (fileInputRefs.current[index]) fileInputRefs.current[index].click();
  };

  // ---- Handlers para motores ----
  const handleMotorChange = (index, field, value) => {
    const updated = [...motores];
    updated[index] = { ...updated[index], [field]: value };
    setMotores(updated);

    if (field === "serial_numero" && value) {
      const cleanValue = value.trim().toUpperCase();
      const duplicate = updated.some(
        (m, i) => i !== index && m.serial_numero && m.serial_numero.trim().toUpperCase() === cleanValue
      );
      if (duplicate) {
        setValidationInfo({
          show: true,
          message: `⚠️ El número de serial "${value}" ya está registrado para otro motor en esta embarcación.`,
          type: "error",
          existingData: [],
        });
      } else {
        setValidationInfo((prev) => ({ ...prev, show: false }));
      }
    }
  };

  const addMotor = () => {
    if (motores.length >= 3) {
      setAlert({ show: true, message: "Máximo 3 motores permitidos.", type: "warning" });
      return;
    }
    const nextNumber = motores.length + 1;
    setMotores([
      ...motores,
      { numero_motor: nextNumber, marca: "", modelo: "", serial_numero: "" },
    ]);
  };

  const removeMotor = (index) => {
    if (motores.length <= 0) return;
    const updated = motores.filter((_, i) => i !== index);
    const renumbered = updated.map((m, i) => ({ ...m, numero_motor: i + 1 }));
    setMotores(renumbered);
  };

  // ---- Handlers para campos del registro ----
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name !== "numero_control" && name !== "matricula" && name !== "registro_insopesca" && name !== "autorizacion_commpa") {
      setValidationInfo((prev) => ({ ...prev, show: false }));
    }
  };

  // ---- Validaciones de unicidad (con debounce y exclude_id) ----
  const debounceRef = useRef(null);

  const checkUniqueness = useCallback(
    (field, value) => {
      if (!value || value.trim() === "") return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const params = {
            campo: field,
            valor: encodeURIComponent(value.trim()),
          };
          if (selectedRegistro?.id) {
            params.exclude_id = selectedRegistro.id;
          }

          const response = await api.get(`/registros_puerto/verificar/`, { params });
          const { exists, existing_id } = response.data;

          if (exists) {
            setValidationInfo({
              show: true,
              message: `❌ El campo "${field.replace(/_/g, " ").toUpperCase()}" ya está registrado (ID: ${existing_id}). Por favor, verifique.`,
              type: "error",
              existingData: [{ id: existing_id, valor: value }],
            });
          } else {
            setValidationInfo((prev) => ({
              ...prev,
              show: false,
            }));
          }
        } catch (error) {
          console.error(`Error verificando ${field}:`, error);
        }
      }, 500);
    },
    [selectedRegistro]
  );

  const handleBlurUniqueness = (e) => {
    const { name, value } = e.target;
    const uniqueFields = ["numero_control", "matricula", "registro_insopesca", "autorizacion_commpa"];
    if (uniqueFields.includes(name)) {
      checkUniqueness(name, value);
    }
  };

  // ---- Validación de teléfono ----
  const validatePhone = (value) => {
    if (value && (!/^\d{10}$/.test(value) || value.length !== 10)) {
      setAlert({ show: true, message: "El teléfono debe tener exactamente 10 dígitos numéricos.", type: "error" });
      return false;
    }
    setAlert({ show: false, message: "", type: "" });
    return true;
  };

  const handlePhoneBlur = (e) => {
    const { value } = e.target;
    validatePhone(value);
  };

  // ---- Estilos para react-select ----
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#0069B6" : "#D1D5DB",
      "&:hover": { borderColor: "#0069B6" },
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? "0 0 0 1px #0069B6" : "none",
      padding: "0.25rem 0",
      minHeight: "36px",
    }),
    singleValue: (provided) => ({ ...provided, color: "#1F2937" }),
    placeholder: (provided) => ({ ...provided, color: "#9CA3AF" }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#E5F0F8" : provided.backgroundColor,
      color: "#1F2937",
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
  };

  const getSelectedOption = (options, value) => {
    if (!value) return null;
    return options.find((opt) => opt.value === value) || null;
  };

  // ---- HANDLER PRINCIPAL ----
  const handleSubmitWrapper = async (e) => {
    e.preventDefault();

    // Validar campos básicos
    if (!formData.fecha_ingreso || !formData.hora_ingreso || !formData.nombre_embarcacion) {
      setAlert({ show: true, message: "Fecha, hora y nombre de embarcación son obligatorios.", type: "error" });
      return;
    }

    const patron = tripulantes?.find((t) => t.cargo === "PATRON");
    if (!patron) {
      setAlert({ show: true, message: "Debe incluir al menos un Patrón en la tripulación.", type: "error" });
      return;
    }

    // Si está activado el registro rápido, validar datos de zafra
    if (registroRapido) {
      if (!zafraSeleccionada) {
        setAlert({ show: true, message: "Seleccione una zafra para el registro rápido.", type: "error" });
        return;
      }
      if (!fechaJornada) {
        setAlert({ show: true, message: "Seleccione la fecha de la primera jornada.", type: "error" });
        return;
      }
    }

    // Construir payload
    const payload = { ...formData };
    if (!payload.numero_control || payload.numero_control.trim() === "") {
      delete payload.numero_control;
    }

    // Procesar tripulantes
    const normalizedTripulantes = normalizeCargos(tripulantes);
    payload.tripulantes = normalizedTripulantes
      .map((t) => {
        const clean = { ...t };
        if (selectedRegistro) {
          delete clean.registro;
          if (clean.foto && typeof clean.foto === "string" && (clean.foto.startsWith("http") || clean.foto.startsWith("/media"))) {
            delete clean.foto;
          }
          if (!clean.foto) delete clean.foto;
        } else {
          delete clean.id;
          delete clean.registro;
          if (!clean.foto || (typeof clean.foto === "string" && clean.foto === "")) delete clean.foto;
        }
        return {
          ...clean,
          telefono: clean.telefono || null,
          sector: clean.sector || null,
          direccion: clean.direccion || null,
          fecha_nacimiento: clean.fecha_nacimiento || null,
        };
      })
      .filter((t) => t.nombre_apellido && t.nombre_apellido.trim() !== "");

    // Procesar motores
    payload.motores = motores
      .map((m) => {
        const clean = { ...m };
        if (selectedRegistro) delete clean.registro;
        else {
          delete clean.id;
          delete clean.registro;
        }
        return {
          ...clean,
          modelo: clean.modelo || null,
          serial_numero: clean.serial_numero || null,
        };
      })
      .filter((m) => m.marca && m.marca.trim() !== "");

    try {
      let response;
      if (selectedRegistro) {
        response = await api.put(`/registros_puerto/${selectedRegistro.id}/`, payload);
      } else {
        response = await api.post("/registros_puerto/", payload);
      }

      const registroCreado = response.data;

      // ✅ Si es nuevo y está activado el registro rápido, crear inscripción y jornada
      if (!selectedRegistro && registroRapido && registroCreado.id) {
        try {
          // 1. Inscribir embarcación en zafra
          const inscripcionPayload = {
            zafra: zafraSeleccionada.value,
            embarcacion: registroCreado.id,
            estado: "ACTIVO",
            observaciones: "Registro rápido desde creación de embarcación",
          };
          await api.post("/zafras/registros-zafra/", inscripcionPayload);

          // 2. Crear jornada inicial
          const patronData = normalizedTripulantes.find((t) => t.cargo === "PATRON") || { nombre_apellido: "", cedula_identidad: "" };
          const jornadaPayload = {
            zafra: zafraSeleccionada.value,
            embarcacion: registroCreado.id,
            fecha: fechaJornada,
            hora_salida: horaJornada,
            hora_llegada: null,
            tripulantes: normalizedTripulantes.map((t) => ({
              nombre: t.nombre_apellido || "",
              cedula: t.cedula_identidad || "",
              cargo: t.cargo || "",
            })),
            observaciones: "Jornada inicial creada automáticamente",
            capturas: [],
          };
          await api.post("/zafras/jornadas/", jornadaPayload);

          setAlert({
            show: true,
            message: "✅ Embarcación registrada, inscrita en zafra y jornada inicial creada.",
            type: "success",
          });
        } catch (zafraError) {
          console.error("Error en registro rápido:", zafraError);
          setAlert({
            show: true,
            message: `⚠️ Embarcación registrada, pero error en zafra/jornada: ${zafraError.response?.data?.detail || zafraError.message}`,
            type: "warning",
          });
        }
      } else {
        setAlert({
          show: true,
          message: selectedRegistro ? "Registro actualizado correctamente." : "Registro creado correctamente.",
          type: "success",
        });
      }

      closeModal();
      // Recargar datos (el padre se encarga)
      if (handleSubmit) handleSubmit(e);
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      let errorMessage = "Error al guardar el registro.";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          const messages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("\n");
          errorMessage = `Error ${error.response.status}:\n${messages}`;
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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 font-sans">
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto transform transition-all w-full">
        <div className={`p-4 rounded-t-2xl text-white flex justify-between items-center ${modalHeaderColor}`}>
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button onClick={closeModal} className="text-white hover:text-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {alert.show && <Alert message={alert.message} type={alert.type} setAlert={setAlert} />}

          {/* ✅ ALERTA DE VALIDACIÓN EN VIVO (sticky) */}
          {validationInfo.show && (
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 pb-3 rounded-xl">
              <div
                className={`p-4 rounded-xl border ${
                  validationInfo.type === "warning"
                    ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                    : validationInfo.type === "info"
                    ? "bg-blue-50 border-blue-400 text-blue-800"
                    : validationInfo.type === "error"
                    ? "bg-red-50 border-red-400 text-red-800"
                    : "bg-green-50 border-green-400 text-green-800"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {validationInfo.type === "warning" && (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {validationInfo.type === "info" && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {validationInfo.type === "error" && (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium whitespace-pre-line">{validationInfo.message}</p>
                    {validationInfo.existingData && validationInfo.existingData.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer hover:underline text-gray-600">📋 Ver detalles</summary>
                        <ul className="mt-1 text-xs space-y-1 max-h-32 overflow-y-auto">
                          {validationInfo.existingData.map((item, idx) => (
                            <li key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                              <span className="font-semibold">ID: {item.id}</span> - {item.valor}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitWrapper} className="space-y-6">
            {/* --- Datos del registro --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
                <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleInputChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Ingreso *</label>
                <input type="time" name="hora_ingreso" value={formData.hora_ingreso} onChange={handleInputChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° de Control *</label>
                <input type="text" name="numero_control" value={formData.numero_control} onChange={handleInputChange} onBlur={handleBlurUniqueness} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" placeholder="Ej: CTRL-001" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Embarcación *</label>
                <input type="text" name="nombre_embarcacion" value={formData.nombre_embarcacion} onChange={handleInputChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                <input type="text" name="matricula" value={formData.matricula} onChange={handleInputChange} onBlur={handleBlurUniqueness} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" placeholder="Ej: AB-123" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Base / Origen</label>
                <input type="text" name="puerto_base_origen" value={formData.puerto_base_origen} onChange={handleInputChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" />
              </div>
            </div>

            {/* --- Permisología --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Registro INSOPESCA *</label>
                <input type="text" name="registro_insopesca" value={formData.registro_insopesca} onChange={handleInputChange} onBlur={handleBlurUniqueness} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" placeholder="Ej: INS-12345" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arte de Pesca Autorizado *</label>
                <Select
                  name="arte_pesca_autorizado"
                  options={artePescaOptions}
                  value={getSelectedOption(artePescaOptions, formData.arte_pesca_autorizado)}
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : "";
                    setFormData((prev) => ({ ...prev, arte_pesca_autorizado: value }));
                  }}
                  styles={customStyles}
                  placeholder="Seleccione un arte de pesca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Autorización COMMPA *</label>
                <input type="text" name="autorizacion_commpa" value={formData.autorizacion_commpa} onChange={handleInputChange} onBlur={handleBlurUniqueness} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" placeholder="Ej: COMMPA-001" required />
              </div>
            </div>

            {/* --- Observaciones --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none" />
            </div>

            {/* ============================================================ */}
            {/* SECCIÓN TRIPULACIÓN */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Tripulación</h3>
                <button type="button" onClick={addTripulante} className="px-3 py-1 bg-[#0095D4] text-white rounded-lg hover:bg-[#0069B6] text-sm transition">
                  + Agregar Tripulante
                </button>
              </div>
              {tripulantes.map((trip, idx) => (
                <div key={idx} className="border-2 border-gray-200 p-4 rounded-xl bg-white shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{getCargoLabel(trip.cargo)}</span>
                    <button type="button" onClick={() => removeTripulante(idx)} className="text-red-500 hover:text-red-700 text-sm">
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Línea 1: Cargo, Cédula, Nombre */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Cargo</label>
                        <div className="px-3 py-1 bg-gray-100 border-2 border-gray-200 rounded-lg text-sm h-10 flex items-center">
                          {getCargoLabel(trip.cargo)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Cédula *</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={trip.cedula_identidad || ""}
                            onChange={(e) => handleTripulanteChange(idx, "cedula_identidad", e.target.value)}
                            className="flex-1 px-3 py-1 border-2 border-gray-200 rounded-l-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                            placeholder="V-12345678"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleSearchTripulante(idx)}
                            disabled={searching[idx]}
                            className="bg-[#0095D4] text-white px-3 py-1 rounded-r-lg hover:bg-[#0069B6] transition-colors flex items-center justify-center h-10 w-10"
                            title="Buscar en registro electoral"
                          >
                            {searching[idx] ? (
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Nombre y Apellido</label>
                        <input
                          type="text"
                          value={trip.nombre_apellido || ""}
                          onChange={(e) => handleTripulanteChange(idx, "nombre_apellido", e.target.value)}
                          className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                        />
                      </div>
                    </div>

                    {/* Línea 2: Fecha Nacimiento, Teléfono, Sector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Fecha Nacimiento</label>
                        <input
                          type="date"
                          value={trip.fecha_nacimiento || ""}
                          onChange={(e) => handleTripulanteChange(idx, "fecha_nacimiento", e.target.value)}
                          className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Teléfono</label>
                        <input
                          type="text"
                          value={trip.telefono || ""}
                          onChange={(e) => handleTripulanteChange(idx, "telefono", e.target.value)}
                          onBlur={handlePhoneBlur}
                          className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                          placeholder="04141234567"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Sector</label>
                        {sectorFallback ? (
                          <input
                            type="text"
                            value={trip.sector || ""}
                            onChange={(e) => handleTripulanteChange(idx, "sector", e.target.value)}
                            className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                            placeholder="Escriba el sector"
                          />
                        ) : loadingEstructuras ? (
                          <div className="px-3 py-1 border-2 border-gray-200 rounded-lg text-center text-sm text-gray-500 h-10 flex items-center justify-center">
                            Cargando...
                          </div>
                        ) : errorEstructuras ? (
                          <div className="px-3 py-1 border-2 border-red-300 rounded-lg bg-red-50 text-red-700 text-xs h-10 flex items-center justify-center">
                            {errorEstructuras}
                          </div>
                        ) : (
                          <Select
                            options={estructuras}
                            value={getSelectedOption(estructuras, trip.sector)}
                            onChange={(selectedOption) =>
                              handleTripulanteChange(idx, "sector", selectedOption ? selectedOption.value : "")
                            }
                            styles={customStyles}
                            placeholder="Seleccione un sector"
                            isClearable
                          />
                        )}
                      </div>
                    </div>

                    {/* Línea 3: Dirección */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Dirección</label>
                      <input
                        type="text"
                        value={trip.direccion || ""}
                        onChange={(e) => handleTripulanteChange(idx, "direccion", e.target.value)}
                        className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                      />
                    </div>

                    {/* Línea 4: Foto */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Foto</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={trip.foto || ""}
                            onChange={(e) => handleTripulanteChange(idx, "foto", e.target.value)}
                            className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10 pr-10"
                            placeholder="URL o Base64"
                          />
                          <button
                            type="button"
                            onClick={() => triggerFileInput(idx)}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Subir foto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => (fileInputRefs.current[idx] = el)}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(idx, e.target.files[0]);
                            }
                            e.target.value = null;
                          }}
                          className="hidden"
                        />
                        {trip.foto && (
                          <button
                            type="button"
                            onClick={() => handleTripulanteChange(idx, "foto", null)}
                            className="p-1 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                            title="Eliminar foto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {trip.foto && (
                        <div className="mt-2">
                          <img
                            src={trip.foto}
                            alt="Previsualización"
                            className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================================ */}
            {/* SECCIÓN MOTORES */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Sistema de Propulsión</h3>
                <button type="button" onClick={addMotor} className="px-3 py-1 bg-[#0095D4] text-white rounded-lg hover:bg-[#0069B6] text-sm transition">
                  + Agregar Motor
                </button>
              </div>
              {motores.map((motor, idx) => (
                <div key={idx} className="border-2 border-gray-200 p-4 rounded-xl bg-white shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Motor #{motor.numero_motor || idx + 1}</span>
                    <button type="button" onClick={() => removeMotor(idx)} className="text-red-500 hover:text-red-700 text-sm">
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Marca</label>
                      <input
                        type="text"
                        value={motor.marca || ""}
                        onChange={(e) => handleMotorChange(idx, "marca", e.target.value)}
                        className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Modelo</label>
                      <input
                        type="text"
                        value={motor.modelo || ""}
                        onChange={(e) => handleMotorChange(idx, "modelo", e.target.value)}
                        className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Número de Serial *</label>
                      <input
                        type="text"
                        value={motor.serial_numero || ""}
                        onChange={(e) => handleMotorChange(idx, "serial_numero", e.target.value)}
                        onBlur={(e) => checkUniqueness("serial_numero", e.target.value)}
                        className="w-full px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] focus:ring-2 focus:ring-[#0095D4]/20 transition outline-none h-10"
                        placeholder="Ej: SN-12345"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================================ */}
            {/* ✅ SECCIÓN NUEVA: REGISTRO RÁPIDO EN ZAFRA Y JORNADA INICIAL */}
            {!selectedRegistro && (
              <div className="border-t-2 border-blue-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="registroRapido"
                    checked={registroRapido}
                    onChange={(e) => setRegistroRapido(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="registroRapido" className="text-sm font-semibold text-blue-700 cursor-pointer">
                    🚀 Registrar en zafra actual y crear jornada inicial
                  </label>
                </div>

                {registroRapido && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-blue-700 mb-2">
                      Al marcar esta opción, la embarcación se inscribirá automáticamente en la zafra seleccionada
                      y se creará una jornada inicial con la fecha y hora indicadas.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Zafra *</label>
                        {loadingZafras ? (
                          <div className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-500">Cargando zafras...</div>
                        ) : (
                          <Select
                            options={zafras}
                            value={zafraSeleccionada}
                            onChange={(selected) => setZafraSeleccionada(selected)}
                            styles={customStyles}
                            placeholder="Seleccione una zafra activa"
                            isClearable
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Jornada *</label>
                        <input
                          type="date"
                          value={fechaJornada}
                          onChange={(e) => setFechaJornada(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] outline-none text-sm"
                          required={registroRapido}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hora Salida *</label>
                        <input
                          type="time"
                          value={horaJornada}
                          onChange={(e) => setHoraJornada(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] outline-none text-sm"
                          required={registroRapido}
                        />
                      </div>
                    </div>
                    {errorZafra && (
                      <p className="text-xs text-red-600 mt-1">{errorZafra}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- PIN --- */}
            {pinRequired && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <label className="block text-sm font-bold text-yellow-800 mb-1">PIN de Seguridad</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={handlePinInputChange}
                  className="w-full px-4 py-2 border-2 border-yellow-400 rounded-xl focus:border-yellow-600 focus:ring-2 focus:ring-yellow-400/20 outline-none"
                  maxLength="6"
                  placeholder="Ingrese PIN (270725)"
                />
                <p className="text-xs text-yellow-700 mt-1">Acción requiere autorización especial.</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0069B6] text-white rounded-xl hover:bg-[#003578] transition"
              >
                {selectedRegistro ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Modal;
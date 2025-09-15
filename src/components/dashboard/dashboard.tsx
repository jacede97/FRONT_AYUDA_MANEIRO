import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Table from "./table";
import Modal from "../../layout/Modal";
import Alert from "../Alert";
import ConfirmDeleteModal from "../../layout/ConfirmDeleteModal";

const Dashboard = () => {
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyuda, setSelectedAyuda] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCodigo, setSearchCodigo] = useState("");
  const [searchPalabra, setSearchPalabra] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
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

  const fetchAyudas = useCallback(async (showAlert = true) => {
    console.log("INTENTANDO: Cargar ayudas desde la API...");
    try {
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/");
      console.log("ÉXITO: Respuesta de la API (datos crudos de Ayudas):", response.data);

      const apiAyudas = response.data.map((ayuda) => {
        let nacionalidad = ayuda.nacionalidad;
        if (!nacionalidad || nacionalidad === "") {
          nacionalidad =
            ayuda.cedula && typeof ayuda.cedula === "string" && ayuda.cedula.startsWith("V")
              ? "V"
              : "E";
        }

        const tipoMap = {
          1: "Asistencias Médicas",
          2: "Enseres",
          3: "Tanque",
          4: "Tanques de Agua",
        };
        const tipoTexto = tipoMap[ayuda.tipo] || "Desconocido";

        return {
          ...ayuda,
          id: ayuda.id,
          fecha: new Date(ayuda.fecha_registro).toISOString().split("T")[0],
          beneficiario: ayuda.beneficiario || "",
          nacionalidad: nacionalidad,
          sexo: ayuda.sexo === "M" ? "Masculino" : "Femenino",
          fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
          responsableInstitucion: ayuda.responsableInstitucion || "",
          tipo: tipoTexto,
        };
      });
      setAyudas(apiAyudas);

      if (showAlert) {
        setAlert({
          show: true,
          message: "Datos cargados exitosamente.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("ERROR: Fallo al cargar las ayudas desde la API.");
      console.error("Detalles del error:", error);

      let errorMessage = "¡Error al conectar con la API! No se pudieron cargar los datos.";

      if (error.response) {
        console.error("Respuesta de la API con error:", error.response.status, error.response.data);
        errorMessage = `Error de la API: ${error.response.status}. Mensaje: ${error.response.data.detail || error.response.data.message || 'Error desconocido'}`;
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor.");
        errorMessage = "No se pudo conectar al servidor de la API. Por favor, intente de nuevo más tarde.";
      } else {
        console.error("Error al configurar la solicitud:", error.message);
        errorMessage = `Error al procesar la solicitud: ${error.message}`;
      }

      setAlert({
        show: true,
        message: errorMessage,
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    fetchAyudas();
  }, [fetchAyudas]);

  const checkIfPinRequired = (cedula, allAyudas) => {
    if (!cedula) return false;

    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const recentAyudas = allAyudas.filter((ayuda) => {
      const ayudaDate = new Date(ayuda.fecha);
      return (
        ayuda.cedula === cedula &&
        ayudaDate >= threeMonthsAgo &&
        ayudaDate <= today
      );
    });

    return recentAyudas.length >= 2;
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
      console.log(`Buscando beneficiario para cédula: ${cedula}`);
      const response = await axios.get(
        `https://maneiro-api-mem1.onrender.com/registro_electoral/buscar/?cedula=${cedula}`
      );
      const data = response.data;
      console.log("Respuesta completa de la API de registro electoral:", data);
      console.log(
        "Campo 'nombre' recibido de la API de Registro:",
        data.nombre
      );

      setFormData((prev) => ({
        ...prev,
        beneficiario: data.nombre.trim(),
        nacionalidad: data.nacionalidad.trim(),
        sexo: data.sexo === "F" ? "Femenino" : "Masculino",
        fechaNacimiento: formatToYYYYMMDD(data.fecha_nacimiento),
        parroquia: data.parroquia,
        municipio: data.municipio,
        estructura: data.estructura,
      }));

      const requiresPin = checkIfPinRequired(cedula, ayudas);
      setPinRequired(requiresPin);
      if (!requiresPin) setPinInput("");

      setAlert({
        show: true,
        message: "Beneficiario encontrado y datos rellenados.",
        type: "success",
      });
    } catch (error) {
      console.error("Error al buscar la cédula:");
      console.error("Detalles del error:", error);
      console.error("Respuesta del error (si existe):", error.response?.data);
      console.error("Estado del error (si existe):", error.response?.status);
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
    }
  };

  const openModal = (ayuda = null) => {
    const tipoMapInverso = {
      "Asistencias Médicas": 1,
      "Enseres": 2,
      "Tanque": 3,
      "Tanques de Agua": 4,
    };
    
    if (ayuda) {
      setSelectedAyuda(ayuda);
      setFormData({
        cedula: ayuda.cedula,
        beneficiario: ayuda.beneficiario || "",
        nacionalidad: ayuda.nacionalidad || "",
        sexo: ayuda.sexo,
        fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
        parroquia: ayuda.parroquia,
        municipio: ayuda.municipio,
        estructura: ayuda.estructura || "",
        telefono: ayuda.telefono || "",
        direccion: ayuda.direccion || "",
        calle: ayuda.calle || "",
        institucion: ayuda.institucion || "",
        estado: ayuda.estado,
        tipo: tipoMapInverso[ayuda.tipo] || "",
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

    if (name === "cedula" && !selectedAyuda) {
      const requiresPin = checkIfPinRequired(value, ayudas);
      setPinRequired(requiresPin);
      if (!requiresPin) {
        setPinInput("");
      }
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
        message:
          "Por favor, complete todos los campos requeridos (cédula, beneficiario, nacionalidad, sexo, municipio, parroquia).",
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
        const num = parseInt(ayuda.codigo?.replace("AYU-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      generatedCodigo = `AYU-${String(maxId + 1).padStart(3, "0")}`;
    }

    const currentDate = new Date().toISOString();

    const tipoMapInverso = {
      "Asistencias Médicas": 1,
      "Enseres": 2,
      "Tanque": 3,
      "Tanques de Agua": 4,
    };
    const tipoNumero = tipoMapInverso[formData.tipo] || null;

    const apiData = {
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
      tipo: tipoNumero,
      observacion: formData.observacion || "",
      responsableInstitucion: formData.responsableInstitucion || "",
      subtipo: formData.subtipo || "",
      fecha_registro: currentDate,
      fecha_actualizacion: currentDate,
    };

    try {
      if (selectedAyuda) {
        await axios.put(
          `https://maneiro-api-mem1.onrender.com/api/${selectedAyuda.id}/`,
          apiData
        );
        setAlert({
          show: true,
          message: "Ayuda actualizada exitosamente.",
          type: "success",
        });
      } else {
        await axios.post("https://maneiro-api-mem1.onrender.com/api/", apiData);
        setAlert({
          show: true,
          message: "Nueva ayuda registrada exitosamente.",
          type: "success",
        });
      }
      closeModal();
      setSelectedAyuda(null);
      fetchAyudas(false);
    } catch (error) {
      console.error(
        "Error al guardar la ayuda:",
        error.response?.data || error
      );
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
        fetchAyudas(false);
      } catch (error) {
        console.error(
          "Error al eliminar la ayuda:",
          error.response?.data || error
        );
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
    const matchesPalabra =
      ayuda.beneficiario?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.cedula?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.estructura?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      false;

    const matchesCodigo = () => {
      if (!searchCodigo.trim()) return true;

      const userQuery = searchCodigo.trim().toUpperCase();
      const codigo = ayuda.codigo?.toUpperCase();
      if (!codigo) return false;

      if (codigo === userQuery) {
        return true;
      }
      
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

  const sortedAyudas = [...filteredAyudas].sort((a, b) => {
    if (sortConfig.key === "codigo") {
      const aNum = parseInt(a.codigo?.replace("AYU-", ""), 10);
      const bNum = parseInt(b.codigo?.replace("AYU-", ""), 10);

      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return sortConfig.direction === "asc" ? 1 : -1;
      if (isNaN(bNum)) return sortConfig.direction === "asc" ? -1 : 1;
      
      const comparison = aNum - bNum;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    } else if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined)
        return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue === null || bValue === undefined)
        return sortConfig.direction === "asc" ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
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

        <div className="mb-6 flex flex-col flex justify-center sm:flex-row items-center sm:items-start gap-4 rounded-xl bg-white p-4 shadow-lg border border-gray-300">
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
                onClick={() => selectedAyuda && requirePinForAction("edit")}
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
                onClick={handleDelete}
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
          Mostrando {sortedAyudas.length} de {ayudas.length} registros
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              🔐 Validación de Seguridad
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Para {actionToConfirm === "edit" ? "editar" : "eliminar"} esta
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
    </div>
  );
};

export default Dashboard;
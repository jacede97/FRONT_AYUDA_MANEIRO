import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Table from "./table";
import Modal from "../../layout/Modal";
import Alert from "../Alert";
import ConfirmDeleteModal from "../../layout/ConfirmDeleteModal";

// Define la URL base de tu API usando la variable de entorno para Render
// o la URL de Render para pruebas locales.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://maneiro-api.onrender.com/api';

// Crea una instancia de Axios con la URL base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  // Nuevo estado para las propiedades del modal
  const [modalProps, setModalProps] = useState({
    title: "",
    headerColor: "",
  });

  // NUEVOS ESTADOS PARA LA LÓGICA DEL PIN
  const [pinRequired, setPinRequired] = useState(false); // Indica si se necesita un PIN
  const [pinInput, setPinInput] = useState(''); // Valor del PIN ingresado

  const [formData, setFormData] = useState({
    cedula: "",
    beneficiario: "",
    nacionalidad: "",
    sexo: "",
    fechaNacimiento: "",
    parroquia: "",
    municipio: "",
    sector: "",
    telefono: "",
    direccion: "",
    institucion: "",
    estado: "",
    tipo: "",
    observacion: "",
    responsableInstitucion: "",
  });

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

  const fetchAyudas = useCallback(async () => {
    console.log("INTENTANDO: Cargar ayudas desde la API...");
    try {
      // Usar la instancia 'api' para la URL relativa
      const response = await api.get("/ayudas/");
      console.log(
        "ÉXITO: Respuesta de la API (datos crudos de Ayudas):",
        response.data
      );

      const apiAyudas = response.data.map((ayuda) => {
        return {
          ...ayuda,
          id: ayuda.id,
          fecha: new Date(ayuda.fecha).toISOString().split("T")[0],
          // Asegúrate de mapear fecha_registro aquí
          fecha_registro: ayuda.fecha_registro, // Añadido para la lógica del PIN
          beneficiario: ayuda.beneficiario || "",
          nacionalidad:
            ayuda.cedula &&
            typeof ayuda.cedula === "string" &&
            ayuda.cedula.startsWith("V")
              ? "V"
              : "E",
          sexo: ayuda.sexo === "M" ? "Masculino" : "Femenino",
          fechaNacimiento: formatToYYYYMMDD(ayuda.fechaNacimiento),
          responsableInstitucion: ayuda.responsableInstitucion || "",
        };
      });
      setAyudas(apiAyudas);
      setAlert({
        show: true,
        message: "Datos cargados exitosamente desde la API.",
        type: "success",
      });
    } catch (error) {
      console.error("ERROR: Fallo al cargar las ayudas desde la API.");
      console.error("Detalles del error:", error);
      console.error("Respuesta del error (si existe):", error.response?.data);
      console.error("Estado del error (si existe):", error.response?.status);
      setAlert({
        show: true,
        message:
          "¡Error al conectar con la API! No se pudieron cargar los datos. Por favor, asegúrese de que el backend esté funcionando y que CORS esté configurado.",
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    fetchAyudas();
  }, [fetchAyudas]);

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
      const response = await api.get(`/registro_electoral/buscar/?cedula=${cedula}`);
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
        sector: data.sector,
      }));
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
    setSelectedAyuda(ayuda);
    setFormData({
      cedula: ayuda ? ayuda.cedula : "",
      beneficiario: ayuda ? ayuda.beneficiario || "" : "",
      nacionalidad: ayuda ? ayuda.nacionalidad : "",
      sexo: ayuda ? ayuda.sexo : "",
      fechaNacimiento: ayuda ? formatToYYYYMMDD(ayuda.fechaNacimiento) : "",
      parroquia: ayuda ? ayuda.parroquia : "",
      municipio: ayuda ? ayuda.municipio : "",
      sector: ayuda ? ayuda.sector : "",
      telefono: ayuda ? ayuda.telefono : "",
      direccion: ayuda ? ayuda.direccion : "",
      institucion: ayuda ? ayuda.institucion : "",
      estado: ayuda ? ayuda.estado : "REGISTRADO / RECIBIDO",
      tipo: ayuda ? ayuda.tipo : "",
      observacion: ayuda ? ayuda.observacion || "" : "",
      responsableInstitucion: ayuda ? ayuda.responsableInstitucion || "" : "",
    });
    setModalProps({
      title: ayuda ? "Editar Ayuda" : "Nueva Ayuda",
      headerColor: ayuda ? "bg-[#FFCB00]" : "bg-[#0095D4]",
    });
    setPinRequired(false); // Resetea el PIN cuando se abre el modal
    setPinInput(''); // Limpia el input del PIN
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAlert({ show: false, message: "", type: "" });
    setPinRequired(false); // Resetea el estado del PIN al cerrar el modal
    setPinInput(''); // Limpia el input del PIN
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // NUEVA FUNCIÓN PARA MANEJAR EL CAMBIO DEL INPUT DEL PIN
  const handlePinInputChange = (e) => {
    setPinInput(e.target.value);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de campos requeridos
    if (
      !formData.cedula ||
      !formData.beneficiario ||
      !formData.tipo ||
      !formData.sector ||
      !formData.telefono ||
      !formData.direccion ||
      !formData.institucion ||
      !formData.responsableInstitucion
    ) {
      setAlert({
        show: true,
        message: "Por favor, complete todos los campos requeridos.",
        type: "error",
      });
      return;
    }

    // LÓGICA DE VALIDACIÓN DE AYUDAS FRECUENTES Y PIN DE SEGURIDAD
    if (!selectedAyuda) { // Solo aplica para nuevas ayudas
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentAyudasCount = ayudas.filter(ayuda => {
        // Filtra ayudas por la misma cédula y que estén dentro de los últimos 3 meses
        if (ayuda.cedula === formData.cedula && ayuda.fecha_registro) {
          try {
            const registroDate = new Date(ayuda.fecha_registro);
            return registroDate >= threeMonthsAgo;
          } catch (e) {
            console.error("Error al parsear fecha_registro para validación de PIN:", ayuda.fecha_registro, e);
            return false;
          }
        }
        return false;
      }).length;

      console.log(`Ayudas recientes para ${formData.cedula} en los últimos 3 meses: ${recentAyudasCount}`);

      // Si tiene 2 o más solicitudes en los últimos 3 meses, requiere PIN
      if (recentAyudasCount >= 2) {
        if (!pinRequired) {
          setPinRequired(true);
          setAlert({
            show: true,
            message: "¡Alerta! Este beneficiario tiene más de 2 solicitudes en los últimos 3 meses. Ingrese el PIN de seguridad (6 dígitos numéricos) para registrar la ayuda.",
            type: "warning",
          });
          return; // Detiene la ejecución para esperar el PIN
        } else {
          // Si el PIN es requerido, validarlo
          if (!pinInput || !/^\d{6}$/.test(pinInput)) { // PIN debe ser 6 dígitos numéricos
            setAlert({
              show: true,
              message: "PIN de seguridad inválido. Debe ser de 6 dígitos numéricos.",
              type: "error",
            });
            return; // Detiene la ejecución si el PIN es inválido
          }
          // Si el PIN es válido, se continúa con el proceso de guardado
          setAlert({ show: false, message: "", type: "" }); // Limpia alerta
          setPinRequired(false); // Resetea estado del PIN
          setPinInput(''); // Limpia input del PIN
        }
      }
    }
    // FIN LÓGICA DE VALIDACIÓN DE AYUDAS FRECUENTES Y PIN DE SEGURIDAD

    let generatedCodigo = selectedAyuda ? selectedAyuda.codigo : "";
    if (!selectedAyuda) {
      const maxId = ayudas.reduce((max, ayuda) => {
        const num = parseInt(ayuda.codigo?.replace("AYU-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      generatedCodigo = `AYU-${String(maxId + 1).padStart(3, "0")}`;
      console.log("Código secuencial generado (Frontend):", generatedCodigo);
    }

    const apiData = {
      codigo: generatedCodigo,
      cedula: formData.cedula,
      beneficiario: formData.beneficiario,
      nacionalidad: formData.nacionalidad === "V" ? "V" : "E",
      sexo: formData.sexo === "Masculino" ? "M" : "F",
      fecha: new Date().toISOString().split("T")[0], // Fecha actual de registro
      fechaNacimiento: formData.fechaNacimiento,
      parroquia: formData.parroquia,
      municipio: formData.municipio,
      sector: formData.sector,
      telefono: formData.telefono,
      direccion: formData.direccion,
      institucion: formData.institucion,
      estado: formData.estado,
      tipo: formData.tipo,
      observacion: formData.observacion,
      responsableInstitucion: formData.responsableInstitucion,
    };

    console.log("Datos que se enviarán a la API (apiData):", apiData);

    try {
      if (selectedAyuda) {
        await api.put(`/ayudas/${selectedAyuda.id}/`, apiData);
        setAlert({
          show: true,
          message: "Ayuda actualizada exitosamente en la base de datos.",
          type: "success",
        });
      } else {
        await api.post("/ayudas/", apiData);
        setAlert({
          show: true,
          message: "Nueva ayuda registrada exitosamente en la base de datos.",
          type: "success",
        });
      }
      closeModal();
      setSelectedAyuda(null);
      fetchAyudas();
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

  const handleDelete = () => {
    if (selectedAyuda) {
      setItemToDelete(selectedAyuda);
      setIsConfirmModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      console.log("Intentando eliminar ID:", itemToDelete.id);
      try {
        await api.delete(`/ayudas/${itemToDelete.id}/`);
        setAlert({
          show: true,
          message: "Ayuda eliminada exitosamente de la base de datos.",
          type: "success",
        });
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
        setSelectedAyuda(null);
        fetchAyudas();
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
    const matchesCodigo =
      ayuda.codigo?.toLowerCase().includes(searchCodigo.toLowerCase()) || false;
    const matchesPalabra =
      ayuda.beneficiario?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.cedula?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      ayuda.sector?.toLowerCase().includes(searchPalabra.toLowerCase()) ||
      false;

    return matchesCodigo && matchesPalabra;
  });

  const sortedAyudas = [...filteredAyudas].sort((a, b) => {
    if (sortConfig.key) {
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
    <div className="flex-1 p-6 font-sans bg-gray-50 rounded-xl">
      <div className="space-y-6">
        {alert.show && (
          <Alert
            message={alert.message}
            type={alert.type}
            setAlert={setAlert}
          />
        )}
        {/* Encabezado principal: Título y descripción de la gestión de ayudas */}
        <div className="mb-8 text-center rounded-xl bg-gradient-to-r from-[#] to-[#] p-6 shadow-xl  border border-gray-400">
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de Ayudas
          </h2>
          <p className="text-gray-600 mt-1">
            Administre las ayudas sociales de la Alcaldía de Maneiro
          </p>
        </div>

        {/* Sección agrupada de Filtros de Búsqueda y Botones de Acción */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            {/* Contenedor de Filtros de Búsqueda (Ahora a la izquierda) */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mb-4 md:mb-0">
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
                  placeholder="Cédula, nombre, sector..."
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all text-sm"
                />
              </div>
            </div>

            {/* Contenedor de Botones de Acción (Ahora a la derecha) */}
            <div className="flex flex-wrap gap-2">
              {/* Botón Nuevo - Azul */}
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
              {/* Botón Editar - Amarillo */}
              <button
                onClick={() => selectedAyuda && openModal(selectedAyuda)}
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
              {/* Botón Eliminar - Rojo */}
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

        {/* Sección de la Tabla */}
        <div className="overflow-x-auto rounded-2xl shadow-lg mt-6 border border-blue-100 bg-white">
          <Table
            sortedAyudas={sortedAyudas}
            selectedAyuda={selectedAyuda}
            handleRowSelect={handleRowSelect}
            requestSort={requestSort}
            renderSortArrow={renderSortArrow}
          />
        </div>
        {/* Información de estado de la tabla */}
        <div className="mt-4 text-sm text-gray-600 text-center bg-white p-4 rounded-xl shadow-md border border-blue-100">
          Mostrando {sortedAyudas.length} de {ayudas.length} registros
        </div>
      </div>
      {/* Modal de Registro/Edición (Delegado a Modal y AyudaForm) */}
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
        // Nuevas props para el encabezado del modal
        modalTitle={modalProps.title}
        modalHeaderColor={modalProps.headerColor}
      />
      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.beneficiario || "este elemento"}
      />
    </div>
  );
};

export default Dashboard;

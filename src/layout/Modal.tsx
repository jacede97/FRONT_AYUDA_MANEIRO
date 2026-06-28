import React, { useState, useEffect, useMemo } from "react";
import Alert from "../components/Alert";
import Select from "react-select";
import api from "../lib/axio";

const Modal = ({
  isModalOpen,
  closeModal,
  handleSubmit,
  formData,
  handleInputChange,
  handleSearchBeneficiary,
  selectedAyuda,
  alert,
  setAlert,
  modalTitle,
  modalHeaderColor,
  pinRequired,
  pinInput,
  handlePinInputChange,
  validationInfo,
  setValidationInfo,
}) => {
  const [estructuras, setEstructuras] = useState([]);
  const [calles, setCalles] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loadingEstructuras, setLoadingEstructuras] = useState(false);
  const [loadingCalles, setLoadingCalles] = useState(false);
  const [loadingInstituciones, setLoadingInstituciones] = useState(false);
  const [errorEstructuras, setErrorEstructuras] = useState(null);
  const [errorCalles, setErrorCalles] = useState(null);
  const [errorInstituciones, setErrorInstituciones] = useState(null);
  const [direccionData, setDireccionData] = useState(null);
  const [ayudasData, setAyudasData] = useState(null);

  const [municipioOptions] = useState([
    { value: "", label: "Seleccione un municipio" },
    { value: "MP. ARISMENDI", label: "MP. ARISMENDI" },
    { value: "MP. MARIÑO", label: "MP. MARIÑO" },
    { value: "MP. MANEIRO", label: "MP. MANEIRO" },
    { value: "MP. GARCIA", label: "MP. GARCIA" },
    { value: "MP. GOMEZ", label: "MP. GOMEZ" },
    { value: "MP.ANTOLIN DEL CAMPO", label: "MP.ANTOLIN DEL CAMPO" },
    { value: "MP. TUBORES", label: "MP. TUBORES" },
    { value: "MP. DIAZ", label: "MP. DIAZ" },
    { value: "MP. MARCANO", label: "MP. MARCANO" },
    { value: "MP.VILLALBA(I.COCHE)", label: "MP.VILLALBA(I.COCHE)" },
    { value: "MP.PENIN. DE MACANAO", label: "MP.PENIN. DE MACANAO" },
    { value: "SIN UBICAR", label: "SIN UBICAR" },
  ]);

  const [parroquiaOptions] = useState([
    { value: "", label: "Seleccione una parroquia" },
    { value: "CM. LA ASUNCION", label: "CM. LA ASUNCION" },
    { value: "CM. PORLAMAR", label: "CM. PORLAMAR" },
    { value: "PQ. AGUIRRE", label: "PQ. AGUIRRE" },
    { value: "CM. PAMPATAR", label: "CM. PAMPATAR" },
    { value: "CM. VALLE ESP SANTO", label: "CM. VALLE ESP SANTO" },
    { value: "PQ. FRANCISCO FAJARDO", label: "PQ. FRANCISCO FAJARDO" },
    { value: "CM. SANTA ANA", label: "CM. SANTA ANA" },
    { value: "CM.LA PLAZA DE PARAGUACHI", label: "CM.LA PLAZA DE PARAGUACHI" },
    { value: "CM. PUNTA DE PIEDRAS", label: "CM. PUNTA DE PIEDRAS" },
    { value: "CM. SAN JUAN BAUTISTA", label: "CM. SAN JUAN BAUTISTA" },
    { value: "PQ. SUCRE", label: "PQ. SUCRE" },
    { value: "CM. JUAN GRIEGO", label: "CM. JUAN GRIEGO" },
    { value: "PQ. BOLIVAR", label: "PQ. BOLIVAR" },
    { value: "PQ. ADRIAN", label: "PQ. ADRIAN" },
    { value: "PQ. LOS BARALES", label: "PQ. LOS BARALES" },
    { value: "CM. SAN PEDRO DE COCHE", label: "CM. SAN PEDRO DE COCHE" },
    { value: "PQ. MATASIETE", label: "PQ. MATASIETE" },
    { value: "PQ. ZABALA", label: "PQ. ZABALA" },
    { value: "PQ. SAN FRANCISCO", label: "PQ. SAN FRANCISCO" },
    { value: "CM. BOCA DEL RIO", label: "CM. BOCA DEL RIO" },
    { value: "PQ. GUEVARA", label: "PQ. GUEVARA" },
    { value: "PQ. VICENTE FUENTES", label: "PQ. VICENTE FUENTES" },
    { value: "SIN UBICAR", label: "SIN UBICAR" },
  ]);

  const [estadoOptions] = useState([
    { value: "REGISTRADO / RECIBIDO", label: "REGISTRADO / RECIBIDO" },
    { value: "APROBADA", label: "APROBADA" },
    { value: "FINALIZADA", label: "FINALIZADA" },
  ]);

  useEffect(() => {
    if (isModalOpen) {
      fetchDireccionData();
      fetchAyudasCompletas();
    }
  }, [isModalOpen]);

  const fetchDireccionData = async () => {
    setLoadingEstructuras(true);
    setErrorEstructuras(null);
    try {
      const response = await api.get('/selectores/direccion-completa/');
      setDireccionData(response.data);
      const estructurasUnicas = [...new Set(
        response.data.flatMap(m =>
          m.parroquias.flatMap(p =>
            p.bloques.flatMap(b =>
              b.sectores.flatMap(s =>
                s.estructuras.map(e => e.estructura)
              )
            )
          )
        )
      )].sort();
      setEstructuras([
        { value: "", label: "Seleccione una estructura" },
        ...estructurasUnicas.map(e => ({ value: e, label: e }))
      ]);
    } catch (error) {
      setErrorEstructuras('Error al cargar estructuras');
      setEstructuras([{ value: "", label: "Error al cargar" }]);
    } finally {
      setLoadingEstructuras(false);
    }
  };

  const fetchAyudasCompletas = async () => {
    setLoadingInstituciones(true);
    setErrorInstituciones(null);
    try {
      const response = await api.get('/gestion_ayudas/ayudas-completas/');
      setAyudasData(response.data);
      const insts = response.data.map(i => ({
        value: i.nombre,
        label: i.nombre
      })).sort((a, b) => a.label.localeCompare(b.label));
      setInstituciones([{ value: "", label: "Seleccione..." }, ...insts]);
    } catch (error) {
      console.error('Error al cargar ayudas completas:', error);
      setErrorInstituciones('Error al cargar instituciones');
      setInstituciones([{ value: "", label: "Error al cargar" }]);
    } finally {
      setLoadingInstituciones(false);
    }
  };

  useEffect(() => {
    if (!formData.estructura || !direccionData) {
      setCalles([{ value: "", label: "Seleccione una calle" }]);
      return;
    }
    setLoadingCalles(true);
    try {
      const callesUnicas = [...new Set(
        direccionData.flatMap(m =>
          m.parroquias.flatMap(p =>
            p.bloques.flatMap(b =>
              b.sectores.flatMap(s =>
                s.estructuras
                  .filter(e => e.estructura === formData.estructura)
                  .flatMap(e => e.calles.map(c => c.calle))
              )
            )
          )
        )
      )].sort();
      setCalles([{ value: "", label: "Seleccione una calle" }, ...callesUnicas.map(c => ({ value: c, label: c }))]);
    } catch (error) {
      setErrorCalles("Error al cargar calles");
      setCalles([{ value: "", label: "Error" }]);
    } finally {
      setLoadingCalles(false);
    }
  }, [formData.estructura, direccionData]);

  const memoizedTiposAyuda = useMemo(() => {
    if (!formData.institucion || !ayudasData) {
      return [{ value: "", label: "Seleccione un tipo" }];
    }
    const institucion = ayudasData.find(i => i.nombre === formData.institucion);
    if (!institucion?.tipos_ayuda?.length) {
      return [{ value: "", label: "No hay tipos disponibles" }];
    }
    const tipos = institucion.tipos_ayuda.map(t => ({
      value: t.nombre,
      label: t.nombre
    })).sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: "", label: "Seleccione un tipo" }, ...tipos];
  }, [formData.institucion, ayudasData]);

  const memoizedSubTiposAyuda = useMemo(() => {
    if (!formData.institucion || !formData.tipo || !ayudasData) {
      return [{ value: "", label: "Seleccione un subtipo" }];
    }
    const institucion = ayudasData.find(i => i.nombre === formData.institucion);
    const tipo = institucion?.tipos_ayuda?.find(t => t.nombre === formData.tipo);
    if (!tipo?.sub_tipos_ayuda?.length) {
      return [{ value: "", label: "No hay subtipos" }];
    }
    const subtipos = tipo.sub_tipos_ayuda.map(st => ({
      value: st.nombre,
      label: st.nombre
    })).sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: "", label: "Seleccione un subtipo" }, ...subtipos];
  }, [formData.institucion, formData.tipo, ayudasData]);

  const handleSelectChange = (name, selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    handleInputChange({ target: { name, value } });
    if (name === "institucion") {
      handleInputChange({ target: { name: "tipo", value: "" } });
      handleInputChange({ target: { name: "subtipo", value: "" } });
    } else if (name === "tipo") {
      handleInputChange({ target: { name: "subtipo", value: "" } });
    }
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#0069B6" : "#D1D5DB",
      "&:hover": { borderColor: "#0069B6" },
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? "0 0 0 1px #0069B6" : "none",
      padding: "0.25rem 0",
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
    return options.find(opt => opt.value === value) || null;
  };

  const validatePhone = (value) => {
    if (value && (!/^\d{10}$/.test(value) || value.length !== 10)) {
      setAlert({
        show: true,
        message: "El teléfono debe tener exactamente 10 dígitos numéricos.",
        type: "error",
      });
      return false;
    }
    setAlert({ show: false, message: "", type: "" });
    return true;
  };

  const handlePhoneBlur = (e) => {
    const { value } = e.target;
    validatePhone(value);
  };
  
  const handleInputGenericChange = (e) => {
    handleInputChange(e);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 font-sans">
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto transform transition-all sm:w-full">
        <div className={`p-4 rounded-t-2xl text-white flex justify-between items-center ${modalHeaderColor}`}>
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            onClick={closeModal}
            className="text-white hover:text-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {alert.show && (
            <Alert
              message={alert.message}
              type={alert.type}
              setAlert={setAlert}
            />
          )}

          {/* ✅ ALERTA DE VALIDACIÓN (sticky dentro del modal) */}
          {validationInfo.show && (
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 pb-3 rounded-xl">
              <div
                className={`p-4 rounded-xl border ${
                  validationInfo.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    : validationInfo.type === 'info'
                    ? 'bg-blue-50 border-blue-400 text-blue-800'
                    : validationInfo.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-green-50 border-green-400 text-green-800'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {validationInfo.type === 'warning' && (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {validationInfo.type === 'info' && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    {validationInfo.type === 'error' && (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium whitespace-pre-line">
                      {validationInfo.message}
                    </p>
                    {validationInfo.existingAyudas && validationInfo.existingAyudas.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer hover:underline text-gray-600">
                          📋 Ver detalles de ayudas anteriores ({validationInfo.existingAyudas.length})
                        </summary>
                        <ul className="mt-1 text-xs space-y-1 max-h-32 overflow-y-auto">
                          {validationInfo.existingAyudas.map((ayuda, idx) => (
                            <li key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                              <span className="font-semibold">{ayuda.codigo}</span> - {ayuda.tipo} 
                              <span className="text-gray-500 ml-1">({ayuda.estado})</span>
                              <span className="text-gray-400 ml-1">- {ayuda.fecha}</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cédula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Limpiar validación al cambiar cédula
                      if (validationInfo.show) {
                        setValidationInfo({ show: false, message: '', type: 'info', existingAyudas: [] });
                      }
                    }}
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:border-[#0069B6] transition-all"
                    placeholder="V-12345678"
                    disabled={!!selectedAyuda}
                  />
                  {!selectedAyuda && (
                    <button
                      type="button"
                      onClick={handleSearchBeneficiary}
                      className="bg-[#0095D4] text-white p-3 rounded-r-xl hover:bg-[#0069B6] transition-colors"
                      title="Buscar beneficiario en el registro electoral"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Beneficiario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beneficiario
                </label>
                <input
                  type="text"
                  name="beneficiario"
                  value={formData.beneficiario}
                  onChange={handleInputGenericChange}
                  required
                  disabled={!!selectedAyuda}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    selectedAyuda ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="Nombre completo"
                />
              </div>

              {/* Nacionalidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nacionalidad
                </label>
                <select
                  name="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={handleInputGenericChange}
                  required
                  disabled={!!formData.nacionalidad}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.nacionalidad ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Seleccione una nacionalidad</option>
                  <option value="V">Venezolano(a)</option>
                  <option value="E">Extranjero(a)</option>
                </select>
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputGenericChange}
                  required
                  disabled={!!formData.sexo}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.sexo ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Seleccione el sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento || ""}
                  onChange={handleInputGenericChange}
                  required
                  disabled={!!selectedAyuda && !!formData.fechaNacimiento}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    (!!selectedAyuda && !!formData.fechaNacimiento) ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputGenericChange}
                  onBlur={handlePhoneBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="04141234567"
                />
              </div>

              {/* Municipio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio
                </label>
                <Select
                  name="municipio"
                  options={municipioOptions}
                  value={getSelectedOption(municipioOptions, formData.municipio)}
                  onChange={(selectedOption) =>
                    handleSelectChange("municipio", selectedOption)
                  }
                  isDisabled={!!formData.municipio}
                  styles={customStyles}
                  placeholder="Seleccione un municipio"
                />
              </div>

              {/* Parroquia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parroquia
                </label>
                <Select
                  name="parroquia"
                  options={parroquiaOptions}
                  value={getSelectedOption(parroquiaOptions, formData.parroquia)}
                  onChange={(selectedOption) =>
                    handleSelectChange("parroquia", selectedOption)
                  }
                  isDisabled={!!formData.parroquia}
                  styles={customStyles}
                  placeholder="Seleccione una parroquia"
                />
              </div>

              {/* Estructura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estructura
                </label>
                {loadingEstructuras ? (
                  <div className="px-4 py-3 border border-gray-300 rounded-xl text-center">
                    <span className="text-gray-500">Cargando estructuras...</span>
                  </div>
                ) : errorEstructuras ? (
                  <div className="px-4 py-3 border border-red-300 rounded-xl bg-red-50">
                    <span className="text-red-700 text-sm">{errorEstructuras}</span>
                  </div>
                ) : (
                  <Select
                    name="estructura"
                    options={estructuras}
                    value={getSelectedOption(estructuras, formData.estructura)}
                    onChange={(selectedOption) =>
                      handleSelectChange("estructura", selectedOption)
                    }
                    styles={customStyles}
                    placeholder="Seleccione una estructura"
                  />
                )}
              </div>

              {/* Calle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calle
                </label>
                {loadingCalles ? (
                  <div className="px-4 py-3 border border-gray-300 rounded-xl text-center">
                    <span className="text-gray-500">Cargando calles...</span>
                  </div>
                ) : errorCalles ? (
                  <div className="px-4 py-3 border border-red-300 rounded-xl bg-red-50">
                    <span className="text-red-700 text-sm">{errorCalles}</span>
                  </div>
                ) : (
                  <Select
                    name="calle"
                    options={calles}
                    value={getSelectedOption(calles, formData.calle)}
                    onChange={(selectedOption) =>
                      handleSelectChange("calle", selectedOption)
                    }
                    styles={customStyles}
                    placeholder="Seleccione una calle"
                  />
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputGenericChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="Dirección completa"
                />
              </div>

              {/* Institución */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institución
                </label>
                {loadingInstituciones ? (
                  <div className="px-4 py-3 border border-gray-300 rounded-xl text-center">
                    <span className="text-gray-500">Cargando instituciones...</span>
                  </div>
                ) : errorInstituciones ? (
                  <div className="px-4 py-3 border border-red-300 rounded-xl bg-red-50">
                    <span className="text-red-700 text-sm">{errorInstituciones}</span>
                  </div>
                ) : (
                  <Select
                    name="institucion"
                    options={instituciones}
                    value={getSelectedOption(instituciones, formData.institucion)}
                    onChange={(selectedOption) =>
                      handleSelectChange("institucion", selectedOption)
                    }
                    styles={customStyles}
                    placeholder="Seleccione una institución"
                    isDisabled={loadingInstituciones}
                  />
                )}
              </div>

              {/* Tipo de Ayuda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ayuda
                </label>
                <Select
                  key={`tipo-${formData.institucion}`}
                  name="tipo"
                  options={memoizedTiposAyuda}
                  value={getSelectedOption(memoizedTiposAyuda, formData.tipo)}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value || '';
                    handleSelectChange("tipo", selectedOption);
                    // ✅ Actualizar validación al cambiar el tipo
                    if (formData.cedula) {
                      // El Dashboard actualizará la validación mediante handleInputChange
                      // Este cambio se propaga porque handleSelectChange llama a handleInputChange
                    }
                  }}
                  styles={customStyles}
                  placeholder="Seleccione un tipo"
                  isDisabled={loadingInstituciones || !formData.institucion}
                />
              </div>

              {/* SubTipo de Ayuda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SubTipo de Ayuda
                </label>
                <Select
                  key={`subtipo-${formData.tipo}`}
                  name="subtipo"
                  options={memoizedSubTiposAyuda}
                  value={getSelectedOption(memoizedSubTiposAyuda, formData.subtipo)}
                  onChange={(selectedOption) =>
                    handleSelectChange("subtipo", selectedOption)
                  }
                  styles={customStyles}
                  placeholder="Seleccione un subtipo"
                  isDisabled={!formData.tipo}
                />
              </div>

              {/* Responsable Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable Social
                </label>
                <input
                  type="text"
                  name="responsableInstitucion"
                  value={formData.responsableInstitucion}
                  onChange={handleInputGenericChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="Nombre del responsable"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Select
                  name="estado"
                  options={estadoOptions}
                  value={getSelectedOption(estadoOptions, formData.estado)}
                  onChange={(selectedOption) =>
                    handleSelectChange("estado", selectedOption)
                  }
                  styles={customStyles}
                  placeholder="Seleccione un estado"
                />
              </div>
            </div>

            {/* Observación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observación o Motivo de la Solicitud
              </label>
              <textarea
                name="observacion"
                value={formData.observacion}
                onChange={handleInputGenericChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                placeholder="Describa detalladamente la situación, necesidades y motivos de la solicitud..."
              />
            </div>

            {pinRequired && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-inner">
                <label className="block text-base font-bold text-yellow-800 mb-2">
                  ⚠️ PIN de Seguridad Requerido ⚠️
                </label>
                <input
                  type="password"
                  name="pin"
                  value={pinInput}
                  onChange={handlePinInputChange}
                  className="w-full px-4 py-3 border border-yellow-400 rounded-xl focus:outline-none focus:border-yellow-500"
                  maxLength="6"
                  placeholder="Ingrese PIN: 270725"
                  required
                />
                <p className="text-sm text-yellow-700 mt-2">
                  Esta persona ya tiene 2 o más solicitudes en los últimos 3
                  meses. Solo personal autorizado puede registrar nuevas ayudas.
                </p>
              </div>
            )}

            {selectedAyuda && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Ayuda
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedAyuda.codigo}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Registro
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedAyuda.fecha}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#0069B6] text-white rounded-xl hover:bg-[#003578] transition-colors font-medium"
              >
                {selectedAyuda ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Modal;
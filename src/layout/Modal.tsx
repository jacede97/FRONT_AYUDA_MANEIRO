import React from "react";
import Alert from "../components/Alert"; // Importa el componente Alert

const Modal = ({
  isModalOpen,
  closeModal,
  handleSubmit,
  formData,
  handleInputChange,
  handleSearchBeneficiary,
  selectedAyuda,
  alert, // Recibe el estado de la alerta del Dashboard
  setAlert, // Recibe la función para actualizar la alerta del Dashboard
  modalTitle, // Propiedad para el título del modal
  modalHeaderColor, // Propiedad para el color del encabezado del modal
  // Props para el PIN
  pinRequired, // Booleano: indica si se debe mostrar el campo del PIN
  pinInput, // String: valor del PIN ingresado
  handlePinInputChange, // Función: maneja el cambio en el input del PIN
}) => {
  // Si el modal no debe estar abierto, no renderiza nada
  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 font-sans">
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto transform transition-all sm:w-full">
        {/* Encabezado del Modal */}
        <div
          className={`p-4 rounded-t-2xl text-white flex justify-between items-center ${modalHeaderColor}`}
        >
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            onClick={closeModal}
            className="text-white hover:text-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Alerta */}
          {alert.show && (
            <Alert
              message={alert.message}
              type={alert.type}
              setAlert={setAlert}
            />
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
                    onChange={handleInputChange}
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
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
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
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.beneficiario}
                  title={
                    formData.beneficiario
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.beneficiario ? "bg-gray-100 cursor-not-allowed" : ""
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
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.nacionalidad}
                  title={
                    formData.nacionalidad
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
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
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.sexo}
                  title={
                    formData.sexo
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
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
                  value={formData.fechaNacimiento}
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.fechaNacimiento}
                  title={
                    formData.fechaNacimiento
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.fechaNacimiento
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                />
              </div>

              {/* Municipio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio
                </label>
                <select
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.municipio}
                  title={
                    formData.municipio
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.municipio ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Seleccione un municipio</option>
                  <option value="MP. ARISMENDI">MP. ARISMENDI</option>
                  <option value="MP. MARIÑO">MP. MARIÑO</option>
                  <option value="MP. MANEIRO">MP. MANEIRO</option>
                  <option value="MP. GARCIA">MP. GARCIA</option>
                  <option value="MP. GOMEZ">MP. GOMEZ</option>
                  <option value="MP.ANTOLIN DEL CAMPO">
                    MP.ANTOLIN DEL CAMPO
                  </option>
                  <option value="MP. TUBORES">MP. TUBORES</option>
                  <option value="MP. DIAZ">MP. DIAZ</option>
                  <option value="MP. MARCANO">MP. MARCANO</option>
                  <option value="MP.VILLALBA(I.COCHE)">
                    MP.VILLALBA(I.COCHE)
                  </option>
                  <option value="MP.PENIN. DE MACANAO">
                    MP.PENIN. DE MACANAO
                  </option>
                </select>
              </div>

              {/* Parroquia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parroquia
                </label>
                <select
                  name="parroquia"
                  value={formData.parroquia}
                  onChange={handleInputChange}
                  required
                  disabled={!!formData.parroquia}
                  title={
                    formData.parroquia
                      ? "Este campo se llenó automáticamente y no puede ser modificado."
                      : ""
                  }
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all ${
                    formData.parroquia ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Seleccione una parroquia</option>
                  <option value="CM. LA ASUNCION">CM. LA ASUNCION</option>
                  <option value="CM. PORLAMAR">CM. PORLAMAR</option>
                  <option value="PQ. AGUIRRE">PQ. AGUIRRE</option>
                  <option value="CM. PAMPATAR">CM. PAMPATAR</option>
                  <option value="CM. VALLE ESP SANTO">
                    CM. VALLE ESP SANTO
                  </option>
                  <option value="PQ. FRANCISCO FAJARDO">
                    PQ. FRANCISCO FAJARDO
                  </option>
                  <option value="CM. SANTA ANA">CM. SANTA ANA</option>
                  <option value="CM.LA PLAZA DE PARAGUACHI">
                    CM.LA PLAZA DE PARAGUACHI
                  </option>
                  <option value="CM. PUNTA DE PIEDRAS">
                    CM. PUNTA DE PIEDRAS
                  </option>
                  <option value="CM. SAN JUAN BAUTISTA">
                    CM. SAN JUAN BAUTISTA
                  </option>
                  <option value="PQ. SUCRE">PQ. SUCRE</option>
                  <option value="CM. JUAN GRIEGO">CM. JUAN GRIEGO</option>
                  <option value="PQ. BOLIVAR">PQ. BOLIVAR</option>
                  <option value="PQ. ADRIAN">PQ. ADRIAN</option>
                  <option value="PQ. LOS BARALES">PQ. LOS BARALES</option>
                  <option value="CM. SAN PEDRO DE COCHE">
                    CM. SAN PEDRO DE COCHE
                  </option>
                  <option value="PQ. MATASIETE">PQ. MATASIETE</option>
                  <option value="PQ. ZABALA">PQ. ZABALA</option>
                  <option value="PQ. SAN FRANCISCO">PQ. SAN FRANCISCO</option>
                  <option value="CM. BOCA DEL RIO">CM. BOCA DEL RIO</option>
                  <option value="PQ. GUEVARA">PQ. GUEVARA</option>
                  <option value="PQ. VICENTE FUENTES">
                    PQ. VICENTE FUENTES
                  </option>
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector
                </label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                >
                  <option value="">Seleccione un sector</option>
                  {[
                    "3 DE MAYO",
                    "AGUA DE VACA",
                    "APOSTADERO",
                    "BELEN",
                    "BRISAS DEL MAR",
                    "BUEN VIAJE",
                    "CAMPEARE",
                    "CASTO LOPEZ",
                    "CLL LAS FLORES",
                    "CURIEPE",
                    "EL CEMENTERIO",
                    "EL CERRO",
                    "EL HATO",
                    "EL PLATANAL",
                    "EL POCITO",
                    "EL POTRERO",
                    "EL REALENGO",
                    "EL TAMARINDO",
                    "EL TROCADERO",
                    "EL VIGIA",
                    "FRATERNIDAD",
                    "JORGE COLL",
                    "JOVITO LOPEZ",
                    "JOVITO VILLALBA",
                    "JULIO LUIS BEAUFOND",
                    "LA ANTENA",
                    "LA CARANTA",
                    "LA CIUDADELA DEL MAR",
                    "LA FUNDACION",
                    "LA GUAMACHERA",
                    "LA OTRA SABANA",
                    "LA PLAYA",
                    "LA PLAZA",
                    "LA SALINA",
                    "LAS ACACIAS",
                    "LAS BALBINAS",
                    "LAS CASITAS",
                    "LIBERTAD OESTE",
                    "LOMAS DE LA CARANTA",
                    "LOS CHACOS",
                    "LOS CHAURE",
                    "LOS OLIVOS",
                    "LOS ROBLES",
                    "MORENO",
                    "MUNDO NUEVO",
                    "NUEVA CADIZ",
                    "OTRA SABANA",
                    "PEÑA BLANCA",
                    "PUNTA BERGANTIN",
                    "PUNTA BRAVA",
                    "POLANCO",
                    "PLATANAL",
                    "PUERTO MORENO",
                    "SALAZAR GARCIA",
                    "SAN FERNANDO",
                    "SAN JUDAS TADEO",
                    "SAN LORENZO",
                    "SAN MARTIN",
                    "SIN UBICAR",
                    "TAMARINDO"
                  ].map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
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
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="0414-1234567"
                />
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
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="Dirección completa"
                />
              </div>

              {/* Institución */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institución
                </label>
                <input
                  type="text"
                  name="institucion"
                  value={formData.institucion}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="Institución que solicita"
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
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                  placeholder="Nombre del responsable"
                />
              </div>

              {/* Tipo de Solicitud */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Solicitud
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                >
                  <option value="">Seleccione un tipo</option>
                  {[
                    "AYUDA ECONOMICA",
                    "AYUDA MEDICA",
                    "AYUDAS TECNICAS",
                    "CEMENTO",
                    "LAMINAS",
                    "MANTO",
                    "MANTO FLEX",
                    "MEDICAMENTOS",
                    "MATERIALES DE CONSTRUCCION",
                    "POR INFORMACION",
                    "TANQUE"
                  ]
                    .sort()
                    .map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                >
                  <option value="REGISTRADO / RECIBIDO">
                    REGISTRADO / RECIBIDO
                  </option>
                  <option value="EN REVISIÓN">EN REVISIÓN</option>
                  <option value="OBSERVADO">OBSERVADO</option>
                  <option value="VALIDADO / APROBADO">
                    VALIDADO / APROBADO
                  </option>
                  <option value="RECHAZADO">RECHAZADO</option>
                  <option value="EN PROCESO DE ASIGNACIÓN">
                    EN PROCESO DE ASIGNACIÓN
                  </option>
                  <option value="PENDIENTE DE RETIRO">
                    PENDIENTE DE RETIRO
                  </option>
                  <option value="ENTREGADA">ENTREGADA</option>
                  <option value="NO ENTREGADA">NO ENTREGADA</option>
                  <option value="DERIVADO A OTRO MUNICIPIO / INSTITUCIÓN">
                    DERIVADO A OTRO MUNICIPIO / INSTITUCIÓN
                  </option>
                  <option value="ARCHIVADO / CERRADO">
                    ARCHIVADO / CERRADO
                  </option>
                  <option value="EN ESPERA DE RECURSOS">
                    EN ESPERA DE RECURSOS
                  </option>
                  <option value="REASIGNADO">REASIGNADO</option>
                  <option value="EN APELACIÓN">EN APELACIÓN</option>
                </select>
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
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
                placeholder="Describa detalladamente la situación, necesidades y motivos de la solicitud..."
              ></textarea>
            </div>

            {/* Campo del PIN de Seguridad (solo si es requerido) */}
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
                  pattern="\d{6}"
                  placeholder="Ingrese PIN de 6 dígitos"
                  required
                />
                <p className="text-sm text-yellow-700 mt-2">
                  Esta persona ya tiene 2 o más solicitudes en los últimos 3 meses. Ingrese el PIN para continuar.
                </p>
              </div>
            )}

            {/* Mostrar código y fecha si se está editando */}
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

            {/* Botones */}
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
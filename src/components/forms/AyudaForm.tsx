import React, { useState, useEffect } from "react";
import axios from "axios";
import Alert from "../Alert";

const AyudaForm = ({
  onSubmit,
  selectedAyuda,
  setAlert,
  alert,
  closeModal,
}) => {
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
    estado: "Pendiente",
    tipo: "",
    observacion: "",
  });

  useEffect(() => {
    if (selectedAyuda) {
      setFormData({
        cedula: selectedAyuda.cedula,
        beneficiario: selectedAyuda.beneficiario,
        nacionalidad: selectedAyuda.nacionalidad,
        sexo: selectedAyuda.sexo,
        fechaNacimiento: selectedAyuda.fechaNacimiento,
        parroquia: selectedAyuda.parroquia,
        municipio: selectedAyuda.municipio,
        sector: selectedAyuda.sector,
        telefono: selectedAyuda.telefono,
        direccion: selectedAyuda.direccion,
        institucion: selectedAyuda.institucion,
        estado: selectedAyuda.estado,
        tipo: selectedAyuda.tipo,
        observacion: selectedAyuda.observacion || "",
      });
    } else {
      setFormData({
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
        estado: "Pendiente",
        tipo: "",
        observacion: "",
      });
    }
  }, [selectedAyuda]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        `https://maneiro-api.onrender.com/registro_electoral/buscar/?cedula=${cedula}`
      );
      const data = response.data;
      setFormData((prev) => ({
        ...prev,
        beneficiario: data.nombre.trim(),
        nacionalidad: data.nacionalidad.trim(),
        sexo: data.sexo === "F" ? "Femenino" : "Masculino",
        fechaNacimiento: data.fecha_nacimiento,
        parroquia: data.parroquia,
        municipio: data.municipio,
      }));
      setAlert({
        show: true,
        message: "Beneficiario encontrado y datos rellenados.",
        type: "success",
      });
    } catch (error) {
      console.error("Error al buscar la cédula:", error);
      if (error.response && error.response.status === 404) {
        setAlert({
          show: true,
          message:
            "Cédula no encontrada. Por favor, ingrese los datos manualmente.",
          type: "warning",
        });
      } else {
        setAlert({
          show: true,
          message:
            "Error en la conexión con el servidor. Intente de nuevo más tarde.",
          type: "error",
        });
      }
      setFormData((prev) => ({
        ...prev,
        beneficiario: "",
        sexo: "",
        fechaNacimiento: "",
        parroquia: "",
        municipio: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.cedula &&
      formData.beneficiario &&
      formData.tipo &&
      formData.sector &&
      formData.telefono &&
      formData.direccion &&
      formData.institucion
    ) {
      onSubmit(formData);
      closeModal();
    } else {
      setAlert({
        show: true,
        message: "Por favor, complete todos los campos obligatorios.",
        type: "warning",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "" })}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="V-12345678"
            />
            <button
              type="button"
              onClick={handleSearchBeneficiary}
              className="bg-gray-200 p-3 rounded-r-lg hover:bg-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
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
          </div>
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.beneficiario ? "bg-[#8f9295]" : ""
            }`}
            placeholder="Nombre completo"
          />
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.nacionalidad ? "bg-[#8f9295]" : ""
            }`}
          >
            <option value="">Seleccione una nacionalidad</option>
            <option value="V">Venezolano(a)</option>
            <option value="E">Extranjero(a)</option>
          </select>
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.sexo ? "bg-[#8f9295]" : ""
            }`}
          >
            <option value="">Seleccione el sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.fechaNacimiento ? "bg-[#8f9295]" : ""
            }`}
          />
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.municipio ? "bg-[#8f9295]" : ""
            }`}
          >
            <option value="">Seleccione un municipio</option>
            <option value="MP. ARISMENDI">MP. ARISMENDI</option>
            <option value="MP. MARIÑO">MP. MARIÑO</option>
            <option value="MP. MANEIRO">MP. MANEIRO</option>
            <option value="MP. GARCIA">MP. GARCIA</option>
            <option value="MP. GOMEZ">MP. GOMEZ</option>
            <option value="MP.ANTOLIN DEL CAMPO">MP.ANTOLIN DEL CAMPO</option>
            <option value="MP. TUBORES">MP. TUBORES</option>
            <option value="MP. DIAZ">MP. DIAZ</option>
            <option value="MP. MARCANO">MP. MARCANO</option>
            <option value="MP.VILLALBA(I.COCHE)">MP.VILLALBA(I.COCHE)</option>
            <option value="MP.PENIN. DE MACANAO">MP.PENIN. DE MACANAO</option>
          </select>
        </div>
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
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
              formData.parroquia ? "bg-[#8f9295]" : ""
            }`}
          >
            <option value="">Seleccione una parroquia</option>
            <option value="CM. LA ASUNCION">CM. LA ASUNCION</option>
            <option value="CM. PORLAMAR">CM. PORLAMAR</option>
            <option value="PQ. AGUIRRE">PQ. AGUIRRE</option>
            <option value="CM. PAMPATAR">CM. PAMPATAR</option>
            <option value="CM. VALLE ESP SANTO">CM. VALLE ESP SANTO</option>
            <option value="PQ. FRANCISCO FAJARDO">PQ. FRANCISCO FAJARDO</option>
            <option value="CM. SANTA ANA">CM. SANTA ANA</option>
            <option value="CM.LA PLAZA DE PARAGUACHI">
              CM.LA PLAZA DE PARAGUACHI
            </option>
            <option value="CM. PUNTA DE PIEDRAS">CM. PUNTA DE PIEDRAS</option>
            <option value="CM. SAN JUAN BAUTISTA">CM. SAN JUAN BAUTISTA</option>
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
            <option value="PQ. VICENTE FUENTES">PQ. VICENTE FUENTES</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sector
          </label>
          <select
            name="sector"
            value={formData.sector}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          >
            <option value="">Seleccione un sector</option>
            <option value="Centro">Centro</option>
            <option value="Playa">Playa</option>
            <option value="Montaña">Montaña</option>
            <option value="Barrio Nuevo">Barrio Nuevo</option>
            <option value="Costa Azul">Costa Azul</option>
            <option value="El Valle">El Valle</option>
            <option value="San José">San José</option>
            <option value="La Candelaria">La Candelaria</option>
          </select>
        </div>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="0414-1234567"
          />
        </div>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="Dirección completa"
          />
        </div>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="Institución que solicita"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsable Social / Institución
          </label>
          <input
            type="text"
            name="responsableInstitucion"
            value={formData.responsableInstitucion}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="Nombre del responsable"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Solicitud
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          >
            <option value="">Seleccione un tipo</option>
            <option value="Alimentación">Alimentación</option>
            <option value="Vivienda">Vivienda</option>
            <option value="Salud">Salud</option>
            <option value="Educación">Educación</option>
            <option value="Transporte">Transporte</option>
            <option value="Empleo">Empleo</option>
            <option value="Recreación">Recreación</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          >
            <option value="REGISTRADO / RECIBIDO">REGISTRADO / RECIBIDO</option>
            <option value="EN REVISIÓN">EN REVISIÓN</option>
            <option value="OBSERVADO">OBSERVADO</option>
            <option value="VALIDADO / APROBADO">VALIDADO / APROBADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
            <option value="EN PROCESO DE ASIGNACIÓN">
              EN PROCESO DE ASIGNACIÓN
            </option>
            <option value="PENDIENTE DE RETIRO">PENDIENTE DE RETIRO</option>
            <option value="ENTREGADA">ENTREGADA</option>
            <option value="NO ENTREGADA">NO ENTREGADA</option>
            <option value="DERIVADO A OTRO MUNICIPIO / INSTITUCIÓN">
              DERIVADO A OTRO MUNICIPIO / INSTITUCIÓN
            </option>
            <option value="ARCHIVADO / CERRADO">ARCHIVADO / CERRADO</option>
            <option value="EN ESPERA DE RECURSOS">EN ESPERA DE RECURSOS</option>
            <option value="REASIGNADO">REASIGNADO</option>
            <option value="EN APELACIÓN">EN APELACIÓN</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observación o Motivo de la Solicitud
        </label>
        <textarea
          name="observacion"
          value={formData.observacion}
          onChange={handleInputChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          placeholder="Describa detalladamente la situación, necesidades y motivos de la solicitud..."
        />
      </div>
      {selectedAyuda && (
        <div className="bg-gray-50 p-4 rounded-lg">
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
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors font-medium"
        >
          {selectedAyuda ? "Actualizar" : "Registrar"}
        </button>
      </div>
    </form>
  );
};

export default AyudaForm;

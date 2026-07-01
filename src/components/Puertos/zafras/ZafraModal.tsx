import React, { useState, useEffect } from "react";
import axios from "axios";
import Alert from "../../Alert";

interface ZafraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zafra?: any;
}

const ZafraModal: React.FC<ZafraModalProps> = ({ isOpen, onClose, onSuccess, zafra }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    especie: "",
    fecha_inicio: "",
    fecha_fin: "",
    dias_semana: [1, 2, 3, 4, 5],
    cuota_total: "",
    observaciones: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [validationInfo, setValidationInfo] = useState({ show: false, message: "", type: "info", existingData: [] });
  const isEditing = !!zafra;

  const dias = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 7, label: "Domingo" },
  ];

  useEffect(() => {
    if (zafra) {
      setFormData({
        nombre: zafra.nombre || "",
        especie: zafra.especie || "",
        fecha_inicio: zafra.fecha_inicio || "",
        fecha_fin: zafra.fecha_fin || "",
        dias_semana: zafra.dias_semana || [1, 2, 3, 4, 5],
        cuota_total: zafra.cuota_total || "",
        observaciones: zafra.observaciones || "",
      });
    } else {
      setFormData({
        nombre: "",
        especie: "",
        fecha_inicio: "",
        fecha_fin: "",
        dias_semana: [1, 2, 3, 4, 5],
        cuota_total: "",
        observaciones: "",
      });
    }
    setAlert({ show: false, message: "", type: "" });
    setValidationInfo({ show: false, message: "", type: "info", existingData: [] });
  }, [zafra, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "nombre") {
      setValidationInfo(prev => ({ ...prev, show: false }));
    }
  };

  const handleDiaToggle = (dia: number) => {
    setFormData(prev => {
      const current = prev.dias_semana;
      if (current.includes(dia)) {
        return { ...prev, dias_semana: current.filter(d => d !== dia) };
      } else {
        return { ...prev, dias_semana: [...current, dia].sort() };
      }
    });
  };

  // Validación del nombre (unicidad)
  const checkNombreUniqueness = async (nombre: string) => {
    if (!nombre || nombre.trim() === "") return;
    try {
      const params = { campo: "nombre", valor: nombre.trim() };
      const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/zafras/verificar-nombre/", { params });
      if (response.data.exists) {
        setValidationInfo({
          show: true,
          message: `❌ Ya existe una zafra con el nombre "${nombre}".`,
          type: "error",
          existingData: [{ id: response.data.existing_id, valor: nombre }],
        });
      } else {
        setValidationInfo(prev => ({ ...prev, show: false }));
      }
    } catch (error) {
      console.error("Error verificando nombre:", error);
    }
  };

  const handleBlurNombre = (e: React.FocusEvent<HTMLInputElement>) => {
    checkNombreUniqueness(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.especie || !formData.fecha_inicio || !formData.fecha_fin) {
      setAlert({ show: true, message: "Todos los campos obligatorios deben estar llenos.", type: "error" });
      return;
    }
    if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
      setAlert({ show: true, message: "La fecha de inicio debe ser anterior a la fecha de fin.", type: "error" });
      return;
    }
    if (formData.dias_semana.length === 0) {
      setAlert({ show: true, message: "Seleccione al menos un día de la semana.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        cuota_total: formData.cuota_total ? parseFloat(formData.cuota_total) : null,
      };
      let response;
      if (isEditing) {
        response = await axios.put(`https://maneiro-api-mem1.onrender.com/api/zafras/zafras/${zafra.id}/`, payload);
      } else {
        response = await axios.post("https://maneiro-api-mem1.onrender.com/api/zafras/zafras/", payload);
      }
      setAlert({ show: true, message: isEditing ? "Zafra actualizada" : "Zafra creada", type: "success" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Error guardando zafra:", error);
      const msg = error.response?.data?.detail || error.message || "Error al guardar";
      setAlert({ show: true, message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto w-full">
        <div className="p-4 rounded-t-2xl bg-[#0095D4] text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{isEditing ? "Editar Zafra" : "Nueva Zafra"}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {alert.show && <Alert message={alert.message} type={alert.type} setAlert={setAlert} />}

          {validationInfo.show && (
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 pb-3 rounded-xl">
              <div className={`p-4 rounded-xl border ${validationInfo.type === "error" ? "bg-red-50 border-red-400 text-red-800" : "bg-yellow-50 border-yellow-400 text-yellow-800"}`}>
                <p className="text-sm font-medium">{validationInfo.message}</p>
                {validationInfo.existingData?.map((item: any, idx: number) => (
                  <div key={idx} className="text-xs mt-1 text-gray-600">ID: {item.id} - {item.valor}</div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  onBlur={handleBlurNombre}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especie *</label>
                <input
                  type="text"
                  name="especie"
                  value={formData.especie}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días de pesca permitidos *</label>
              <div className="flex flex-wrap gap-2">
                {dias.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDiaToggle(d.value)}
                    className={`px-3 py-1 rounded-lg border-2 transition ${
                      formData.dias_semana.includes(d.value)
                        ? "bg-[#0095D4] text-white border-[#0095D4]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {d.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Total (kg)</label>
              <input
                type="number"
                name="cuota_total"
                value={formData.cuota_total}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0069B6] text-white rounded-xl hover:bg-[#003578] transition">
                {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ZafraModal;
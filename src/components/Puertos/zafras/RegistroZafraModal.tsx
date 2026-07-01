import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import Alert from "../../Alert";

interface RegistroZafraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zafraId?: number;
}

const RegistroZafraModal: React.FC<RegistroZafraModalProps> = ({ isOpen, onClose, onSuccess, zafraId }) => {
  const [formData, setFormData] = useState({
    zafra: null as any,
    embarcacion: null as any,
    estado: "ACTIVO",
    observaciones: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [embarcaciones, setEmbarcaciones] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchEmbarcaciones = async () => {
        try {
          const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/registros_puerto/");
          setEmbarcaciones(response.data.map((e: any) => ({ value: e.id, label: `${e.matricula} - ${e.nombre_embarcacion}` })));
        } catch (error) {
          console.error("Error cargando embarcaciones:", error);
        }
      };
      fetchEmbarcaciones();
    }
  }, [isOpen]);

  const handleSelectChange = (name: string, selected: any) => {
    setFormData(prev => ({ ...prev, [name]: selected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.zafra || !formData.embarcacion) {
      setAlert({ show: true, message: "Seleccione zafra y embarcación.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        zafra: formData.zafra.value,
        embarcacion: formData.embarcacion.value,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };
      await axios.post("https://maneiro-api-mem1.onrender.com/api/zafras/registros-zafra/", payload);
      setAlert({ show: true, message: "Embarcación inscrita exitosamente.", type: "success" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Error al inscribir:", error);
      const msg = error.response?.data?.detail || error.message || "Error al guardar";
      setAlert({ show: true, message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const customStyles = {
    control: (provided: any) => ({ ...provided, borderRadius: "0.75rem", borderWidth: "2px", borderColor: "#E5E7EB" }),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-md mx-auto w-full">
        <div className="p-4 rounded-t-2xl bg-green-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Inscribir Embarcación</h2>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {alert.show && <Alert message={alert.message} type={alert.type} setAlert={setAlert} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zafra *</label>
              <Select
                options={[{ value: zafraId, label: "Zafra actual" }]}
                value={zafraId ? { value: zafraId, label: "Zafra actual" } : null}
                onChange={(selected) => handleSelectChange("zafra", selected)}
                styles={customStyles}
                isDisabled={!!zafraId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Embarcación *</label>
              <Select
                options={embarcaciones}
                value={formData.embarcacion}
                onChange={(selected) => handleSelectChange("embarcacion", selected)}
                styles={customStyles}
                placeholder="Seleccione embarcación"
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                rows="2"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
                {loading ? "Guardando..." : "Inscribir"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroZafraModal;
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import Alert from "../../Alert";

interface JornadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zafraId?: number;
}

const JornadaModal: React.FC<JornadaModalProps> = ({ isOpen, onClose, onSuccess, zafraId }) => {
  const [formData, setFormData] = useState({
    zafra: null as any,
    embarcacion: null as any,
    fecha: "",
    hora_salida: "",
    hora_llegada: "",
    tripulantes: [] as any[],
    observaciones: "",
    capturas: [] as { especie: string; cantidad: number; unidad: string }[],
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [zafras, setZafras] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [validationInfo, setValidationInfo] = useState({ show: false, message: "", type: "info", existingData: [] });
  const [unidadOptions] = useState([
    { value: "kg", label: "Kg" },
    { value: "lb", label: "Lb" },
    { value: "caja", label: "Caja" },
    { value: "unidad", label: "Unidades" },
  ]);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [zafrasRes, embarcacionesRes] = await Promise.all([
            axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/zafras/"),
            axios.get("https://maneiro-api-mem1.onrender.com/api/registros_puerto/"),
          ]);
          setZafras(zafrasRes.data.map((z: any) => ({ value: z.id, label: z.nombre })));
          setEmbarcaciones(embarcacionesRes.data.map((e: any) => ({ value: e.id, label: `${e.matricula} - ${e.nombre_embarcacion}` })));
          
          if (zafraId) {
            const zafraSeleccionada = zafrasRes.data.find((z: any) => z.id === zafraId);
            if (zafraSeleccionada) {
              setFormData(prev => ({ ...prev, zafra: { value: zafraId, label: zafraSeleccionada.nombre } }));
            }
          }
        } catch (error) {
          console.error("Error cargando listas:", error);
        }
      };
      fetchData();
    }
  }, [isOpen, zafraId]);

  const validarFecha = useCallback(async (zafraId: number, fecha: string) => {
    if (!zafraId || !fecha) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/zafras/validar-fecha/", {
          params: { zafra_id: zafraId, fecha },
        });
        if (!response.data.valida) {
          setValidationInfo({
            show: true,
            message: `⚠️ ${response.data.message}`,
            type: "error",
            existingData: [],
          });
        } else {
          setValidationInfo(prev => ({ ...prev, show: false }));
        }
      } catch (error) {
        console.error("Error validando fecha:", error);
      }
    }, 500);
  }, []);

  const verificarJornadaDuplicada = useCallback(async (zafraId: number, embarcacionId: number, fecha: string) => {
    if (!zafraId || !embarcacionId || !fecha) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get("https://maneiro-api-mem1.onrender.com/api/zafras/jornadas/verificar/", {
          params: { zafra_id: zafraId, embarcacion_id: embarcacionId, fecha },
        });
        if (response.data.exists) {
          setValidationInfo({
            show: true,
            message: `⚠️ Ya existe una jornada para esta embarcación en esta fecha.`,
            type: "error",
            existingData: [],
          });
        } else {
          setValidationInfo(prev => {
            if (prev.message.includes("fecha")) return prev;
            return { ...prev, show: false };
          });
        }
      } catch (error) {
        console.error("Error verificando jornada:", error);
      }
    }, 500);
  }, []);

  const handleSelectChange = (name: string, selected: any) => {
    setFormData(prev => ({ ...prev, [name]: selected }));
    if (name === "zafra" && formData.fecha) {
      validarFecha(selected?.value, formData.fecha);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, fecha: value }));
    if (formData.zafra) {
      validarFecha(formData.zafra.value, value);
    }
    if (formData.zafra && formData.embarcacion) {
      verificarJornadaDuplicada(formData.zafra.value, formData.embarcacion.value, value);
    }
  };

  const addCaptura = () => {
    setFormData(prev => ({
      ...prev,
      capturas: [...prev.capturas, { especie: "", cantidad: 0, unidad: "kg" }],
    }));
  };

  const removeCaptura = (index: number) => {
    setFormData(prev => ({
      ...prev,
      capturas: prev.capturas.filter((_, i) => i !== index),
    }));
  };

  const handleCapturaChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.capturas];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, capturas: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.zafra || !formData.embarcacion || !formData.fecha || !formData.hora_salida) {
      setAlert({ show: true, message: "Zafra, embarcación, fecha y hora de salida son obligatorios.", type: "error" });
      return;
    }
    if (formData.capturas.some(c => !c.especie || c.cantidad <= 0)) {
      setAlert({ show: true, message: "Las capturas deben tener especie y cantidad válida.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        zafra: formData.zafra.value,
        embarcacion: formData.embarcacion.value,
        fecha: formData.fecha,
        hora_salida: formData.hora_salida,
        hora_llegada: formData.hora_llegada || null,
        tripulantes: formData.tripulantes,
        observaciones: formData.observaciones,
        capturas: formData.capturas,
      };
      await axios.post("https://maneiro-api-mem1.onrender.com/api/zafras/jornadas/", payload);
      setAlert({ show: true, message: "Jornada registrada exitosamente.", type: "success" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Error guardando jornada:", error);
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
      <div className="relative p-0 bg-white rounded-2xl shadow-xl max-w-3xl mx-auto w-full">
        <div className="p-4 rounded-t-2xl bg-purple-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Registrar Jornada</h2>
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
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zafra *</label>
                <Select
                  options={zafras}
                  value={formData.zafra}
                  onChange={(selected) => handleSelectChange("zafra", selected)}
                  styles={customStyles}
                  placeholder="Seleccione zafra"
                  isClearable
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida *</label>
                <input
                  type="time"
                  value={formData.hora_salida}
                  onChange={(e) => setFormData(prev => ({ ...prev, hora_salida: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label>
                <input
                  type="time"
                  value={formData.hora_llegada}
                  onChange={(e) => setFormData(prev => ({ ...prev, hora_llegada: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tripulación (JSON)</label>
              <textarea
                value={JSON.stringify(formData.tripulantes, null, 2)}
                onChange={(e) => {
                  try { setFormData(prev => ({ ...prev, tripulantes: JSON.parse(e.target.value) })); } catch {}
                }}
                rows="2"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0095D4] outline-none font-mono text-sm"
                placeholder='[{"nombre": "Juan", "cedula": "V-123", "cargo": "Patrón"}]'
              />
            </div>

            {/* Capturas */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Capturas</h4>
                <button type="button" onClick={addCaptura} className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  + Agregar Captura
                </button>
              </div>
              {formData.capturas.map((captura, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded-lg">
                  <input
                    type="text"
                    placeholder="Especie"
                    value={captura.especie}
                    onChange={(e) => handleCapturaChange(idx, "especie", e.target.value)}
                    className="flex-1 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={captura.cantidad}
                    onChange={(e) => handleCapturaChange(idx, "cantidad", parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-[#0095D4] outline-none"
                    step="0.01"
                  />
                  <Select
                    options={unidadOptions}
                    value={unidadOptions.find(u => u.value === captura.unidad)}
                    onChange={(selected) => handleCapturaChange(idx, "unidad", selected?.value || "kg")}
                    styles={{ control: (provided: any) => ({ ...provided, borderRadius: "0.75rem", borderWidth: "2px", borderColor: "#E5E7EB", minWidth: "80px" }) }}
                    placeholder="Unidad"
                  />
                  <button type="button" onClick={() => removeCaptura(idx)} className="text-red-500 hover:text-red-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
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
              <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
                {loading ? "Guardando..." : "Registrar Jornada"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JornadaModal;
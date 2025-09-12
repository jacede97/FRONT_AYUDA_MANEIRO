import React, { useState, useEffect } from 'react';
import api from '../../lib/axio';
import Select from 'react-select';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const AdminAyudas = () => {
  const [activeTab, setActiveTab] = useState('institucion'); // Primera pestaña
  const [form, setForm] = useState({ nombre: '', extra: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // === Mapas para nombres de relaciones ===
  const [instituciones, setInstituciones] = useState({});
  const [tiposAyuda, setTiposAyuda] = useState({});
  const [subTiposAyuda, setSubTiposAyuda] = useState({});
  const [data, setData] = useState([]); // Datos principales de la tabla

  // === Efecto para gestionar la visibilidad de los mensajes ===
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000); // Mensaje de éxito visible por 5 segundos
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 7000); // Mensaje de error visible por 7 segundos
      return () => clearTimeout(timer);
    }
  }, [success, error]); // Se ejecuta cada vez que 'success' o 'error' cambian

  // === Cargar relaciones (instituciones, tipos de ayuda, subtipos de ayuda) ===
  useEffect(() => {
    const cargarRelaciones = async () => {
      try {
        // Cargar Instituciones
        const resInstituciones = await api.get('/gestion_ayudas/instituciones/'); // ✅ Prefijo /api/ eliminado
        const institucionesMap = {};
        resInstituciones.data.forEach(inst => {
          institucionesMap[inst.cod_institucion] = inst;
        });
        setInstituciones(institucionesMap);

        // Cargar Tipos de Ayuda
        const resTiposAyuda = await api.get('/gestion_ayudas/tipos/'); // ✅ Prefijo /api/ eliminado
        const tiposAyudaMap = {};
        resTiposAyuda.data.forEach(tipo => {
          tiposAyudaMap[tipo.cod_ayuda] = tipo;
        });
        setTiposAyuda(tiposAyudaMap);

        // Cargar Sub Tipos de Ayuda
        const resSubTiposAyuda = await api.get('/gestion_ayudas/subtipos/'); // ✅ Prefijo /api/ eliminado
        const subTiposAyudaMap = {};
        resSubTiposAyuda.data.forEach(subtipo => {
          subTiposAyudaMap[subtipo.cod_sub_tipo] = subtipo;
        });
        setSubTiposAyuda(subTiposAyudaMap);

      } catch (err) {
        console.error('Error cargando relaciones de ayuda', err);
        setError('Error al cargar las relaciones de ayuda. Verifica el backend.');
      }
    };

    cargarRelaciones();
  }, []);

  // === Cargar datos según la pestaña activa ===
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        let res;
        switch (activeTab) {
          case 'institucion':
            res = await api.get('/gestion_ayudas/instituciones/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
          case 'tipo_ayuda':
            res = await api.get('/gestion_ayudas/tipos/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
          case 'sub_tipo_ayuda':
            res = await api.get('/gestion_ayudas/subtipos/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
          default:
            setData([]);
        }
        setError(''); 
      } catch (err) {
        console.error('Error al cargar datos de ayuda:', err);
        setError('Error al cargar datos de ayuda. Verifica el backend y las dependencias.');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [activeTab, instituciones, tiposAyuda, subTiposAyuda]); // Dependencias para recargar si cambian las relaciones

  // === Manejar cambios en el formulario ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // === Enviar formulario (crear o editar) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!form.nombre.trim()) {
      setError('El nombre es requerido.');
      setLoading(false);
      return;
    }

    // Validación para el campo extra (relación) si no es la pestaña de institución
    if (activeTab !== 'institucion' && !form.extra) {
      setError('Debes seleccionar una relación.');
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        nombre: form.nombre.trim(),
      };

      let endpoint = '';
      let method = 'post';

      // Añadir la relación si no es institución
      if (activeTab === 'tipo_ayuda') {
        payload.institucion = parseInt(form.extra); // Asume que 'extra' es cod_institucion
        endpoint = '/gestion_ayudas/tipos/'; // ✅ Prefijo /api/ eliminado
      } else if (activeTab === 'sub_tipo_ayuda') {
        payload.tipo_ayuda = parseInt(form.extra); // Asume que 'extra' es cod_ayuda
        endpoint = '/gestion_ayudas/subtipos/'; // ✅ Prefijo /api/ eliminado
      } else { // institucion
        endpoint = '/gestion_ayudas/instituciones/'; // ✅ Prefijo /api/ eliminado
      }

      if (editingId) {
        method = 'put';
        endpoint += `${editingId}/`;
      }

      await api[method](endpoint, payload, {
        headers: {
          'X-CSRFToken': cookies.get('csrftoken'),
        },
      });

      setSuccess(`✅ ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')} guardado correctamente.`);
      resetForm();
      refrescarDatos();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = 'Error al procesar.';

      if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
              .map(([key, value]) => {
                  const fieldName = {
                      'cod_institucion': 'Código de la Institución',
                      'cod_ayuda': 'Código del Tipo de Ayuda',
                      'cod_sub_tipo': 'Código del Sub Tipo',
                      'nombre': 'Nombre',
                      'institucion': 'Institución',
                      'tipo_ayuda': 'Tipo de Ayuda',
                  }[key] || key;
                  return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
              })
              .join('; ');
      } else if (typeof errorData === 'string') {
          errorMsg = errorData;
      } else if (err.message) {
          errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // === Editar registro ===
  const handleEdit = (item) => {
    let id = null;
    let relacionId = '';

    if (activeTab === 'institucion') {
      id = item.cod_institucion;
    } else if (activeTab === 'tipo_ayuda') {
      id = item.cod_ayuda;
      relacionId = item.institucion?.toString() || '';
    } else if (activeTab === 'sub_tipo_ayuda') {
      id = item.cod_sub_tipo;
      relacionId = item.tipo_ayuda?.toString() || '';
    }

    setEditingId(id);
    setForm({
      nombre: item.nombre,
      extra: relacionId,
    });
    setError('');
    setSuccess('');
  };

  // === Eliminar registro ===
  const handleDelete = async (id, tipo) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro? Esto eliminará todos los registros dependientes.')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let endpoint = '';
      switch (tipo) {
        case 'institucion': endpoint = `/gestion_ayudas/instituciones/${id}/`; break; // ✅ Prefijo /api/ eliminado
        case 'tipo_ayuda': endpoint = `/gestion_ayudas/tipos/${id}/`; break; // ✅ Prefijo /api/ eliminado
        case 'sub_tipo_ayuda': endpoint = `/gestion_ayudas/subtipos/${id}/`; break; // ✅ Prefijo /api/ eliminado
        default: return;
      }

      await api.delete(endpoint, {
        headers: {
          'X-CSRFToken': cookies.get('csrftoken'),
        },
      });
      setSuccess('✅ Registro eliminado correctamente.');
      refrescarDatos();
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError('Error al eliminar. Puede que haya registros dependientes o un problema de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // === Reiniciar formulario ===
  const resetForm = () => {
    setForm({ nombre: '', extra: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  // === Recargar datos ===
  const refrescarDatos = () => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        let res;
        switch (activeTab) {
          case 'institucion':
            res = await api.get('/gestion_ayudas/instituciones/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
          case 'tipo_ayuda':
            res = await api.get('/gestion_ayudas/tipos/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
          case 'sub_tipo_ayuda':
            res = await api.get('/gestion_ayudas/subtipos/'); // ✅ Prefijo /api/ eliminado
            setData(res.data);
            break;
        }
        setError(''); 
      } catch (err) {
        console.error('Error al recargar datos:', err);
        setError('Error al recargar datos. Podría haber un problema con la API.');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  };

  // === Renderizar campo extra (relación) con búsqueda ===
  const renderExtraField = () => {
    let options = [];
    let label = '';
    let valueKey = '';
    let nameKey = 'nombre'; // Consistente con el backend

    switch (activeTab) {
      case 'institucion':
        return null; // No hay campo extra para institución
      case 'tipo_ayuda':
        options = Object.values(instituciones);
        label = 'Institución';
        valueKey = 'cod_institucion';
        break;
      case 'sub_tipo_ayuda':
        options = Object.values(tiposAyuda);
        label = 'Tipo de Ayuda';
        valueKey = 'cod_ayuda';
        break;
      default:
        return null;
    }

    const selectOptions = options.map(opt => ({
      value: opt[valueKey],
      label: opt[nameKey],
    }));

    const selectedOption = selectOptions.find(opt => opt.value.toString() === form.extra) || null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{label} *</label>
        <Select
          options={selectOptions}
          value={selectedOption}
          onChange={(option) => setForm(prev => ({ ...prev, extra: option?.value?.toString() || '' }))}
          placeholder={`Selecciona ${label.toLowerCase()}`}
          isSearchable={true}
          isClearable={false}
          className="basic-multi-select"
          classNamePrefix="select"
          required
          styles={{
            control: (base) => ({
              ...base,
              borderColor: '#d1d5db',
              '&:hover': { borderColor: '#9ca3af' },
              minHeight: '38px',
            }),
            menu: (base) => ({ ...base, zIndex: 9999 }),
          }}
        />
      </div>
    );
  };

  // === Renderizar tabla ===
  const renderTableContent = () => {
    const headers = {
      institucion: ['Código', 'Nombre'],
      tipo_ayuda: ['Código', 'Nombre', 'Institución'],
      sub_tipo_ayuda: ['Código', 'Nombre', 'Tipo de Ayuda'],
    }[activeTab];

    return (
      <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">
                {h}
              </th>
            ))}
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length + 1} className="py-4 text-center text-gray-500">
                No hay registros.
              </td>
            </tr>
          ) : (
            data.map((item) => {
              let id = null;
              let relacionNombre = '';

              if (activeTab === 'institucion') {
                id = item.cod_institucion;
              } else if (activeTab === 'tipo_ayuda') {
                id = item.cod_ayuda;
                relacionNombre = instituciones[item.institucion]?.nombre || 'Desconocido';
              } else if (activeTab === 'sub_tipo_ayuda') {
                id = item.cod_sub_tipo;
                relacionNombre = tiposAyuda[item.tipo_ayuda]?.nombre || 'Desconocido';
              }

              return (
                <tr key={id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm">{id}</td>
                  <td className="py-2 px-4 text-sm">{item.nombre}</td>
                  {activeTab !== 'institucion' && (
                    <td className="py-2 px-4 text-sm">{relacionNombre}</td>
                  )}
                  <td className="py-2 px-4 border-b text-sm">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:underline mr-3 text-sm flex items-center"
                    >
                      <span className="mr-1">✏️</span> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(id, activeTab)}
                      className="text-red-600 hover:underline text-sm flex items-center"
                    >
                      <span className="mr-1">🗑️</span> Eliminar
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 Administrar Tipos de Ayuda</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 animate-fade-in-down">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200 animate-fade-in-down">
          {success}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-sm">
        {[
          { id: 'institucion', label: 'Instituciones' },
          { id: 'tipo_ayuda', label: 'Tipos de Ayuda' },
          { id: 'sub_tipo_ayuda', label: 'Sub Tipos de Ayuda' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              resetForm();
            }}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } focus:outline-none`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formulario */}
      <div className={`bg-white p-6 rounded-lg shadow mb-6 ${editingId ? 'border-l-4 border-blue-500' : ''}`}>
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
          <span className="mr-2">✏️</span>
          {editingId ? 'Editar' : 'Nuevo'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder={`Nombre de la ${activeTab.replace('_', ' ')}`}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {renderExtraField()}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md font-medium disabled:opacity-70 transition-colors shadow-sm"
            >
              {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-md font-medium transition-colors shadow-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Lista de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}s
        </h3>
        {loading ? (
          <p className="text-center py-4 text-gray-500">Cargando...</p>
        ) : (
          renderTableContent()
        )}
      </div>
    </div>
  );
};

export default AdminAyudas;

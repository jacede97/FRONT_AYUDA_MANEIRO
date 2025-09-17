import React, { useState, useEffect } from 'react';
import api from '../../lib/axio'; // Usa el axio.ts que proporcionaste
import Select from 'react-select';
import Cookies from 'universal-cookie'; // Manténlo por si necesitas cookies en el futuro

const cookies = new Cookies();

const RegistroSelectores = () => {
  const [activeTab, setActiveTab] = useState('bloque');
  const [form, setForm] = useState({ nombre: '', extra: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [parroquias, setParroquias] = useState({});
  const [bloques, setBloques] = useState({});
  const [sectores, setSectores] = useState({});
  const [estructuras, setEstructuras] = useState({});
  const [data, setData] = useState([]);

  // Efecto para gestionar la visibilidad de los mensajes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Cargar relaciones (parroquias, bloques, sectores, estructuras)
  useEffect(() => {
    const cargarRelaciones = async () => {
      try {
        const [resParroquias, resBloques, resSectores, resEstructuras] = await Promise.all([
          api.get('/selectores/parroquias/municipio/4/'), // Filtrado por municipio 4 (Maneiro)
          api.get('/selectores/bloques/'),
          api.get('/selectores/sectores/'),
          api.get('/selectores/estructuras/'),
        ]);

        setParroquias(Object.fromEntries(resParroquias.data.map(p => [p.cod_parroquia, p])));
        setBloques(Object.fromEntries(resBloques.data.map(b => [b.cod_bloque, b])));
        setSectores(Object.fromEntries(resSectores.data.map(s => [s.cod_sector, s])));
        setEstructuras(Object.fromEntries(resEstructuras.data.map(e => [e.cod_estructura, e])));
      } catch (err) {
        console.error('Error cargando relaciones:', err);
        setError(`Error al cargar relaciones: ${err.message || 'Verifica el backend'}`);
      }
    };

    cargarRelaciones();
  }, []);

  // Cargar datos según la pestaña
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        let res;
        switch (activeTab) {
          case 'bloque':
            res = await api.get('/selectores/bloques/');
            setData(res.data); // Temporalmente quita el filtro [9, 10] para pruebas
            break;
          case 'sector':
            res = await api.get('/selectores/sectores/');
            setData(res.data); // Temporalmente quita el filtro [9, 10]
            break;
          case 'estructura':
            if (Object.keys(sectores).length === 0) {
              setError('Sectores no cargados. Verifica las relaciones.');
              break;
            }
            res = await api.get('/selectores/estructuras/');
            setData(res.data);
            break;
          case 'calle':
            if (Object.keys(sectores).length === 0 || Object.keys(estructuras).length === 0) {
              setError('Sectores o estructuras no cargados. Verifica las relaciones.');
              break;
            }
            res = await api.get('/selectores/calles/');
            setData(res.data);
            break;
          default:
            setData([]);
        }
        setError(''); // Limpiar error si la carga es exitosa
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(`Error al cargar datos: ${err.response?.data?.detail || err.message || 'Verifica el backend'}`);
      } finally {
        setLoading(false);
      }
    };

    if (
      activeTab === 'bloque' ||
      activeTab === 'sector' ||
      (activeTab === 'estructura' && Object.keys(sectores).length > 0) ||
      (activeTab === 'calle' && Object.keys(sectores).length > 0 && Object.keys(estructuras).length > 0)
    ) {
      cargarDatos();
    }
  }, [activeTab, sectores, estructuras, bloques]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

    if (!form.extra) {
      setError('Debes seleccionar una relación.');
      setLoading(false);
      return;
    }

    console.log('Datos enviados:', { nombre: form.nombre.trim(), extra: form.extra, activeTab });

    try {
      const payload = {
        nombre: form.nombre.trim(),
        [activeTab === 'bloque' ? 'parroquia' : 
         activeTab === 'sector' ? 'bloque' :
         activeTab === 'estructura' ? 'sector' : 'estructura']: parseInt(form.extra)
      };

      let endpoint = '';
      let method = 'post';

      switch (activeTab) {
        case 'bloque': endpoint = '/selectores/bloques/'; break;
        case 'sector': endpoint = '/selectores/sectores/'; break;
        case 'estructura': endpoint = '/selectores/estructuras/'; break;
        case 'calle': endpoint = '/selectores/calles/'; break;
        default: return;
      }

      if (editingId) {
        method = 'put';
        endpoint += `${editingId}/`;
      }

      const response = await api[method](endpoint, payload);

      setSuccess(`✅ ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} guardado correctamente.`);
      resetForm();
      refrescarDatos();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      const errorData = err.response?.data;
      let errorMsg = 'Error al procesar la solicitud.';
      if (errorData) {
        errorMsg = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    const id = item.cod_bloque || item.cod_sector || item.cod_estructura || item.cod_calle;
    const nombre = item.nombre;

    let relacionId = '';
    switch (activeTab) {
      case 'bloque': relacionId = item.parroquia?.toString() || ''; break;
      case 'sector': relacionId = item.bloque?.toString() || ''; break;
      case 'estructura': relacionId = item.sector?.toString() || ''; break;
      case 'calle': relacionId = item.estructura?.toString() || ''; break;
    }

    setEditingId(id);
    setForm({ nombre, extra: relacionId });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id, tipo) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro? Esto eliminará todos los registros dependientes.')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let endpoint = '';
      switch (tipo) {
        case 'bloque': endpoint = `/selectores/bloques/${id}/`; break;
        case 'sector': endpoint = `/selectores/sectores/${id}/`; break;
        case 'estructura': endpoint = `/selectores/estructuras/${id}/`; break;
        case 'calle': endpoint = `/selectores/calles/${id}/`; break;
        default: return;
      }

      await api.delete(endpoint);
      setSuccess('✅ Registro eliminado correctamente.');
      refrescarDatos();
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError(`Error al eliminar: ${err.response?.data?.detail || err.message || 'Puede que haya registros dependientes o un problema de conexión'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', extra: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const refrescarDatos = () => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        let res;
        switch (activeTab) {
          case 'bloque':
            res = await api.get('/selectores/bloques/');
            setData(res.data);
            break;
          case 'sector':
            res = await api.get('/selectores/sectores/');
            setData(res.data);
            break;
          case 'estructura':
            if (Object.keys(sectores).length === 0) {
              setError('Sectores no cargados. Verifica las relaciones.');
              break;
            }
            res = await api.get('/selectores/estructuras/');
            setData(res.data);
            break;
          case 'calle':
            if (Object.keys(sectores).length === 0 || Object.keys(estructuras).length === 0) {
              setError('Sectores o estructuras no cargados. Verifica las relaciones.');
              break;
            }
            res = await api.get('/selectores/calles/');
            setData(res.data);
            break;
        }
        setError('');
      } catch (err) {
        console.error('Error al recargar datos:', err);
        setError(`Error al recargar datos: ${err.response?.data?.detail || err.message || 'Podría haber un problema con la API'}`);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  };

  const renderExtraField = () => {
    let options = [];
    let label = '';
    let valueKey = '';
    let nameKey = 'nombre';

    switch (activeTab) {
      case 'bloque':
        options = Object.values(parroquias);
        label = 'Parroquia';
        valueKey = 'cod_parroquia';
        nameKey = 'nombre';
        break;
      case 'sector':
        options = Object.values(bloques);
        label = 'Bloque';
        valueKey = 'cod_bloque';
        nameKey = 'nombre';
        break;
      case 'estructura':
        options = Object.values(sectores);
        label = 'Sector';
        valueKey = 'cod_sector';
        nameKey = 'nombre';
        break;
      case 'calle':
        options = Object.values(estructuras);
        label = 'Estructura';
        valueKey = 'cod_estructura';
        nameKey = 'nombre';
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

  const renderTableContent = () => {
    const headers = {
      bloque: ['Código', 'Nombre', 'Parroquia'],
      sector: ['Código', 'Nombre', 'Bloque'],
      estructura: ['Código', 'Nombre', 'Sector'],
      calle: ['Código', 'Nombre', 'Estructura'],
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
                No hay registros. {error && `(${error})`}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const id = item.cod_bloque || item.cod_sector || item.cod_estructura || item.cod_calle;
              const nombre = item.nombre;

              let relacionNombre = '';
              if (activeTab === 'bloque') {
                relacionNombre = parroquias[item.parroquia]?.nombre || 'Desconocido';
              } else if (activeTab === 'sector') {
                relacionNombre = bloques[item.bloque]?.nombre || 'Desconocido';
              } else if (activeTab === 'estructura') {
                relacionNombre = sectores[item.sector]?.nombre || 'Desconocido';
              } else if (activeTab === 'calle') {
                relacionNombre = estructuras[item.estructura]?.nombre || 'Desconocido';
              }

              return (
                <tr key={id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm">{id}</td>
                  <td className="py-2 px-4 text-sm">{nombre}</td>
                  <td className="py-2 px-4 text-sm">{relacionNombre}</td>
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 Administrar Direcciones - MP. MANEIRO</h1>

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
          { id: 'bloque', label: 'Bloques' },
          { id: 'sector', label: 'Sectores' },
          { id: 'estructura', label: 'Estructuras' },
          { id: 'calle', label: 'Calles' },
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
          {editingId ? 'Editar' : 'Nuevo'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder={`Nombre del ${activeTab}`}
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
          Lista de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s
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

export default RegistroSelectores;
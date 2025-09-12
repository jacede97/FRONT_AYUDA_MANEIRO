// components/DireccionSelector/DireccionSelector.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import api from '../../lib/axio';

const DireccionSelector = ({ 
  onDireccionChange, 
  initialValues = {},
  required = true,
  disabled = false,
  showLabels = true
}) => {
  const [niveles, setNiveles] = useState({
    parroquias: [],
    bloques: [],
    sectores: [],
    estructuras: [],
    calles: []
  });

  const [seleccionados, setSeleccionados] = useState({
    parroquia: initialValues.parroquia || null,
    bloque: initialValues.bloque || null,
    sector: initialValues.sector || null,
    estructura: initialValues.estructura || null,
    calle: initialValues.calle || null
  });

  const [cargando, setCargando] = useState({
    parroquias: false,
    bloques: false,
    sectores: false,
    estructuras: false,
    calles: false
  });

  // Notificar cambios al componente padre
  useEffect(() => {
    if (onDireccionChange) {
      onDireccionChange(seleccionados);
    }
  }, [seleccionados, onDireccionChange]);

  // Cargar parroquias al montar el componente
  useEffect(() => {
    cargarParroquias();
  }, []);

  // Función genérica para cargar datos
  const cargarDatos = useCallback(async (endpoint, filtro = null) => {
    try {
      const respuesta = await api.get(endpoint);
      return filtro ? respuesta.data.filter(filtro) : respuesta.data;
    } catch (error) {
      console.error(`Error cargando datos: ${endpoint}`, error);
      return [];
    }
  }, []);

  const cargarParroquias = async () => {
    setCargando(prev => ({ ...prev, parroquias: true }));
    try {
      const datos = await cargarDatos(
        '/selectores/parroquias/municipio/4/',
        p => [9, 10].includes(p.cod_parroquia)
      );
      setNiveles(prev => ({ ...prev, parroquias: datos }));
    } catch (error) {
      console.error('Error cargando parroquias:', error);
    } finally {
      setCargando(prev => ({ ...prev, parroquias: false }));
    }
  };

  const cargarBloques = async (parroquiaId) => {
    if (!parroquiaId) return;
    
    setCargando(prev => ({ ...prev, bloques: true }));
    try {
      const datos = await cargarDatos(
        '/selectores/bloques/',
        b => b.parroquia === parseInt(parroquiaId)
      );
      setNiveles(prev => ({ ...prev, bloques: datos }));
    } catch (error) {
      console.error('Error cargando bloques:', error);
    } finally {
      setCargando(prev => ({ ...prev, bloques: false }));
    }
  };

  const cargarSectores = async (bloqueId) => {
    if (!bloqueId) return;
    
    setCargando(prev => ({ ...prev, sectores: true }));
    try {
      const datos = await cargarDatos(
        '/selectores/sectores/',
        s => s.bloque === parseInt(bloqueId)
      );
      setNiveles(prev => ({ ...prev, sectores: datos }));
    } catch (error) {
      console.error('Error cargando sectores:', error);
    } finally {
      setCargando(prev => ({ ...prev, sectores: false }));
    }
  };

  const cargarEstructuras = async (sectorId) => {
    if (!sectorId) return;
    
    setCargando(prev => ({ ...prev, estructuras: true }));
    try {
      const datos = await cargarDatos(
        '/selectores/estructuras/',
        e => e.sector === parseInt(sectorId)
      );
      setNiveles(prev => ({ ...prev, estructuras: datos }));
    } catch (error) {
      console.error('Error cargando estructuras:', error);
    } finally {
      setCargando(prev => ({ ...prev, estructuras: false }));
    }
  };

  const cargarCalles = async (estructuraId) => {
    if (!estructuraId) return;
    
    setCargando(prev => ({ ...prev, calles: true }));
    try {
      const datos = await cargarDatos(
        '/selectores/calles/',
        c => c.estructura === parseInt(estructuraId)
      );
      setNiveles(prev => ({ ...prev, calles: datos }));
    } catch (error) {
      console.error('Error cargando calles:', error);
    } finally {
      setCargando(prev => ({ ...prev, calles: false }));
    }
  };

  const manejarCambio = async (nivel, valor) => {
    const nuevoSeleccionado = { ...seleccionados };
    
    // Resetear niveles inferiores
    const nivelesParaResetear = {
      parroquia: ['bloque', 'sector', 'estructura', 'calle'],
      bloque: ['sector', 'estructura', 'calle'],
      sector: ['estructura', 'calle'],
      estructura: ['calle'],
      calle: []
    };

    nivelesParaResetear[nivel].forEach(n => {
      nuevoSeleccionado[n] = null;
    });

    nuevoSeleccionado[nivel] = valor;
    setSeleccionados(nuevoSeleccionado);

    // Cargar siguiente nivel
    const cargas = {
      parroquia: () => cargarBloques(valor?.value),
      bloque: () => cargarSectores(valor?.value),
      sector: () => cargarEstructuras(valor?.value),
      estructura: () => cargarCalles(valor?.value)
    };

    if (cargas[nivel] && valor) {
      await cargas[nivel]();
    }
  };

  const SelectorNivel = ({ 
    nivel, 
    label, 
    opciones, 
    valor, 
    disabledCondition,
    loading 
  }) => (
    <div>
      {showLabels && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <Select
        options={opciones.map(item => ({ 
          value: item[`cod_${nivel}`], 
          label: item.nombre 
        }))}
        value={valor}
        onChange={(option) => manejarCambio(nivel, option)}
        placeholder={`Seleccione ${label.toLowerCase()}`}
        isClearable={!required}
        isDisabled={disabled || disabledCondition || loading}
        isLoading={loading}
        loadingMessage={() => `Cargando ${label.toLowerCase()}...`}
        noOptionsMessage={() => `No hay ${label.toLowerCase()}s disponibles`}
        className="basic-select"
        classNamePrefix="select"
        required={required}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: '#d1d5db',
            '&:hover': { borderColor: '#9ca3af' },
            minHeight: '42px',
          }),
          menu: (base) => ({ ...base, zIndex: 10 }),
        }}
      />
    </div>
  );

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {showLabels && (
        <h3 className="text-lg font-semibold text-gray-800">Dirección</h3>
      )}
      
      <SelectorNivel
        nivel="parroquia"
        label="Parroquia"
        opciones={niveles.parroquias}
        valor={seleccionados.parroquia}
        loading={cargando.parroquias}
        disabledCondition={disabled}
      />

      <SelectorNivel
        nivel="bloque"
        label="Bloque"
        opciones={niveles.bloques}
        valor={seleccionados.bloque}
        loading={cargando.bloques}
        disabledCondition={!seleccionados.parroquia}
      />

      <SelectorNivel
        nivel="sector"
        label="Sector"
        opciones={niveles.sectores}
        valor={seleccionados.sector}
        loading={cargando.sectores}
        disabledCondition={!seleccionados.bloque}
      />

      <SelectorNivel
        nivel="estructura"
        label="Estructura"
        opciones={niveles.estructuras}
        valor={seleccionados.estructura}
        loading={cargando.estructuras}
        disabledCondition={!seleccionados.sector}
      />

      <SelectorNivel
        nivel="calle"
        label="Calle"
        opciones={niveles.calles}
        valor={seleccionados.calle}
        loading={cargando.calles}
        disabledCondition={!seleccionados.estructura}
      />
    </div>
  );
};

export default DireccionSelector;
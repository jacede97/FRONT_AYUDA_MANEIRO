// src/components/RegistroUsuario/RegistroUsuario.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/axio.tsx';

const ROLES = [
  { value: 'basico', label: 'Usuario Básico', color: 'gray' },
  { value: 'consultor', label: 'Consultor', color: 'indigo' },
  { value: 'recepcion', label: 'Recepción', color: 'green' },
  { value: 'seguimiento', label: 'Seguimiento', color: 'yellow' },
  { value: 'auditor', label: 'Auditor', color: 'red' },
  { value: 'supervisor', label: 'Supervisor', color: 'blue' },
  { value: 'admin', label: 'Administrador', color: 'purple' },
];

const RegistroUsuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [instituciones, setInstituciones] = useState([]); // Lista de nombres de instituciones
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });

  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    username: '',
    role: 'basico',
    is_active: true,
    institucion: '',    // Almacenará el nombre de la institución (texto)
    departamento: '',   // Almacenará el nombre del departamento (texto)
    password: '',
    confirmPassword: '',
  });

  // ============================================================
  // CARGA DE INSTITUCIONES (solo los nombres)
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Usuarios
        const usuariosRes = await api.get('/auth/usuarios/');
        setUsuarios(usuariosRes.data || []);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Redirigiendo...');
          setTimeout(() => window.location.href = '/', 2000);
        } else {
          setError('Error al cargar usuarios.');
        }
      }

      // 2. Instituciones - Obtener solo los nombres para el select
      try {
        const response = await api.get('/gestion_ayudas/ayudas-completas/');
        console.log('📦 Instituciones desde ayudas-completas:', response.data);
        
        // Extraer los nombres de las instituciones (como strings)
        const instNames = response.data.map((item) => item.nombre).sort();
        setInstituciones(instNames);
        
      } catch (err) {
        console.warn('No se pudieron cargar instituciones:', err);
        setInstituciones([]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // ============================================================
  // ABRIR MODAL (editar o nuevo)
  // ============================================================
  const openModal = (usuario = null) => {
    if (usuario) {
      setEditing(usuario);
      setForm({
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        username: usuario.username,
        role: usuario.role,
        is_active: usuario.is_active,
        institucion: usuario.institucion || '',  // Ya es texto
        departamento: usuario.departamento || '', // Ya es texto
        password: '',
        confirmPassword: '',
      });
    } else {
      setEditing(null);
      setForm({
        cedula: '',
        nombre: '',
        username: '',
        role: 'basico',
        is_active: true,
        institucion: '',
        departamento: '',
        password: '',
        confirmPassword: '',
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  // ============================================================
  // CAMBIAR CONTRASEÑA
  // ============================================================
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (passwordData.new.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await api.put(`/auth/usuarios/${editing.cedula}/`, { password: passwordData.new });
      setShowPasswordModal(false);
      setPasswordData({ new: '', confirm: '' });
      alert('Contraseña actualizada correctamente.');
    } catch (err) {
      setError(err.response?.data?.password?.[0] || 'Error al cambiar contraseña');
    }
  };

  // ============================================================
  // SUBMIT (crear / editar usuario)
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validaciones
    if (!/^\d{6,20}$/.test(form.cedula)) {
      setError('Cédula: 6-20 dígitos numéricos');
      setSubmitting(false);
      return;
    }
    if (!form.nombre.trim()) {
      setError('Nombre obligatorio');
      setSubmitting(false);
      return;
    }
    if (!/^[\w.@+-]+$/.test(form.username)) {
      setError('Username inválido (solo letras, números, puntos, guiones)');
      setSubmitting(false);
      return;
    }
    if (!editing && form.password.length < 6) {
      setError('Contraseña ≥ 6 caracteres');
      setSubmitting(false);
      return;
    }
    if (!editing && form.password !== form.confirmPassword) {
      setError('Contraseñas no coinciden');
      setSubmitting(false);
      return;
    }

    // Construir payload con campos de texto
    const payload = {
      cedula: form.cedula,
      nombre: form.nombre,
      username: form.username,
      role: form.role,
      is_active: form.is_active,
      institucion: form.institucion || '',     // Texto
      departamento: form.departamento || '',   // Texto
      ...(form.password && { password: form.password }),
    };

    try {
      let response;
      if (editing) {
        response = await api.put(`/auth/usuarios/${form.cedula}/`, payload);
        setUsuarios(usuarios.map(u => u.cedula === form.cedula ? response.data : u));
      } else {
        response = await api.post('/auth/usuarios/', payload);
        setUsuarios([...usuarios, response.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : err.message;
      setError(errorMsg || 'Error al guardar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // TOGGLE ESTADO / ELIMINAR
  // ============================================================
  const toggleEstado = async (cedula) => {
    try {
      const user = usuarios.find(u => u.cedula === cedula);
      await api.put(`/auth/usuarios/${cedula}/`, { is_active: !user.is_active });
      setUsuarios(usuarios.map(u => u.cedula === cedula ? { ...u, is_active: !u.is_active } : u));
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const eliminarUsuario = async (cedula) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/auth/usuarios/${cedula}/`);
      setUsuarios(usuarios.filter(u => u.cedula !== cedula));
    } catch {
      setError('Error al eliminar');
    }
  };

  // ============================================================
  // FILTRAR USUARIOS
  // ============================================================
  const filtered = usuarios.filter(u =>
    u.cedula?.includes(searchTerm) ||
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.institucion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.departamento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full"></div>
        <p className="mt-2 text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
        >
          + Nuevo Usuario
        </button>
        <input
          type="text"
          placeholder="Buscar por cédula, nombre, usuario, institución o departamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cédula</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Institución</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">No hay usuarios</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.cedula} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{u.cedula}</td>
                  <td className="px-4 py-3 text-sm">{u.nombre}</td>
                  <td className="px-4 py-3 text-sm">{u.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium bg-${
                        ROLES.find((r) => r.value === u.role)?.color || 'gray'
                      }-100 text-${
                        ROLES.find((r) => r.value === u.role)?.color || 'gray'
                      }-800`}
                    >
                      {ROLES.find((r) => r.value === u.role)?.label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{u.institucion || '-'}</td>
                  <td className="px-4 py-3 text-sm">{u.departamento || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEstado(u.cedula)}
                      className={`px-3 py-1 rounded-full text-xs ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-3">
                    <button onClick={() => openModal(u)} className="text-blue-600 hover:underline">
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setEditing(u);
                        setShowPasswordModal(true);
                      }}
                      className="text-orange-600 hover:underline"
                    >
                      Contraseña
                    </button>
                    <button onClick={() => eliminarUsuario(u.cedula)} className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================
          MODAL PRINCIPAL (Crear / Editar)
          ============================================================ */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cédula */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Cédula *</label>
                    <input
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      disabled={!!editing}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="12345678"
                    />
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                    <input
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuario *</label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="juan.perez"
                    />
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INSTITUCIÓN - Select con nombres */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Institución</label>
                    <select
                      value={form.institucion}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, institucion: val });
                        console.log('🏛️ Institución seleccionada:', val);
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Sin institución</option>
                      {instituciones.length === 0 && (
                        <option value="" disabled>No hay instituciones disponibles</option>
                      )}
                      {instituciones.map((nombre) => (
                        <option key={nombre} value={nombre}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                    {instituciones.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ No se cargaron instituciones. Verifica el backend.</p>
                    )}
                  </div>

                  {/* DEPARTAMENTO - Campo de texto libre */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Departamento</label>
                    <input
                      type="text"
                      value={form.departamento}
                      onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: Recepción, Ventas, etc."
                    />
                  </div>

                  {/* Contraseña (solo si es nuevo) */}
                  {!editing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contraseña *</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Confirmar *</label>
                        <input
                          type="password"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label>Usuario activo</label>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
                  >
                    {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL CAMBIAR CONTRASEÑA
          ============================================================ */}
      {showPasswordModal && editing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Confirmar"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Cambiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroUsuario;
// src/components/RegistroUsuario/RegistroUsuario.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/axio.tsx'; // ✅ Usa tu instancia de axios

const RegistroUsuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    username: '',
    role: 'basico', // ← Valor por defecto
    is_active: true,
    password: '',
    confirmPassword: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // === CARGAR USUARIOS ===
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/auth/usuarios/');
        setUsuarios(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor inicia sesión nuevamente.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        } else {
          setError('Error al cargar usuarios. ¿Está corriendo el backend?');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // === ABRIR MODAL ===
  const openModal = (usuario) => {
    if (usuario) {
      setEditing(usuario);
      setForm({
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        username: usuario.username,
        role: usuario.role,
        is_active: usuario.is_active,
        password: '',
        confirmPassword: '',
      });
    } else {
      setEditing(null);
      setForm({
        cedula: '',
        nombre: '',
        username: '',
        role: 'basico', // ← Nuevo usuario empieza como básico
        is_active: true,
        password: '',
        confirmPassword: '',
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  // === MANEJAR SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validaciones
    if (!form.cedula || !/^\d{6,20}$/.test(form.cedula)) {
      setError('Cédula inválida: solo números, entre 6 y 20 dígitos.');
      setSubmitting(false);
      return;
    }
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      setSubmitting(false);
      return;
    }
    if (!form.username || !/^[\w.@+-]+$/.test(form.username)) {
      setError('Username inválido: solo letras, números y . _ @ + -');
      setSubmitting(false);
      return;
    }
    if (!editing && (!form.password || form.password.length < 6)) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setSubmitting(false);
      return;
    }
    if (!editing && form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setSubmitting(false);
      return;
    }

    try {
      const userData = {
        cedula: form.cedula,
        nombre: form.nombre,
        username: form.username,
        role: form.role,
        is_active: form.is_active,
        ...(form.password && { password: form.password }),
      };

      let response;
      if (editing) {
        response = await api.put(`/auth/usuarios/${form.cedula}/`, userData);
      } else {
        response = await api.post('/auth/usuarios/', userData);
      }

      if (editing) {
        setUsuarios(usuarios.map(u => 
          u.cedula === form.cedula ? { ...u, ...form } : u
        ));
      } else {
        setUsuarios([...usuarios, response.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(' '));
      } else {
        setError('Error al guardar el usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // === TOGGLE ESTADO ===
  const toggleEstado = async (cedula) => {
    const user = usuarios.find(u => u.cedula === cedula);
    if (!user) return;

    const updatedUser = {
      ...user,
      is_active: !user.is_active
    };

    try {
      await api.put(`/auth/usuarios/${cedula}/`, updatedUser);
      setUsuarios(usuarios.map(u => 
        u.cedula === cedula ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (err) {
      setError('Error al actualizar el estado del usuario');
    }
  };

  // === ELIMINAR USUARIO ===
  const eliminarUsuario = async (cedula) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await api.delete(`/auth/usuarios/${cedula}/`);
      setUsuarios(usuarios.filter(u => u.cedula !== cedula));
    } catch (err) {
      setError('Error al eliminar el usuario');
    }
  };

  // === FILTRAR USUARIOS ===
  const filteredUsuarios = usuarios.filter((u) =>
    u.cedula.includes(searchTerm) ||
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === RENDERIZADO ===
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 Gestión de Usuarios</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition flex items-center gap-2"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por cédula, nombre o username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Cédula</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Username</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Fecha Registro</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((u) => (
                <tr key={u.cedula} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{u.cedula}</td>
                  <td className="py-3 px-4 text-sm">{u.nombre}</td>
                  <td className="py-3 px-4 text-sm">{u.username}</td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'supervisor'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'recepcion'
                          ? 'bg-green-100 text-green-800'
                          : u.role === 'auditor'
                          ? 'bg-red-100 text-red-800'
                          : u.role === 'seguimiento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : u.role === 'consultor'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.role === 'admin' && 'Administrador'}
                      {u.role === 'supervisor' && 'Supervisor'}
                      {u.role === 'recepcion' && 'Recepción'}
                      {u.role === 'consultor' && 'Consultor'}
                      {u.role === 'seguimiento' && 'Seguimiento'}
                      {u.role === 'auditor' && 'Auditor'}
                      {u.role === 'basico' && 'Usuario Básico'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => toggleEstado(u.cedula)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm space-x-2">
                    <button
                      onClick={() => openModal(u)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarUsuario(u.cedula)}
                      className="text-red-600 hover:underline text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cédula *</label>
                    <input
                      type="text"
                      name="cedula"
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      placeholder="12345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!editing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Usuario *</label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="usuario123"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basico">Usuario Básico</option>
                      <option value="consultor">Consultor</option>
                      <option value="recepcion">Recepción</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="auditor">Auditor</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {!editing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
                        <input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña *</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="mr-2 h-4 w-4"
                  />
                  <label className="text-sm text-gray-700">Usuario Activo</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition text-sm font-medium"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroUsuario;
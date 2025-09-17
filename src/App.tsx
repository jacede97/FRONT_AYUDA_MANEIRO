import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importa tus componentes
import Login from "./components/Login";
import Dashboard from "./components/dashboard/dashboard";
import Menu from "./layout/Menu";
import Header from "./layout/Header";
import ReportesAyudas from "./components/report/ReportesAyudas";
import Beneficiarios from "./components/beneficiarios/beneficiarios";
import RegistroUsuario from "./components/RegistroUsuario/RegistroUsuario";
import RegistroSelectores from "./components/selectores/RegistroSelectores";
import AdminAyudas from "./components/RegistroTiposAyudas/tipos_de_ayudas";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access_token"));

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  // Obtener el rol desde localStorage
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const userRole = user.role || "basico"; // Valor por defecto según tu modelo

  // Componente para proteger rutas según rol
  const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />; // Redirige a dashboard si no tiene acceso
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      {/* Contenedor para Login cuando no está autenticado */}
      {!isLoggedIn ? (
        <div className="h-screen">
          <Routes>
            <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      ) : (
        // Diseño para usuarios autenticados
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header toggleMenu={() => {}} />

          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row h-full">
              <Menu
                isMenuOpen={true} // Ajusta según tu estado
                toggleMenu={() => {}}
                handleLogout={handleLogout}
                userRole={userRole}
              />

              {isLoggedIn && <div className="w-px bg-gray-200 hidden lg:block"></div>}

              <div className="flex-1 overflow-auto p-4">
                <Routes>
                  {/* Dashboard accesible por todos los roles */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "recepcion", "seguimiento", "consultor", "supervisor", "auditor", "basico"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* Reportes para admin, seguimiento y consultor */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "seguimiento", "consultor"]}>
                        <ReportesAyudas />
                      </ProtectedRoute>
                    }
                  />
                  {/* Beneficiarios para admin y consultor */}
                  <Route
                    path="/beneficiarios"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "consultor"]}>
                        <Beneficiarios />
                      </ProtectedRoute>
                    }
                  />
                  {/* Selectores solo para admin */}
                  <Route
                    path="/selectores"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <RegistroSelectores />
                      </ProtectedRoute>
                    }
                  />
                  {/* Admin Ayudas solo para admin */}
                  <Route
                    path="/adminAyudas"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminAyudas />
                      </ProtectedRoute>
                    }
                  />
                  {/* Registro de Usuarios solo para admin */}
                  <Route
                    path="/usuario"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <RegistroUsuario />
                      </ProtectedRoute>
                    }
                  />
                  {/* Configuración solo para admin */}
                  <Route
                    path="/configuracion"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <div className="p-6 bg-white rounded-xl shadow-lg">
                          <h2 className="text-2xl font-semibold text-[#003366] mb-4">
                            Configuración de la Aplicación
                          </h2>
                          <p className="text-gray-700">Aquí irá la configuración del sistema.</p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/dashboard/dashboard";
import Header from "./layout/Header";
import Menu from "./layout/Menu";
import ReportesAyudas from "./components/report/ReportesAyudas";
import Beneficiarios from "./components/beneficiarios/beneficiarios";
import RegistroUsuario from "./components/RegistroUsuario/RegistroUsuario";
import RegistroSelectores from "./components/selectores/RegistroSelectores";
import AdminAyudas from "./components/RegistroTiposAyudas/tipos_de_ayudas";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, user, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-bold text-gray-700">
        Cargando...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.role || "basico";
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const MainContent = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const userRole = user?.role || "basico";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} userRole={userRole} toggleMenu={toggleMenu} isMenuOpen={isMenuOpen} />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row h-full">
          <Menu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} handleLogout={logout} userRole={userRole} />
          <div className="flex-1 overflow-auto p-4 lg:ml-4">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin", "recepcion", "seguimiento", "consultor", "supervisor", "auditor", "basico"]}><Dashboard /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "seguimiento", "consultor"]}><ReportesAyudas /></ProtectedRoute>} />
              <Route path="/beneficiarios" element={<ProtectedRoute allowedRoles={["admin", "consultor", "recepcion"]}><Beneficiarios /></ProtectedRoute>} /> {/* Añadido "recepcion" */}
              <Route path="/selectores" element={<ProtectedRoute allowedRoles={["admin"]}><RegistroSelectores /></ProtectedRoute>} />
              <Route path="/adminAyudas" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAyudas /></ProtectedRoute>} />
              <Route path="/usuario" element={<ProtectedRoute allowedRoles={["admin"]}><RegistroUsuario /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute allowedRoles={["admin"]}>
                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <h2 className="text-2xl font-semibold text-[#003366] mb-4">Configuración de la Aplicación</h2>
                  <p className="text-gray-700">Aquí irá la configuración del sistema.</p>
                </div>
              </ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
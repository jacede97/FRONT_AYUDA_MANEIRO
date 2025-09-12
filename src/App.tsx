import React, { useState } from "react";

// Importa tus componentes
import Login from "./components/Login";
import Dashboard from "./components/dashboard/dashboard";
import Menu from "./layout/Menu";
import Header from "./layout/Header";
import ReportesAyudas from "./components/report/ReportesAyudas";
import Beneficiarios from "./components/beneficiarios/beneficiarios"; // Corregido: PascalCase
import RegistroUsuario from "./components/RegistroUsuario/RegistroUsuario"; // Usamos este (panel completo)
import RegistroSelectores from "./components/selectores/RegistroSelectores"; // Usamos este (panel completo)
import AdminAyudas from "./components/RegistroTiposAyudas/tipos_de_ayudas"; // ✅ Importado el nuevo componente

// Si tienes Configuracion, descomenta:
// import Configuracion from "./components/Configuracion";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    // Opcional: limpiar tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    setIsLoggedIn(false);
    setCurrentView("dashboard");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "beneficiarios":
        return <Beneficiarios />;
      case "reports":
        return <ReportesAyudas />;
      case "selectores": // Coincide con el botón del menú
        return <RegistroSelectores />; // Muestra el panel de gestión de selectores
      case "adminAyudas": // ✅ Nuevo caso para el componente AdminAyudas
        return <AdminAyudas />;
      case "usuario": // Coincide con el botón del menú
        return <RegistroUsuario />; // Muestra el panel de gestión de usuarios
      case "configuracion":
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              Configuración de la Aplicación
            </h2>
            <p className="text-gray-700">
              Aquí irá la configuración del sistema.
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Si no está logueado, muestra el login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header toggleMenu={toggleMenu} />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row h-full">
          {/* Menú lateral */}
          <Menu
            isMenuOpen={isMenuOpen}
            toggleMenu={toggleMenu}
            handleLogout={handleLogout}
            setCurrentView={setCurrentView}
            currentView={currentView}
          />

          {/* Separador visible en pantallas grandes */}
          <div className="w-px bg-gray-200 hidden lg:block"></div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-auto p-4">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

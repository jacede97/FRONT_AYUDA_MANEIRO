import React, { useState } from "react";
// Importa tus componentes existentes
import Login from "./components/Login"; // Tu componente de Login
import Dashboard from "./components/dashboard/dashboard"; // Tu componente de Dashboard
import Menu from "./layout/Menu"; // Tu componente de Menú
import Header from "./layout/Header"; // Tu componente de Header
import ReportesAyudas from "./components/report/ReportesAyudas";
import beneficiarios from "./components/beneficiarios/beneficiarios";
import RegistroSelectores from "./components/selectores/RegistroSelectores"; // <--- ¡ESTA ES LA LÍNEA QUE DEBES AJUSTAR!

// Si tienes un componente para Configuracion, impórtalo también
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
        return <beneficiarios />;
      case "reports":
        return <ReportesAyudas />;
      case "selectores": // ← Nuevo
        return <RegistroSelectores />;
      case "configuracion":
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              Configuración de la Aplicación
            </h2>
            <p className="text-gray-700">
             
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header toggleMenu={toggleMenu} />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row h-full">
          <Menu
            isMenuOpen={isMenuOpen}
            toggleMenu={toggleMenu}
            handleLogout={handleLogout}
            setCurrentView={setCurrentView}
            currentView={currentView}
          />

          <div className="w-px bg-gray-200 hidden lg:block"></div>

          <div className="flex-1 overflow-auto p-4">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default App;

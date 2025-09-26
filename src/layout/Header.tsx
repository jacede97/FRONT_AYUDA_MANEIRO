import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

interface HeaderProps {
  user: any;
  userRole: string;
  toggleMenu: () => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, userRole, toggleMenu, isMenuOpen }) => {
  const { logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const getNavLinkClasses = ({ isActive }) => {
    return `px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? "bg-blue-200 text-blue-800"
        : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
    }`;
  };

  const isReceptionUser = userRole === "recepcion";
  const isBasicUser = userRole === "basico";

  return (
    <header className="bg-white shadow-md border-b-4" style={{ borderColor: "#008fce" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="mr-4 p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none sm:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
            <img
              src="/LOGO.png"
              alt="Logo de la Aplicación"
              className="h-8 w-auto mr-3"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/40x40/cccccc/ffffff?text=LOGO";
                e.currentTarget.onerror = null;
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Alcaldía de Maneiro</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Sistema de Gestión de Ayudas</p>
            </div>
          </div>
          <div className="flex items-center">
            <nav className="hidden sm:flex space-x-4">
              {/* Empty on desktop, as vertical menu takes over */}
            </nav>
            <div className="sm:hidden">
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-50">
                  <NavLink
                    to="/dashboard"
                    className={getNavLinkClasses + " block px-4 py-2"}
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </NavLink>
                  {!isReceptionUser &&
                    !isBasicUser &&
                    (userRole === "admin" || userRole === "seguimiento" || userRole === "consultor") && (
                      <NavLink
                        to="/reports"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Reportes
                      </NavLink>
                    )}
                  {!isReceptionUser &&
                    !isBasicUser &&
                    (userRole === "admin" || userRole === "consultor") && (
                      <NavLink
                        to="/beneficiarios"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Beneficiarios
                      </NavLink>
                    )}
                  {userRole === "admin" && (
                    <>
                      <NavLink
                        to="/selectores"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Registro de Selectores
                      </NavLink>
                      <NavLink
                        to="/adminAyudas"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Registro de Tipos de Ayuda
                      </NavLink>
                      <NavLink
                        to="/usuario"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Registro de Usuario
                      </NavLink>
                      <NavLink
                        to="/configuracion"
                        className={getNavLinkClasses + " block px-4 py-2"}
                        onClick={toggleMenu}
                      >
                        Configuración
                      </NavLink>
                    </>
                  )}
                </div>
              )}
            </div>
            {user && (
              <div className="flex items-center space-x-3 ml-4">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-gray-800 hidden sm:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-800 font-medium truncate max-w-[120px] hidden sm:block text-sm">
                    {user.nombre}
                  </span>
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-[#0069B6] font-bold text-xs sm:hidden">
                    {getInitials(user.nombre)}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-gray-800 hover:bg-gray-100 transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
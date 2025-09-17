import React from "react";
import { NavLink } from "react-router-dom";

interface MenuProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  handleLogout: () => void;
  userRole: string;
}

const Menu: React.FC<MenuProps> = ({ isMenuOpen, toggleMenu, handleLogout, userRole }) => {
  const isReceptionUser = userRole === "recepcion";
  const isBasicUser = userRole === "basico";
  const isSeguimientoUser = userRole === "seguimiento";
  const isConsultorUser = userRole === "consultor";

  const getExpandedButtonClasses = ({ isActive }) => {
    const baseClasses = "flex items-center px-3 py-2 rounded-lg font-medium w-full text-left transition-colors";
    const activeClasses = "bg-blue-200 text-blue-800";
    const inactiveClasses = "text-black hover:bg-blue-100 hover:text-blue-700";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getCollapsedButtonClasses = ({ isActive }) => {
    const baseClasses = "p-2 rounded-lg transition-colors";
    const activeClasses = "bg-blue-200 text-blue-800";
    const inactiveClasses = "text-gray-600 hover:bg-gray-200";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <div
      className={`${
        isMenuOpen ? "w-48" : "w-16"
      } bg-white border border-gray-400 text-black transition-all duration-300 ease-in-out flex flex-col shadow-lg rounded-xl m-4`}
    >
      <div className="p-2 border-b border-gray-300">
        <button
          onClick={toggleMenu}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMenuOpen ? (
            <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 transform rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex items-center justify-center mb-6 py-2">
            <img
              src="/LOGO.png"
              alt="Logo de la Aplicación"
              className="h-12 w-auto mx-auto"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/48x48/e2e8f0/000000?text=LOGO";
                e.currentTarget.onerror = null;
              }}
            />
          </div>
          <nav className="space-y-2">
            {/* Dashboard para todos */}
            <NavLink to="/dashboard" className={getExpandedButtonClasses}>
              {({ isActive }) => (
                <>
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>
            {/* Reportes para admin, seguimiento y consultor */}
            {!isReceptionUser && !isBasicUser && (userRole === "admin" || userRole === "seguimiento" || userRole === "consultor") && (
              <NavLink to="/reports" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Reportes</span>
                  </>
                )}
              </NavLink>
            )}
            {/* Beneficiarios para admin y consultor */}
            {!isReceptionUser && !isBasicUser && (userRole === "admin" || userRole === "consultor") && (
              <NavLink to="/beneficiarios" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Beneficiarios</span>
                  </>
                )}
              </NavLink>
            )}
            {/* Selectores solo para admin */}
            {userRole === "admin" && (
              <NavLink to="/selectores" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Registro de Selectores</span>
                  </>
                )}
              </NavLink>
            )}
            {/* Admin Ayudas solo para admin */}
            {userRole === "admin" && (
              <NavLink to="/adminAyudas" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 3h3m-6 3h6" />
                    </svg>
                    <span>Registro de Tipos de Ayuda</span>
                  </>
                )}
              </NavLink>
            )}
            {/* Registro de Usuarios solo para admin */}
            {userRole === "admin" && (
              <NavLink to="/usuario" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Registro de Usuario</span>
                  </>
                )}
              </NavLink>
            )}
            {/* Configuración solo para admin */}
            {userRole === "admin" && (
              <NavLink to="/configuracion" className={getExpandedButtonClasses}>
                {({ isActive }) => (
                  <>
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Configuración</span>
                  </>
                )}
              </NavLink>
            )}
            <div className="border-t border-gray-300 mt-4 pt-4">
              <button onClick={handleLogout} className="flex items-center px-3 py-2 text-black hover:bg-blue-100 hover:text-blue-700 rounded-lg font-medium w-full text-left">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </div>
      ) : (
        <div className="p-4 flex-grow flex flex-col items-center">
          <div className="flex-grow flex flex-col items-center space-y-4">
            <NavLink to="/dashboard" className={getCollapsedButtonClasses} title="Dashboard">
              {({ isActive }) => (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
            </NavLink>
            {!isReceptionUser && !isBasicUser && (userRole === "admin" || userRole === "seguimiento" || userRole === "consultor") && (
              <NavLink to="/reports" className={getCollapsedButtonClasses} title="Reportes">
                {({ isActive }) => (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </NavLink>
            )}
            {!isReceptionUser && !isBasicUser && (userRole === "admin" || userRole === "consultor") && (
              <NavLink to="/beneficiarios" className={getCollapsedButtonClasses} title="Beneficiarios">
                {({ isActive }) => (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </NavLink>
            )}
            {userRole === "admin" && (
              <>
                <NavLink to="/selectores" className={getCollapsedButtonClasses} title="Registro de Selectores">
                  {({ isActive }) => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </NavLink>
                <NavLink to="/adminAyudas" className={getCollapsedButtonClasses} title="Registro de Tipos de Ayuda">
                  {({ isActive }) => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 3h3m-6 3h6" />
                    </svg>
                  )}
                </NavLink>
                <NavLink to="/usuario" className={getCollapsedButtonClasses} title="Registro de Usuario">
                  {({ isActive }) => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </NavLink>
                <NavLink to="/configuracion" className={getCollapsedButtonClasses} title="Configuración">
                  {({ isActive }) => (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </NavLink>
              </>
            )}
            <div className="border-t border-gray-300 mt-4 pt-4 w-full flex justify-center">
              <button onClick={handleLogout} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Cerrar Sesión">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
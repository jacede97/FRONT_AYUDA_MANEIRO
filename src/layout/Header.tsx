import React from "react";
import { useAuth } from "../context/AuthContext";
// Ya no necesitamos NavLink aquí, ya que el menú se mueve a Menu.tsx

// AÑADE onMenuToggle a las props
const Header = ({ user, userRole, onMenuToggle }) => {
  const { logout } = useAuth();
  
  // Eliminamos: const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Eliminamos: const toggleMenu = () => { ... };
  // Eliminamos: getButtonClasses

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <header
      className="bg-white shadow-lg border-b-4"
      style={{ borderColor: "#008fce" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre de la aplicación a la izquierda */}
          <div className="flex items-center">
            
            {/* Botón del menú de hamburguesa solo para móviles (Llama a la prop) */}
            <button
              onClick={onMenuToggle} // << LLAMA A LA FUNCIÓN PASADA POR PROP
              className="mr-4 p-2 rounded-lg transition-colors lg:hidden hover:bg-blue-100 hover:text-[#0069B6]"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <img
              src="/LOGO.png"
              alt="Logo de la Aplicación"
              className="h-10 w-auto mr-3 block"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/40x40/cccccc/ffffff?text=LOGO";
                e.currentTarget.onerror = null;
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Alcaldía de Maneiro
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Sistema de Gestión de Ayudas
              </p>
            </div>
          </div>
          
          {/* Sección de usuario a la derecha (Sin cambios) */}
          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-gray-800 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-800 font-medium truncate max-w-[150px] hidden sm:block">
                  {user.nombre}
                </span>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-[#0069B6] font-bold text-sm sm:hidden">
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

      {/* Eliminamos el menú horizontal desplegable para móviles. Ahora lo gestiona Menu.tsx */}
      {/* ¡NO TOCAR ESTA SECCIÓN DEL CÓDIGO! */}
      {/* <div
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-96 opacity-100 py-4" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        ... (El menú móvil se ha eliminado) ...
      </div> 
      */}
    </header>
  );
};

export default Header;
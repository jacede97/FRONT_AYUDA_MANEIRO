import React from "react";

const Header = ({ toggleMenu }) => {
  return (
    <header
      className="bg-white shadow-lg border-b-4"
      style={{ borderColor: "#008fce" }} // Borde inferior azul oscuro
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="mr-4 p-2 rounded-lg transition-colors lg:hidden hover:bg-blue-100 hover:text-[#0069B6]" // Hover y color de texto/icono ajustados
            >
              <svg
                className="w-6 h-6 text-gray-700" // El color base se mantiene gris oscuro para buen contraste
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

            {/* Logo de la aplicación (IMG) reemplazando el SVG y el div circular */}
            <img
              src="/LOGO.png"
              alt="Logo de la Aplicación"
              className="h-10 w-auto mr-3 block" // Tamaño y margen ajustados
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
              <p className="text-sm text-gray-600">
                Sistema de Gestión de Ayudas
              </p>
            </div>
          </div>
          {/* !!! ESTE DIV ES EL QUE FALTABA CERRAR !!! -> Este comentario estaba en el original, lo he quitado ya que la estructura se ha corregido en versiones anteriores. */}
        </div>
      </div>
    </header>
  );
};

export default Header;

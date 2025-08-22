import React from "react";

const RegistroSelectores = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-[#003366] mb-4">
        Gestión Registro de Selectores
      </h2>
      <p className="text-gray-700 mb-6">
        Bienvenido al módulo de <strong>Registro de Selectores</strong>. Aquí se gestionarán los ciudadanos que participan como vocales, testigos o personal electoral.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-800 text-sm">
          📋 <strong>Funcionalidades próximas:</strong> Registro, búsqueda, asignación por centro electoral, y estado de participación.
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <p className="text-gray-600 text-center">
          🛠️ Esta sección está en desarrollo. Próximamente se integrará con el sistema de elecciones.
        </p>
      </div>
    </div>
  );
};

export default RegistroSelectores;
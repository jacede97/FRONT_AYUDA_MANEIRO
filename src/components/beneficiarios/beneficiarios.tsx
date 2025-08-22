import React from "react";

const beneficiarios = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-[#003366] mb-4">
        Gestión de Beneficiarios
      </h2>
      <p className="text-gray-700 mb-6">
        Bienvenido al módulo de beneficiarios. Aquí podrás ver, buscar y gestionar la información de los beneficiarios registrados en el sistema.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          🔔 <strong>Nota:</strong> Esta pantalla está en desarrollo. Próximamente se integrará con el listado de beneficiarios y sus ayudas asociadas.
        </p>
      </div>
    </div>
  );
};

export default beneficiarios;
import React, { useState, useEffect } from "react";

interface AuditLogProps {
  userRole: string;
  addAuditLog?: (log: { action: string; user: string; timestamp: string; details: string }) => void; // Opcional para compatibilidad
}

interface AuditLogEntry {
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

const AuditLog: React.FC<AuditLogProps> = ({ userRole, addAuditLog }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    // Logs iniciales (puedes reemplazar con datos de una API o evento)
    const initialLogs: AuditLogEntry[] = [
      {
        action: "Registro",
        user: "Usuario Anónimo",
        timestamp: new Date().toISOString(),
        details: "Ayuda AYU-001 registrada para Juan Pérez",
      },
    ];
    setAuditLogs(initialLogs);
  }, []);

  // Si addAuditLog está definido, actualiza los logs localmente
  useEffect(() => {
    if (addAuditLog) {
      const handleLog = (log: { action: string; user: string; timestamp: string; details: string }) => {
        setAuditLogs((prevLogs) => [...prevLogs, log]);
      };
      addAuditLog = handleLog; // Reasignar para que las llamadas desde Dashboard actualicen AuditLog
    }
  }, [addAuditLog]);

  const filteredLogs = auditLogs.filter((log) => {
    return true; // Mostrar todos los logs por ahora; ajusta según necesidad
  });

  return (
    <div className="flex-1 p-2 font-sans bg-gray-50 rounded-xl">
      <div className="space-y-4">
        <div className="mb-6 flex flex-col justify-center items-center gap-4 rounded-xl bg-white p-4 shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-[#003366]">
            Registro de Auditoría
          </h2>
          <p className="text-gray-600 mt-1">
            Historial de acciones realizadas en las ayudas - {new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0095D4]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">{log.action}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{log.user}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(log.timestamp).toLocaleString("es-ES", { timeZone: "America/Caracas" })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500">
                      No hay registros de auditoría disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {userRole === "admin" && (
            <button
              onClick={() =>
                addAuditLog({
                  action: "Prueba",
                  user: "Admin",
                  timestamp: new Date().toISOString(),
                  details: "Log de prueba agregado manualmente",
                })
              }
              className="mt-4 px-4 py-2 bg-[#0095D4] text-white rounded-lg hover:bg-[#007bb5] transition-colors"
            >
              Agregar Log de Prueba
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
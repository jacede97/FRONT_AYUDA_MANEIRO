import React, { useState, useEffect, useMemo, useCallback } from "react";

interface Beneficiario {
  id: number;
  codigo: string;
  cedula: string;
  beneficiario: string;
  nacionalidad: string;
  sexo: string;
  fechaNacimiento: string;
  municipio: string;
  parroquia: string;
  estructura: string;
  telefono: string;
  calle: string;
  direccion: string;
  institucion: string;
  responsableInstitucion: string;
  tipo: string;
  subtipo: string;
  estado: string;
  observacion: string;
  fecha_registro: string;
  fecha_actualizacion: string;
}

const Beneficiarios: React.FC = () => {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cedulaFilter, setCedulaFilter] = useState<string>("");
  const [debouncedCedula, setDebouncedCedula] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Debounce para el input de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCedula(cedulaFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [cedulaFilter]);

  // Fetch los datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://maneiro-api-mem1.onrender.com/api/");
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la API");
        }
        const data: Beneficiario[] = await response.json();
        setBeneficiarios(data);
        setLoading(false);
      } catch (err) {
        setError("No se pudo cargar la lista de beneficiarios.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar beneficiarios por cédula (memoizado)
  const filteredBeneficiarios = useMemo(() => {
    return debouncedCedula
      ? beneficiarios.filter((b) => b.cedula.includes(debouncedCedula))
      : beneficiarios;
  }, [beneficiarios, debouncedCedula]);

  // Paginación en el frontend
  const paginatedBeneficiarios = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBeneficiarios.slice(start, end);
  }, [filteredBeneficiarios, page]);

  // Agrupar por cédula (memoizado)
  const groupedByCedula = useMemo(() => {
    return paginatedBeneficiarios.reduce((acc, curr) => {
      const key = `${curr.cedula}-${curr.beneficiario}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, Beneficiario[]>);
  }, [paginatedBeneficiarios]);

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredBeneficiarios.length / itemsPerPage);

  // Manejar cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl sm:text-2xl font-semibold text-[#003366] mb-4">
        Gestión de Beneficiarios
      </h2>
      <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
        Bienvenido al módulo de beneficiarios. Aquí podrás ver, buscar y gestionar la información de los beneficiarios registrados en el sistema.
      </p>

      {loading && (
        <div className="text-center text-gray-500">Cargando datos...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
          🔔 <strong>Error:</strong> {error}
        </div>
      )}

      {/* Buscador por cédula */}
      <div className="mb-4 sm:mb-6">
        <label htmlFor="cedulaFilter" className="block text-sm font-medium text-gray-700">
          Buscar por cédula:
        </label>
        <input
          type="text"
          id="cedulaFilter"
          value={cedulaFilter}
          onChange={(e) => setCedulaFilter(e.target.value)}
          placeholder="Ej. 16035145"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003366] focus:border-[#003366] text-base"
        />
      </div>

      {/* Lista de beneficiarios */}
      {!loading && !error && (
        <div className="max-h-[500px] overflow-y-auto rounded-lg shadow-sm">
          {Object.entries(groupedByCedula).map(([key, registros]) => {
            const [cedula, beneficiario] = key.split("-");
            return (
              <div key={cedula} className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-medium text-[#003366] mb-2">
                  {beneficiario} (Cédula: {cedula})
                </h3>

                {/* Tabla para pantallas medianas y grandes */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-[#003366] text-white sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-medium">Código</th>
                        <th className="py-2 px-4 text-left text-sm font-medium">Tipo</th>
                        <th className="py-2 px-4 text-left text-sm font-medium">Subtipo</th>
                        <th className="py-2 px-4 text-left text-sm font-medium">Estado</th>
                        <th className="py-2 px-4 text-left text-sm font-medium">Observación</th>
                        <th className="py-2 px-4 text-left text-sm font-medium">Fecha Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((registro) => (
                        <tr key={registro.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-sm text-gray-700">{registro.codigo}</td>
                          <td className="py-2 px-4 text-sm text-gray-700">{registro.tipo}</td>
                          <td className="py-2 px-4 text-sm text-gray-700">{registro.subtipo}</td>
                          <td className="py-2 px-4 text-sm text-gray-700">{registro.estado}</td>
                          <td className="py-2 px-4 text-sm text-gray-700">{registro.observacion}</td>
                          <td className="py-2 px-4 text-sm text-gray-700">
                            {new Date(registro.fecha_registro).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tarjetas para móviles */}
                <div className="md:hidden space-y-4">
                  {registros.map((registro) => (
                    <div
                      key={registro.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="text-sm text-gray-700">
                        <strong>Código:</strong> {registro.codigo}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Tipo:</strong> {registro.tipo}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Subtipo:</strong> {registro.subtipo}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Estado:</strong> {registro.estado}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Observación:</strong> {registro.observacion}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Fecha Registro:</strong>{" "}
                        {new Date(registro.fecha_registro).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controles de paginación */}
      {!loading && !error && filteredBeneficiarios.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="w-full sm:w-auto px-6 py-2 bg-[#003366] text-white rounded-md disabled:bg-gray-300 text-base"
          >
            Anterior
          </button>
          <span className="text-gray-700 text-sm sm:text-base">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="w-full sm:w-auto px-6 py-2 bg-[#003366] text-white rounded-md disabled:bg-gray-300 text-base"
          >
            Siguiente
          </button>
        </div>
      )}

      {filteredBeneficiarios.length === 0 && !loading && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm">
          🔔 <strong>Nota:</strong> No se encontraron beneficiarios con esa cédula.
        </div>
      )}
    </div>
  );
};

export default Beneficiarios;
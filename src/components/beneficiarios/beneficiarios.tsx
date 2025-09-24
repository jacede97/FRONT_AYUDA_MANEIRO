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
  const [textFilter, setTextFilter] = useState<string>("");
  const [debouncedCedula, setDebouncedCedula] = useState<string>("");
  const [debouncedText, setDebouncedText] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10; // Número de grupos por página

  // Debounce para los inputs de búsqueda
  useEffect(() => {
    const handlerCedula = setTimeout(() => {
      setDebouncedCedula(cedulaFilter);
    }, 300);
    const handlerText = setTimeout(() => {
      setDebouncedText(textFilter);
    }, 300);
    return () => {
      clearTimeout(handlerCedula);
      clearTimeout(handlerText);
    };
  }, [cedulaFilter, textFilter]);

  // Fetch los datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://maneiro-api-mem1.onrender.com/api/");
        if (!response.ok) {
          throw new Error("Error al obtener los datos de la API");
        }
        const data: Beneficiario[] = await response.json();
        // Eliminar posibles duplicados globales basados en id
        const uniqueData = Array.from(
          new Map(data.map((item) => [item.id, item])).values()
        );
        setBeneficiarios(uniqueData);
        setLoading(false);
      } catch (err) {
        setError("No se pudo cargar la lista de beneficiarios.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar beneficiarios por cédula y texto (memoizado)
  const filteredBeneficiarios = useMemo(() => {
    return beneficiarios.filter((b) => {
      const matchesCedula = debouncedCedula
        ? b.cedula.toLowerCase().includes(debouncedCedula.trim().toLowerCase())
        : true;
      const matchesText = debouncedText
        ? [
            b.beneficiario,
            b.estructura,
            b.codigo,
            b.observacion,
            b.tipo,
            b.subtipo,
            b.institucion,
          ]
            .join(" ")
            .toLowerCase()
            .includes(debouncedText.trim().toLowerCase())
        : true;
      return matchesCedula && matchesText;
    });
  }, [beneficiarios, debouncedCedula, debouncedText]);

  // Agrupar por cédula y nombre normalizados, eliminando duplicados por código
  const groupedByCedula = useMemo(() => {
    const groups = filteredBeneficiarios.reduce((acc, curr) => {
      const normalizedKey = `${curr.cedula.trim()}-${curr.beneficiario.trim().toUpperCase()}`;
      if (!acc[normalizedKey]) {
        acc[normalizedKey] = new Map<string, Beneficiario>(); // Usar Map para evitar duplicados por código
      }
      // Solo agregar si no existe un registro con el mismo código, o si el actual es más reciente
      const existing = acc[normalizedKey].get(curr.codigo);
      if (!existing || new Date(curr.fecha_registro) > new Date(existing.fecha_registro)) {
        acc[normalizedKey].set(curr.codigo, curr);
      }
      return acc;
    }, {} as Record<string, Map<string, Beneficiario>>);

    // Convertir Map a array y ordenar por código (ascendente)
    const result = {};
    for (const [key, value] of Object.entries(groups)) {
      result[key] = Array.from(value.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
    }
    return result as Record<string, Beneficiario[]>;
  }, [filteredBeneficiarios]);

  // Convertir los grupos en un array y ordenarlos por el código más alto (descendente)
  const groupedArray = useMemo(() => {
    return Object.entries(groupedByCedula)
      .map(([key, registros]) => {
        // Encontrar el código más alto en el grupo
        const maxCodigo = registros.reduce((max, curr) =>
          curr.codigo.localeCompare(max) > 0 ? curr.codigo : max,
          registros[0]?.codigo || ""
        );
        // Extraer la parte numérica del código más alto (por ejemplo, "999" de "AYU-999")
        const maxNumero = parseInt(maxCodigo.replace("AYU-", ""), 10) || 0;
        return { key, registros, maxNumero };
      })
      .sort((a, b) => b.maxNumero - a.maxNumero); // Ordenar grupos por número más alto (descendente)
  }, [groupedByCedula]);

  // Paginación de los grupos
  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return groupedArray.slice(start, end);
  }, [groupedArray, page]);

  // Calcular número total de páginas (basado en grupos)
  const totalPages = Math.ceil(groupedArray.length / itemsPerPage);

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

      {/* Dos buscadores */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
        <div className="w-full sm:w-1/2">
          <label htmlFor="cedulaFilter" className="block text-sm font-medium text-gray-700">
            Buscar por Cédula
          </label>
          <input
            type="text"
            id="cedulaFilter"
            value={cedulaFilter}
            onChange={(e) => setCedulaFilter(e.target.value)}
            placeholder="Cédula..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003366] focus:border-[#003366] text-base"
          />
        </div>
        <div className="w-full sm:w-1/2">
          <label htmlFor="textFilter" className="block text-sm font-medium text-gray-700">
            Buscar por Texto
          </label>
          <input
            type="text"
            id="textFilter"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="Nombre, estructura, código, etc."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003366] focus:border-[#003366] text-base"
          />
        </div>
      </div>

      {/* Lista de beneficiarios */}
      {!loading && !error && (
        <div className="max-h-[500px] overflow-y-auto rounded-lg shadow-sm">
          {paginatedGroups.map(({ key, registros }) => {
            const [cedula, beneficiario] = key.split("-");
            return (
              <div key={cedula} className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-medium text-[#003366] mb-2">
                  {beneficiario} (Cédula: {cedula})
                </h3>

                {/* Tabla para pantallas medianas y grandes */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gradient-to-r from-[#003366] to-[#005599] text-white sticky top-0 z-10 shadow-md">
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
      {!loading && !error && groupedArray.length > 0 && (
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

      {groupedArray.length === 0 && !loading && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm">
          🔔 <strong>Nota:</strong> No se encontraron beneficiarios con esos criterios.
        </div>
      )}
    </div>
  );
};

export default Beneficiarios;
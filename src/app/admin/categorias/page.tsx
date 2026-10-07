"use client"; // Esta línea mágica le dice a Next.js que este componente usa estado e interactividad del navegador.

import { useEffect, useState } from "react";

// Definimos la estructura de datos que esperamos recibir del backend (TypeScript al rescate)
interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

export default function CategoriasPage() {
  // Estado para guardar las categorías que lleguen de la API
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // Estado para manejar la carga visual (el spinner)
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevoPrefijo, setNuevoPrefijo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  const [tieneProductos, setTieneProductos] = useState(false);

  // useEffect se ejecuta automáticamente cuando la página carga por primera vez
  useEffect(() => {
    const obtenerCategorias = async () => {
      try {
        // Hacemos la petición a nuestro backend en el puerto 3000
        const respuesta = await fetch("http://localhost:3000/categorias");

        if (!respuesta.ok) {
          throw new Error("Error al obtener las categorías");
        }

        const datos = await respuesta.json();
        setCategorias(datos); // Guardamos los datos en el estado
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false); // Apagamos el estado de carga
      }
    };

    obtenerCategorias();
  }, []); // El arreglo vacío [] asegura que esto solo se ejecute una vez.

  const manejarCreacion = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    if (!nuevaCategoria.trim()) return; // Validación básica frontend

    setGuardando(true);
    try {
      const url = modoEdicion
        ? `http://localhost:3000/categorias/${idEdicion}`
        : "http://localhost:3000/categorias";

      const metodoHttp = modoEdicion ? "PATCH" : "POST";

      const respuesta = await fetch(url, {
        method: metodoHttp,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCategoria: nuevaCategoria,
          prefijo: nuevoPrefijo.toUpperCase(),
        }),
      });

      if (!respuesta.ok) throw new Error("Error al guardar");

      const categoriaGuardada = await respuesta.json();

      if (modoEdicion) {
        setCategorias(
          categorias.map((c) =>
            c.idCategoria === idEdicion ? categoriaGuardada : c,
          ),
        );
        setMensajeExito("Categoría actualizada");
      } else {
        setCategorias([...categorias, categoriaGuardada]);
        setMensajeExito("Categoría creada");
      }

      setTimeout(() => setMensajeExito(""), 3000);
      cerrarModal();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar la categoría");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setModoEdicion(false);
    setIdEdicion(null);
    setNuevaCategoria("");
    setNuevoPrefijo("");
    setTieneProductos(false); // Limpiamos esta bandera
  };

  const manejarEditar = (cat: any) => {
    setModoEdicion(true);
    setIdEdicion(cat.idCategoria);
    setNuevaCategoria(cat.nombreCategoria);
    setNuevoPrefijo(cat.prefijo);

    // Verificamos si tiene productos asociados (gracias al _count que agregamos al backend)
    const cantidad = cat._count?.productos || 0;
    setTieneProductos(cantidad > 0);

    setMostrarModal(true);
  };

  const manejarEliminar = async (
    idCategoria: number,
    nombreCategoria: string,
  ) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar la categoría "${nombreCategoria}"?`,
      )
    )
      return;

    try {
      const respuesta = await fetch(
        `http://localhost:3000/categorias/${idCategoria}`,
        {
          method: "DELETE",
        },
      );

      if (!respuesta.ok) {
        const errData = await respuesta.json();
        // Aquí mostraremos el error si intenta borrar una categoría con productos
        throw new Error(errData.message || "Error al eliminar");
      }

      setCategorias(
        categorias.filter((cat) => cat.idCategoria !== idCategoria),
      );
      setMensajeExito(`Categoría eliminada.`);
      setTimeout(() => setMensajeExito(""), 3000);
    } catch (error: any) {
      alert(error.message); // Muestra la alerta de protección
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Categorías
        </h1>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition shadow-sm"
        >
          + Nueva Categoría
        </button>
      </div>

      {/* Alerta de Éxito */}
      {mensajeExito && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm animate-fade-in-down flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}
      {/* Renderizado Condicional: Mostramos "Cargando..." o mostramos la tabla */}
      {cargando ? (
        <p className="text-gray-500">Cargando categorías...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Recorremos el arreglo de categorías y pintamos una fila por cada una */}
              {categorias.map((cat) => (
                <tr
                  key={cat.idCategoria}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.idCategoria}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cat.nombreCategoria}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => manejarEditar(cat)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        manejarEliminar(cat.idCategoria, cat.nombreCategoria)
                      }
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {/* Mensaje por si la base de datos está vacía */}
              {categorias.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No hay categorías registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Creación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            {/* Añadimos text-gray-900 para forzar un gris casi negro en el título */}
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {modoEdicion ? "Editar Categoría" : "Añadir Categoría"}
            </h2>

            <form onSubmit={manejarCreacion}>
              <div className="mb-4">
                {/* Añadimos text-gray-900 al label por precaución */}
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  /* Añadimos text-gray-900 para el texto que escribes y bg-white por si el navegador intenta ponerle fondo oscuro */
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  placeholder="Ej. Chocolates"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Prefijo (Ej. GOM, CHO)
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  disabled={modoEdicion && tieneProductos} // ¡Bloqueado si se edita y tiene productos!
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 uppercase ${
                    modoEdicion && tieneProductos
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  }`}
                  value={nuevoPrefijo}
                  onChange={(e) => setNuevoPrefijo(e.target.value)}
                  placeholder="GOM"
                />
                {modoEdicion && tieneProductos && (
                  <p className="text-xs text-amber-600 mt-1">
                    * El prefijo no se puede modificar porque esta categoría ya
                    cuenta con productos registrados.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition disabled:bg-pink-300"
                >
                  {modoEdicion ? "Actualizar Categoría" : "Guardar Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

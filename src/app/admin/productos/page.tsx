"use client";

import { useEffect, useState } from "react";

interface Producto {
  idProducto: number;
  nombre: string;
  idCategoria: number;
  unidadMedida: string;
  costo: string;
  precio: string;
  codigoBarras: string;
  stock: string;
  imagenUrl: string; // Nuevo campo para la URL de la imagen
}

// 1. Necesitamos la interfaz de Categoría para el menú desplegable
interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Modal y Formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false); // Indicador de carga
  const [mensajeExito, setMensajeExito] = useState("");
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string>("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);

  // Agrupamos todos los campos en un solo estado para mantener el código limpio
  const [formData, setFormData] = useState({
    nombre: "",
    idCategoria: "",
    unidadMedida: "kg",
    costo: "",
    precio: "",
    stock: "",
    imagenUrl: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 2. Promise.all ejecuta ambos fetch al mismo tiempo. ¡Esto hace tu app el doble de rápida!
        const [resProductos, resCategorias] = await Promise.all([
          fetch("http://localhost:3000/productos"),
          fetch("http://localhost:3000/categorias"),
        ]);

        if (resProductos.ok && resCategorias.ok) {
          setProductos(await resProductos.json());
          setCategorias(await resCategorias.json());
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const manejarSeleccionImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Guardamos el archivo físico para enviarlo más tarde
    setArchivoImagen(archivo);

    // Generamos una URL temporal en el navegador para la vista previa
    setPreviewLocal(URL.createObjectURL(archivo));
  };

  const manejarCreacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let urlFinalImagen = "";

      // 1. Si el usuario seleccionó una imagen, la subimos a Cloudinary primero
      if (archivoImagen) {
        setSubiendoImagen(true);
        const data = new FormData();
        data.append("file", archivoImagen);
        data.append("upload_preset", "endulza_productos");

        const resCloudinary = await fetch(
          "https://api.cloudinary.com/v1_1/q2jylk0k/image/upload",
          {
            method: "POST",
            body: data,
          },
        );

        if (!resCloudinary.ok) throw new Error("Error al subir a Cloudinary");

        const archivoSubido = await resCloudinary.json();
        urlFinalImagen = archivoSubido.secure_url; // Obtenemos el link real
        setSubiendoImagen(false);
      }

      // 2. Preparamos los datos para tu Backend
      const payload = {
        nombre: formData.nombre,
        idCategoria: parseInt(formData.idCategoria),
        unidadMedida: formData.unidadMedida,
        costo: parseFloat(formData.costo),
        precio: parseFloat(formData.precio),
        stock: parseFloat(formData.stock),
        // Si subimos imagen mandamos la URL, si no, mandamos undefined para que sea null
        imagenUrl: urlFinalImagen || undefined,
      };

      // 3. Petición a NestJS
      // 3. Petición a NestJS (Decide si es POST o PATCH)
      const url = modoEdicion
        ? `http://localhost:3000/productos/${idEdicion}`
        : "http://localhost:3000/productos";

      const metodoHttp = modoEdicion ? "PATCH" : "POST";

      const respuesta = await fetch(url, {
        method: metodoHttp,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        const errData = await respuesta.json();
        throw new Error(errData.message || "Error al procesar la solicitud");
      }

      const productoProcesado = await respuesta.json();

      // Si estábamos editando, actualizamos ese producto en la lista; si no, lo agregamos al final
      if (modoEdicion) {
        setProductos(
          productos.map((p) =>
            p.idProducto === idEdicion ? productoProcesado : p,
          ),
        );
        setMensajeExito(
          `¡El producto ${productoProcesado.nombre} fue actualizado!`,
        );
      } else {
        setProductos([...productos, productoProcesado]);
        setMensajeExito(
          `¡El producto ${productoProcesado.nombre} se registró correctamente!`,
        );
      }

      setTimeout(() => setMensajeExito(""), 3000);
      cerrarModal();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
      setSubiendoImagen(false);
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async (
    idProducto: number,
    nombreProducto: string,
  ) => {
    // 1. Pedimos confirmación al usuario (Alerta nativa de JS)
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar el producto "${nombreProducto}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmar) return;

    try {
      // 2. Hacemos la petición DELETE al backend
      const respuesta = await fetch(
        `http://localhost:3000/productos/${idProducto}`,
        {
          method: "DELETE",
        },
      );

      if (!respuesta.ok) {
        throw new Error("Error al eliminar el producto");
      }

      // 3. Actualizamos la tabla filtrando el producto eliminado
      setProductos(productos.filter((prod) => prod.idProducto !== idProducto));

      // 4. Mostramos el mensaje de éxito
      setMensajeExito(`El producto "${nombreProducto}" fue eliminado.`);
      setTimeout(() => setMensajeExito(""), 3000);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al intentar eliminar el producto.");
    }
  };

  const manejarEditar = (prod: Producto) => {
    setModoEdicion(true);
    setIdEdicion(prod.idProducto);

    // Rellenamos el formulario con los datos actuales
    setFormData({
      nombre: prod.nombre,
      idCategoria: prod.idCategoria.toString(),
      unidadMedida: prod.unidadMedida,
      costo: prod.costo,
      precio: prod.precio,
      stock: prod.stock,
      imagenUrl: prod.imagenUrl || "",
    });

    // Si tiene imagen, la mostramos en la vista previa
    setPreviewLocal(prod.imagenUrl || "");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setArchivoImagen(null);
    setPreviewLocal("");
    setModoEdicion(false); // Apagamos el modo edición
    setIdEdicion(null);
    setFormData({
      nombre: "",
      idCategoria: "",
      unidadMedida: "pza",
      costo: "",
      precio: "",
      stock: "",
      imagenUrl: "",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Productos
        </h1>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition shadow-sm"
        >
          + Nuevo Producto
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

      {cargando ? (
        <p className="text-gray-500">Cargando catálogo...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((prod) => (
                <tr
                  key={prod.idProducto}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prod.codigoBarras}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombre}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prod.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${prod.precio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${Number(prod.stock) < 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                    >
                      {prod.stock} {prod.unidadMedida}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                      onClick={() => manejarEditar(prod)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 transition-colors"
                      onClick={() =>
                        manejarEliminar(prod.idProducto, prod.nombre)
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CREACIÓN DE PRODUCTOS */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-screen">

            <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">
              {modoEdicion ? "Editar Producto" : "Registrar Nuevo Producto"}
            </h2>

            <form onSubmit={manejarCreacion}>
              {/* Grid para organizar los campos en dos columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Categoría
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.idCategoria}
                    onChange={(e) =>
                      setFormData({ ...formData, idCategoria: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Selecciona una categoría...
                    </option>
                    {/* Renderizamos dinámicamente las categorías obtenidas de la BD */}
                    {categorias.map((cat) => (
                      <option key={cat.idCategoria} value={cat.idCategoria}>
                        {cat.nombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.unidadMedida}
                    onChange={(e) =>
                      setFormData({ ...formData, unidadMedida: e.target.value })
                    }
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="pza">Pieza (pza)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Costo ($)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.costo}
                    onChange={(e) =>
                      setFormData({ ...formData, costo: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Precio de Venta ($)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.precio}
                    onChange={(e) =>
                      setFormData({ ...formData, precio: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* Selector de Imagen con Vista Previa */}
              <div className="col-span-2 md:col-span-2 border-t pt-4 mt-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Imagen del Producto
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarSeleccionImagen}
                    disabled={subiendoImagen}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition disabled:opacity-50"
                  />
                  {subiendoImagen && (
                    <span className="text-sm text-blue-600 font-medium whitespace-nowrap">
                      Subiendo a la nube...
                    </span>
                  )}
                </div>

                {/* Cambiamos formData.imagenUrl por previewLocal */}
                {previewLocal && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                    <img
                      src={previewLocal} /* Aquí también usamos previewLocal */
                      alt="Vista previa"
                      className="h-32 w-32 object-cover rounded-md shadow-sm border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando || subiendoImagen}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition disabled:bg-pink-300"
                >
                  {subiendoImagen
                    ? "Subiendo foto..."
                    : guardando
                      ? "Guardando..."
                      : modoEdicion
                        ? "Actualizar Producto"
                        : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Producto {
  idProducto: number;
  codigoBarras: string;
  nombre: string;
  precio: string | number;
  stock: number;
  imagenUrl: string;
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estados para el Modal de Resurtido
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadEntrante, setCantidadEntrante] = useState("");
  const [procesandoStock, setProcesandoStock] = useState(false);

  // 1. Cargar el catálogo al montar el componente
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const token = localStorage.getItem("endulza_token");
        const respuesta = await fetch("http://localhost:3000/productos", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("Error al cargar el inventario");
        
        const data = await respuesta.json();
        setProductos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, []);

  // 2. Controladores del Modal
  const abrirModalResurtir = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCantidadEntrante("");
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setCantidadEntrante("");
  };

  // 3. Ejecución contra el Endpoint Atómico
  const confirmarResurtido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado || !cantidadEntrante) return;

    const cantidadNum = parseInt(cantidadEntrante, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      alert("Ingresa una cantidad válida mayor a cero.");
      return;
    }

    setProcesandoStock(true);

    try {
      const token = localStorage.getItem("endulza_token");
      const respuesta = await fetch(`http://localhost:3000/productos/${productoSeleccionado.idProducto}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cantidadEntrante: cantidadNum })
      });

      if (!respuesta.ok) {
        const errData = await respuesta.json();
        throw new Error(errData.message || "Error al actualizar stock");
      }

      // ACTUALIZACIÓN DE ESTADO EFICIENTE (Sin recargar toda la tabla)
      setProductos(productosAnteriores => 
        productosAnteriores.map(p => 
          p.idProducto === productoSeleccionado.idProducto 
            ? { ...p, stock: Number(p.stock) + cantidadNum } 
            : p
        )
      );

      cerrarModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesandoStock(false);
    }
  };

  if (cargando) return <div className="flex justify-center p-10"><span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></span></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona el catálogo y reabastece productos.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors">
          + Nuevo Producto
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Código</th>
                <th className="px-6 py-4 font-semibold">Precio</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productos.map((prod) => (
                <tr key={prod.idProducto} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    {prod.imagenUrl ? (
                      <img src={prod.imagenUrl} alt={prod.nombre} className="h-10 w-10 rounded-md object-cover border" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">?</div>
                    )}
                    <span className="font-medium text-gray-900">{prod.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{prod.codigoBarras}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${prod.precio}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${Number(prod.stock) <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {Number(prod.stock)} uds.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => abrirModalResurtir(prod)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-bold underline underline-offset-2"
                    >
                      Resurtir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE RESURTIDO */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ingresar Inventario</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Cuántas unidades nuevas de <strong className="text-gray-900">{productoSeleccionado.nombre}</strong> llegaron del proveedor?
            </p>
            
            <form onSubmit={confirmarResurtido}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a sumar:</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  className="w-full text-center text-3xl font-bold text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  value={cantidadEntrante}
                  onChange={(e) => setCantidadEntrante(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoStock}
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {procesandoStock ? "..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
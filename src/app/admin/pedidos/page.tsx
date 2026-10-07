"use client";
import { useState, useEffect } from "react";

// Interfaces que reflejan tu esquema de Prisma
interface Producto {
  idProducto: number;
  nombre: string;
  stock: number;
}

interface DetallePedido {
  idDPedido: number;
  idProducto: number;
  cantidad: string; // Prisma devuelve Decimal como string en JSON
  precioUnitario: string;
  producto: Producto;
}

interface Pedido {
  idPedido: number;
  fecha: string;
  status: string;
  total: string;
  detalles: DetallePedido[];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);

  // Nuevos estados para el creador de pedidos
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>(
    [],
  );
  const [carrito, setCarrito] = useState<any[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadInput, setCantidadInput] = useState("1");
  const [estadoDestinoReverso, setEstadoDestinoReverso] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  // Estados para el candado de seguridad
  const [mostrarModalPin, setMostrarModalPin] = useState(false);
  const [estadoDestinoReversion, setEstadoDestinoReversion] = useState("");

  // Cargar lista general de pedidos al abrir la página
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [resPedidos, resProductos] = await Promise.all([
          fetch("http://localhost:3000/pedidos"),
          fetch("http://localhost:3000/productos"), // Asumiendo que esta ruta existe de tu Sprint 3
        ]);
        setPedidos(await resPedidos.json());
        setProductosDisponibles(await resProductos.json());
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Función para abrir el ticket y traer los detalles exactos (con stock actual)
  const abrirTicket = async (idPedido: number) => {
    try {
      const respuesta = await fetch(
        `http://localhost:3000/pedidos/${idPedido}`,
      );
      const data = await respuesta.json();
      setPedidoSeleccionado(data);
    } catch (error) {
      alert("Error al obtener los detalles del pedido");
    }
  };

  const cerrarTicket = () => setPedidoSeleccionado(null);

  const cambiarEstadoPedido = async (nuevoEstado: string, pin?: string) => {
    if (!pedidoSeleccionado) return;

    try {
      const respuesta = await fetch(`http://localhost:3000/pedidos/${pedidoSeleccionado.idPedido}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevoEstado, pin: pin }), // Enviamos el PIN al backend
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.message || "Error de autorización");
      }

      alert(`¡El pedido ha sido actualizado a ${nuevoEstado}!`);
      
      cerrarTicket();
      setEstadoDestinoReverso(null);
      setPinInput("");
      
      const resPedidos = await fetch("http://localhost:3000/pedidos");
      setPedidos(await resPedidos.json());

    } catch (error: any) {
      alert(error.message);
    }
  };

  // 1. Prepara la reversión y abre el modal seguro
  const solicitarReversion = (estadoActual: string) => {
    let estadoAnterior = "";
    if (estadoActual === 'PREPARADO') estadoAnterior = 'PENDIENTE';
    if (estadoActual === 'ENTREGADO') estadoAnterior = 'PREPARADO';

    if (estadoAnterior) {
      setEstadoDestinoReversion(estadoAnterior);
      setMostrarModalPin(true);
    }
  };

  // 2. Valida el PIN ingresado en nuestro modal
  const confirmarPinYRevertir = () => {
    if (pinInput === "1234") {
      cambiarEstadoPedido(estadoDestinoReversion);
      cerrarModalPin();
    } else {
      alert("PIN incorrecto. Operación cancelada.");
      setPinInput(""); // Limpiamos el input para que lo intente de nuevo
    }
  };

  // 3. Limpia la pantalla si se cancela
  const cerrarModalPin = () => {
    setMostrarModalPin(false);
    setPinInput("");
    setEstadoDestinoReversion("");
  };

  const agregarAlCarrito = () => {
    const prod = productosDisponibles.find(
      (p) => p.idProducto === parseInt(productoSeleccionado),
    );
    if (!prod) return;

    const cantidadSolicitada = parseFloat(cantidadInput);

    // Verificar si el producto ya está en el carrito para sumar las cantidades
    const itemExistente = carrito.find(
      (item) => item.idProducto === prod.idProducto,
    );
    const cantidadTotal = itemExistente
      ? itemExistente.cantidad + cantidadSolicitada
      : cantidadSolicitada;

    // Regla de Negocio: Bloquear si supera el stock
    if (cantidadTotal > prod.stock) {
      alert(
        `¡Stock insuficiente! Solo hay ${prod.stock} piezas disponibles de ${prod.nombre}.`,
      );
      return;
    }

    if (itemExistente) {
      // Actualizar cantidad si ya existía
      setCarrito(
        carrito.map((item) =>
          item.idProducto === prod.idProducto
            ? { ...item, cantidad: cantidadTotal }
            : item,
        ),
      );
    } else {
      // Agregar nuevo producto
      const nuevoItem = {
        idProducto: prod.idProducto,
        nombre: prod.nombre,
        precioUnitario: (prod as any).precio,
        cantidad: cantidadSolicitada,
        stockDisponible: prod.stock,
      };
      setCarrito([...carrito, nuevoItem]);
    }

    setProductoSeleccionado("");
    setCantidadInput("1");
  };

  // PUNTO 4: Manejo de errores visible y alerta de éxito
  const generarPedidoPrueba = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");

    try {
      const payload = {
        detalles: carrito.map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
      };

      const respuesta = await fetch("http://localhost:3000/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Si el backend lanza un error (ej. falta el usuario ID 1), lo atrapamos aquí
      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(
          errorData.message || "Error desconocido en el servidor",
        );
      }

      alert("¡Pedido generado con éxito!");
      cerrarModalNuevo();

      // Recargar la lista de pedidos
      const [resPedidos, resProductos] = await Promise.all([
        fetch("http://localhost:3000/pedidos"),
        fetch("http://localhost:3000/productos"),
      ]);

      setPedidos(await resPedidos.json());
      setProductosDisponibles(await resProductos.json()); // Esto actualiza el select
    } catch (error: any) {
      console.error(error);
      alert(`Error al generar el pedido: ${error.message}`);
    }
  };

  const cerrarModalNuevo = () => {
    setMostrarModalNuevo(false);
    setCarrito([]);
    setProductoSeleccionado("");
    setCantidadInput("1");
  };

  const abrirModalNuevoPedido = async () => {
    try {
      // Obligamos al sistema a consultar el stock exacto de este milisegundo
      const resProductos = await fetch("http://localhost:3000/productos");
      setProductosDisponibles(await resProductos.json());
      setMostrarModalNuevo(true);
    } catch (error) {
      console.error("Error al refrescar productos:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Gestor de Pedidos (Fulfillment)
        </h1>
        <button
          onClick={() => abrirModalNuevoPedido()}
          className="bg-pink-600 text-white px-4 py-2 rounded-md font-bold hover:bg-pink-700 shadow-sm"
        >
          + Simular Nuevo Pedido
        </button>
      </div>

      {/* Tabla Principal de Pedidos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pedidos.map((pedido) => (
              <tr
                key={pedido.idPedido}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                  #{pedido.idPedido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(pedido.fecha).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  ${Number(pedido.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${pedido.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' : 
                      pedido.status === 'PREPARADO' ? 'bg-blue-100 text-blue-800' : 
                      pedido.status === 'ENTREGADO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {pedido.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => abrirTicket(pedido.idPedido)}
                    className="text-pink-600 hover:text-pink-900 font-bold"
                  >
                    Preparar / Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Preparación del Ticket */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  Preparando Pedido #{pedidoSeleccionado.idPedido}
                </h2>
                <span className="text-lg font-bold text-green-600">
                  Total: ${Number(pedidoSeleccionado.total).toFixed(2)}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Artículos a surtir
                </h3>
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {pedidoSeleccionado.detalles.map((detalle) => (
                    <li
                      key={detalle.idDPedido}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {detalle.producto.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          Precio Unitario: $
                          {Number(detalle.precioUnitario).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          <span className="font-bold text-blue-700">
                            {Number(detalle.cantidad)}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {" "}
                            solicitadas
                          </span>
                        </p>
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                          Stock Reservado
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

<div className="flex justify-end gap-3 mt-6 items-center">
                {/* Botón de retroceso (Solo visible si ya no es PENDIENTE) */}
                {pedidoSeleccionado.status !== 'PENDIENTE' && (
                  <button 
                    onClick={() => solicitarReversion(pedidoSeleccionado.status)}
                    className="mr-auto text-sm text-red-600 hover:text-red-800 font-bold underline decoration-red-300 underline-offset-4"
                  >
                    « Deshacer estado
                  </button>
                )}

                <button onClick={cerrarTicket} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
                  Cerrar
                </button>
                
                {pedidoSeleccionado.status === 'PENDIENTE' && (
                  <button 
                    onClick={() => cambiarEstadoPedido('PREPARADO')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm transition-colors"
                  >
                    Marcar como Preparado
                  </button>
                )}

                {pedidoSeleccionado.status === 'PREPARADO' && (
                  <button 
                    onClick={() => cambiarEstadoPedido('ENTREGADO')}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold shadow-sm transition-colors"
                  >
                    Confirmar Entrega
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para CREAR un nuevo pedido (Mini POS) */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-900">
              Crear Pedido de Prueba
            </h2>

            <div className="flex gap-4 mb-6">
              <select
                className="flex-1 border border-gray-400 rounded-md px-3 py-2 text-gray-900 font-medium bg-white"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="" className="text-gray-500">
                  -- Selecciona un Producto --
                </option>
                {productosDisponibles.map((p) => (
                  <option
                    key={p.idProducto}
                    value={p.idProducto}
                    className="text-gray-900"
                  >
                    {p.nombre} (Stock: {p.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.5"
                step="0.5"
                className="w-24 border border-gray-400 rounded-md px-3 py-2 text-gray-900 font-bold bg-white"
                value={cantidadInput}
                onChange={(e) => setCantidadInput(e.target.value)}
              />

              <button
                onClick={agregarAlCarrito}
                disabled={!productoSeleccionado}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold disabled:bg-gray-400 transition-colors"
              >
                Agregar
              </button>
            </div>

            {/* Lista del Carrito */}
            <div className="min-h-[150px] border border-gray-300 rounded-md p-4 mb-4 bg-gray-50">
              {carrito.length === 0 ? (
                <p className="text-gray-500 text-center font-medium">
                  El carrito está vacío
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {carrito.map((item, idx) => (
                    <li
                      key={idx}
                      className="py-3 flex justify-between items-center text-gray-900"
                    >
                      <span className="font-medium text-lg">
                        <span className="font-bold text-blue-700 mr-2">
                          {item.cantidad}x
                        </span>
                        {item.nombre}
                      </span>
                      <span className="font-bold text-lg text-green-700">
                        ${(item.cantidad * item.precioUnitario).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cerrarModalNuevo}
                className="px-4 py-2 text-gray-700 font-bold border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={generarPedidoPrueba}
                disabled={carrito.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md font-bold text-lg disabled:bg-gray-400 hover:bg-green-700 shadow-sm"
              >
                Generar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Seguridad (Manager Override) */}
      {mostrarModalPin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">Autorización Requerida</h3>
            <p className="text-sm text-gray-500 mb-4">Ingresa el PIN de la dueña para revertir el estado de este pedido.</p>
            
            <input 
              type="password" 
              maxLength={4}
              className="w-32 text-center text-2xl tracking-widest border border-gray-400 rounded-md px-3 py-2 text-gray-900 font-bold mb-6"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarPinYRevertir()}
              placeholder="••••"
              autoFocus
            />

            <div className="flex justify-center gap-3">
              <button onClick={cerrarModalPin} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
                Cancelar
              </button>
              <button 
                onClick={confirmarPinYRevertir} 
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold shadow-sm"
              >
                Autorizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

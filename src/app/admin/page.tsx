"use client";

import { useEffect, useState } from "react";

// Definimos la estructura de los datos que esperamos del backend
interface ResumenDashboard {
  pedidosCompletados: number;
  ingresosTotales: number;
  productosStockBajo: {
    idProducto: number;
    nombre: string;
    stock: number | string;
  }[];
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("endulza_token");
        
        const respuesta = await fetch("http://localhost:3000/dashboard/resumen", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!respuesta.ok) {
          if (respuesta.status === 403) {
            throw new Error("No tienes permisos para ver las métricas financieras.");
          }
          throw new Error("Error al cargar el resumen del dashboard");
        }

        const data = await respuesta.json();
        setResumen(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
        <h3 className="text-red-800 font-bold text-lg mb-2">Acceso Restringido</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resumen del Negocio</h2>
        <p className="text-gray-500 text-sm mt-1">Métricas clave e inventario al día de hoy.</p>
      </div>

      {/* Tarjetas de Métricas (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta: Ingresos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col transition-transform hover:scale-[1.02]">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Ingresos Totales</span>
          <span className="text-4xl font-extrabold text-green-600">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(resumen?.ingresosTotales || 0)}
          </span>
        </div>

        {/* Tarjeta: Pedidos Completados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col transition-transform hover:scale-[1.02]">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Pedidos Entregados</span>
          <span className="text-4xl font-extrabold text-blue-600">
            {resumen?.pedidosCompletados}
          </span>
        </div>

        {/* Tarjeta: Alertas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col transition-transform hover:scale-[1.02]">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Alertas de Stock</span>
          <span className="text-4xl font-extrabold text-red-600">
            {resumen?.productosStockBajo.length}
          </span>
        </div>
      </div>

      {/* Tabla de Productos con Stock Crítico */}
      {resumen?.productosStockBajo && resumen.productosStockBajo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <span>⚠️</span> Productos que requieren reabastecimiento urgente
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {resumen.productosStockBajo.map((producto) => (
              <div key={producto.idProducto} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-900">{producto.nombre}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Quedan:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    Number(producto.stock) === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {producto.stock} uds.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
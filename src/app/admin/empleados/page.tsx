"use client";

import { useState } from "react";

export default function EmpleadosPage() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    password: "",
    tipoUsuario: "CAJERO"
  });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const registrarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      const respuesta = await fetch("http://localhost:3000/auth/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.message || "Error al registrar el empleado");
      }

      setMensaje({ tipo: "exito", texto: `¡${formData.nombres} registrado exitosamente como ${formData.tipoUsuario}!` });
      
      // Limpiamos el formulario
      setFormData({
        nombres: "",
        apellidos: "",
        correo: "",
        password: "",
        tipoUsuario: "CAJERO"
      });

    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Personal</h2>
        <p className="text-gray-500 text-sm mt-1">Registra nuevos usuarios para que puedan acceder al Punto de Venta.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Registrar Nuevo Usuario</h3>
        </div>

        <form onSubmit={registrarEmpleado} className="p-6 space-y-4">
          {mensaje.texto && (
            <div className={`p-4 rounded-md text-sm font-medium ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'}`}>
              {mensaje.texto}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
              <input
                type="text"
                name="nombres"
                required
                value={formData.nombres}
                onChange={manejarCambio}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ej. Carlos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                required
                value={formData.apellidos}
                onChange={manejarCambio}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ej. López"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Usuario)</label>
            <input
              type="email"
              name="correo"
              required
              value={formData.correo.toLowerCase()}
              onChange={manejarCambio}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="carlos@endulza.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Temporal</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={manejarCambio}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el Sistema</label>
              <select
                name="tipoUsuario"
                value={formData.tipoUsuario}
                onChange={manejarCambio}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="CAJERO">Cajero (Solo ventas y visualización)</option>
                <option value="ADMIN">Administrador (Acceso total)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {cargando ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                "Guardar Nuevo Usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
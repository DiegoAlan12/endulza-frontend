"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<any>(null);
  const [autorizado, setAutorizado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Verificamos si existe el gafete (token)
    const token = localStorage.getItem("endulza_token");
    const usuarioGuardado = localStorage.getItem("endulza_usuario");

    if (!token || !usuarioGuardado) {
      // Si no hay token, lo expulsamos inmediatamente al login
      router.replace("/login");
    } else {
      // Si hay token, lo dejamos pasar y guardamos sus datos para la barra superior
      setUsuario(JSON.parse(usuarioGuardado));
      setAutorizado(true);
    }
  }, [router]);

  const cerrarSesion = () => {
    // Destruimos el gafete y los datos
    localStorage.removeItem("endulza_token");
    localStorage.removeItem("endulza_usuario");
    router.replace("/login");
  };

  // Mientras verifica, mostramos una pantalla en blanco o un spinner
  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* BARRA DE NAVEGACIÓN SUPERIOR (NAVBAR) */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logotipo y Enlaces */}
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">
                Endulza POS
              </h1>

              {/* Nuevo Enlace al Dashboard (Solo ADMIN) */}
              {usuario?.tipoUsuario === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </Link>
              )}

              <nav className="hidden md:flex gap-4">
                {/* Enlace dinámico: Se resalta si estás en esa ruta */}
                <Link
                  href="/admin/pedidos"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.includes("/pedidos")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Pedidos
                </Link>

                {/* Solo la dueña (ADMIN) puede ver el enlace a Productos */}
                {usuario?.tipoUsuario === "ADMIN" && (
                  <Link
                    href="/admin/productos"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.includes("/productos")
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Inventario
                  </Link>
                )}
              </nav>
            </div>

            {/* Perfil y Botón de Salir */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {usuario?.nombres}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {usuario?.tipoUsuario}
                </p>
              </div>
              <button
                onClick={cerrarSesion}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AQUÍ SE RENDERIZAN TUS PÁGINAS PROTEGIDAS (ej. pedidos/page.tsx) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

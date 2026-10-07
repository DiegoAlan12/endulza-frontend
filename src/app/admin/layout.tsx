import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-8 text-pink-400">Dashboard</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/admin" className="hover:text-pink-300 transition">Resumen</Link>
          <Link href="/admin/productos" className="hover:text-pink-300 transition">Productos</Link>
          <Link href="/admin/categorias" className="hover:text-pink-300 transition">Categorías</Link>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
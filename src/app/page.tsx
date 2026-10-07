import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-pink-600 mb-4">Endulza tu Negocio</h1>
      <p className="text-gray-600 mb-8">Catálogo en construcción...</p>
      <Link 
        href="/admin" 
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Ir al Panel de Administración
      </Link>
    </main>
  );
}
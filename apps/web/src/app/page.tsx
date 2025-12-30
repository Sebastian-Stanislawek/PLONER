import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary-700 mb-4">Ploner</h1>
      <p className="text-gray-600 mb-8">System zarządzania gospodarstwem zintegrowany z IRZ+</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Zaloguj się
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
        >
          Zarejestruj się
        </Link>
      </div>
    </main>
  );
}



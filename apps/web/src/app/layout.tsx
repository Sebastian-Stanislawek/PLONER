import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/shared/Toast';

export const metadata: Metadata = {
  title: 'Ploner - Zarządzanie gospodarstwem',
  description: 'System zarządzania gospodarstwem zintegrowany z IRZ+',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gray-50">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}


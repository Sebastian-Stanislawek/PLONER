'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { documentsHttp, Document } from '@/lib/http/documents.http';
import { farmsHttp } from '@/lib/http/farms.http';

export default function ZgloszeniaPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        setFarmId(farms[0].id);
        const docs = await documentsHttp.getByFarm(farms[0].id);
        setDocuments(docs);
      }
    } catch {
      console.error('Błąd ładowania');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Zgłoszenia">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Zgłoszenia"
      description="Lista zgłoszeń do IRZ+"
      actions={
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/zgloszenia/nowe-urodzenie"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🐣 Urodzenie
          </Link>
          <Link
            href="/zgloszenia/nowe-padniecie"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            💀 Padnięcie
          </Link>
          <Link
            href="/zgloszenia/nowe-przemieszczenie"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            🚚 Przemieszczenie
          </Link>
        </div>
      }
    >
      {documents.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Brak zgłoszeń</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/zgloszenia/nowe-urodzenie"
              className="text-blue-600 hover:underline"
            >
              🐣 Zgłoś urodzenie
            </Link>
            <Link
              href="/zgloszenia/nowe-padniecie"
              className="text-gray-600 hover:underline"
            >
              💀 Zgłoś padnięcie
            </Link>
            <Link
              href="/zgloszenia/nowe-przemieszczenie"
              className="text-emerald-600 hover:underline"
            >
              🚚 Zgłoś przemieszczenie
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Zwierzę
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nr dokumentu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} document={doc} onUpdate={loadData} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageTemplate>
  );
}

function DocumentRow({ document, onUpdate }: { document: Document; onUpdate: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!confirm('Czy na pewno chcesz wysłać zgłoszenie do IRZ+?')) return;

    setIsSubmitting(true);
    try {
      await documentsHttp.submit(document.id);
      onUpdate();
    } catch {
      alert('Błąd wysyłki');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabels: Record<string, string> = {
    DEATH_REPORT: 'Padnięcie',
    BIRTH_REPORT: 'Urodzenie',
    TRANSFER_REPORT: 'Przemieszczenie',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium">{typeLabels[document.type] || document.type}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm">{document.animal?.earTagNumber || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={document.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{document.irzDocNumber || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">
          {new Date(document.createdAt).toLocaleDateString('pl-PL')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          {document.status === 'DRAFT' && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij'}
            </button>
          )}
          <button
            onClick={() => documentsHttp.downloadPdf(document.id)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            PDF
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    DRAFT: 'Szkic',
    PENDING: 'Wysyłanie',
    SUBMITTED: 'Wysłano',
    ACCEPTED: 'Zaakceptowano',
    REJECTED: 'Odrzucono',
    ERROR: 'Błąd',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}


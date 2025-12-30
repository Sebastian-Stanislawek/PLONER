'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { documentsHttp, Document } from '@/lib/http/documents.http';
import { farmsHttp } from '@/lib/http/farms.http';

type FilterType = 'ALL' | 'DEATH_REPORT' | 'BIRTH_REPORT' | 'TRANSFER_REPORT';
type FilterStatus = 'ALL' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export default function ArchiwumPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchEarTag, setSearchEarTag] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        const docs = await documentsHttp.getByFarm(farms[0].id);
        // Tylko wysłane/zakończone dokumenty
        const archived = docs.filter((d) => 
          ['SUBMITTED', 'ACCEPTED', 'REJECTED'].includes(d.status)
        );
        setDocuments(archived);
      }
    } catch {
      console.error('Błąd ładowania');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterType !== 'ALL' && doc.type !== filterType) return false;
    if (filterStatus !== 'ALL' && doc.status !== filterStatus) return false;
    if (searchEarTag && !doc.animal?.earTagNumber?.toLowerCase().includes(searchEarTag.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <PageTemplate title="Archiwum">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Archiwum dokumentów"
      description="Historia wysłanych zgłoszeń do IRZ+"
    >
      {/* Filtry */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Szukaj wg kolczyka</label>
          <input
            type="text"
            value={searchEarTag}
            onChange={(e) => setSearchEarTag(e.target.value)}
            placeholder="np. PL123..."
            className="px-3 py-2 border rounded-lg text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Typ dokumentu</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="ALL">Wszystkie</option>
            <option value="DEATH_REPORT">Padnięcia</option>
            <option value="BIRTH_REPORT">Urodzenia</option>
            <option value="TRANSFER_REPORT">Przemieszczenia</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="ALL">Wszystkie</option>
            <option value="SUBMITTED">Wysłane</option>
            <option value="ACCEPTED">Zaakceptowane</option>
            <option value="REJECTED">Odrzucone</option>
          </select>
        </div>
        <div className="flex-1" />
        <div>
          <span className="text-sm text-gray-500">
            Znaleziono: {filteredDocuments.length} dokumentów
          </span>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">Brak dokumentów w archiwum</p>
          <p className="text-sm text-gray-400 mt-2">
            Wysłane zgłoszenia pojawią się tutaj automatycznie
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nr dokumentu
                </th>
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
                  Data wysłania
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageTemplate>
  );
}

function DocumentRow({ document }: { document: Document }) {
  const router = useRouter();

  const typeLabels: Record<string, string> = {
    DEATH_REPORT: 'Padnięcie',
    BIRTH_REPORT: 'Urodzenie',
    TRANSFER_REPORT: 'Przemieszczenie',
  };

  const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    SUBMITTED: 'Wysłano',
    ACCEPTED: 'Zaakceptowano',
    REJECTED: 'Odrzucono',
  };

  const handleCreateSimilar = () => {
    const formData = document.formData as Record<string, string>;
    const params = new URLSearchParams();

    // Przekaż dane z formularza jako query params
    if (formData.deathCause) params.set('deathCause', formData.deathCause);
    if (formData.disposalMethod) params.set('disposalMethod', formData.disposalMethod);
    if (formData.deathPlace) params.set('deathPlace', formData.deathPlace);

    // Mapowanie typu dokumentu na odpowiednią stronę
    const typeRoutes: Record<string, string> = {
      DEATH_REPORT: '/zgloszenia/nowe-padniecie',
      BIRTH_REPORT: '/zgloszenia/nowe-urodzenie',
      TRANSFER_REPORT: '/zgloszenia/nowe-przemieszczenie',
    };

    const route = typeRoutes[document.type] || '/zgloszenia';
    router.push(`${route}?${params.toString()}`);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {document.irzDocNumber || '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm">{typeLabels[document.type] || document.type}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm">{document.animal?.earTagNumber || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusStyles[document.status] || 'bg-gray-100'
          }`}
        >
          {statusLabels[document.status] || document.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">
          {document.submittedAt
            ? new Date(document.submittedAt).toLocaleDateString('pl-PL')
            : '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-3">
        <button
          onClick={() => documentsHttp.downloadPdf(document.id)}
          className="text-sm text-emerald-600 hover:text-emerald-800"
        >
          📄 PDF
        </button>
        <button
          onClick={handleCreateSimilar}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          📋 Wystaw podobne
        </button>
      </td>
    </tr>
  );
}


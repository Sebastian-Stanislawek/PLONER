'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { animalsHttp, AnimalDetails } from '@/lib/http/animals.http';
import { documentsHttp } from '@/lib/http/documents.http';

const SPECIES_LABELS: Record<string, string> = {
  CATTLE: 'Bydło',
  SHEEP: 'Owce',
  GOAT: 'Kozy',
  PIG: 'Świnie',
  HORSE: 'Koniowate',
  POULTRY: 'Drób',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Aktywne', color: 'bg-green-100 text-green-800' },
  DECEASED: { label: 'Padłe', color: 'bg-gray-100 text-gray-800' },
  SOLD: { label: 'Sprzedane', color: 'bg-blue-100 text-blue-800' },
  SLAUGHTERED: { label: 'Ubite', color: 'bg-red-100 text-red-800' },
};

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  BIRTH: { label: 'Urodzenie', icon: '🐣' },
  DEATH: { label: 'Padnięcie', icon: '💀' },
  TRANSFER_IN: { label: 'Przyjęcie', icon: '📥' },
  TRANSFER_OUT: { label: 'Wydanie', icon: '📤' },
  SLAUGHTER: { label: 'Ubój', icon: '🔪' },
  TAG_CHANGE: { label: 'Zmiana kolczyka', icon: '🏷️' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  BIRTH_REPORT: 'Zgłoszenie urodzenia',
  DEATH_REPORT: 'Zgłoszenie padnięcia',
  TRANSFER_REPORT: 'Zgłoszenie przemieszczenia',
};

export default function AnimalDetailsPage() {
  const { id } = useParams();
  const [animal, setAnimal] = useState<AnimalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadAnimal(id);
    }
  }, [id]);

  const loadAnimal = async (animalId: string) => {
    try {
      const data = await animalsHttp.getById(animalId);
      setAnimal(data);
    } catch {
      setError('Nie znaleziono zwierzęcia');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Szczegóły zwierzęcia">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  if (error || !animal) {
    return (
      <PageTemplate title="Błąd">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-500">{error || 'Nie znaleziono zwierzęcia'}</p>
          <Link href="/zwierzeta" className="text-emerald-600 hover:underline mt-4 inline-block">
            ← Powrót do listy
          </Link>
        </div>
      </PageTemplate>
    );
  }

  const status = STATUS_LABELS[animal.status] || { label: animal.status, color: 'bg-gray-100' };

  return (
    <PageTemplate
      title={animal.earTagNumber}
      description={`${SPECIES_LABELS[animal.species] || animal.species} ${animal.breed ? `• ${animal.breed}` : ''}`}
      breadcrumbs={[
        { label: 'Zwierzęta', href: '/zwierzeta' },
        { label: SPECIES_LABELS[animal.species] || animal.species, href: `/zwierzeta/${animal.species.toLowerCase()}` },
        { label: animal.earTagNumber, href: `/zwierzeta/szczegoly/${animal.id}` },
      ]}
      actions={
        animal.status === 'ACTIVE' && (
          <Link
            href={`/zgloszenia/nowe-padniecie?animalId=${animal.id}`}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            💀 Zgłoś padnięcie
          </Link>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dane podstawowe */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Dane zwierzęcia</h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Numer kolczyka</dt>
                <dd className="font-mono font-medium">{animal.earTagNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Gatunek</dt>
                <dd className="font-medium">{SPECIES_LABELS[animal.species] || animal.species}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Płeć</dt>
                <dd className="font-medium">{animal.gender === 'MALE' ? 'Samiec' : 'Samica'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Rasa</dt>
                <dd className="font-medium">{animal.breed || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Data urodzenia</dt>
                <dd className="font-medium">
                  {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('pl-PL') : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Matka (kolczyk)</dt>
                <dd className="font-medium font-mono">{animal.motherEarTag || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Gospodarstwo</dt>
                <dd className="font-medium">{animal.farm.name || animal.farm.producerNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ostatnia synchronizacja</dt>
                <dd className="font-medium">
                  {animal.syncedAt ? new Date(animal.syncedAt).toLocaleDateString('pl-PL') : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Historia życia</h2>

            {animal.events.length === 0 && animal.documents.length === 0 ? (
              <p className="text-gray-500">Brak zdarzeń</p>
            ) : (
              <Timeline animal={animal} />
            )}
          </div>
        </div>

        {/* Dokumenty */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Dokumenty</h2>

            {animal.documents.length === 0 ? (
              <p className="text-gray-500 text-sm">Brak dokumentów</p>
            ) : (
              <div className="space-y-3">
                {animal.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-3">
                    <p className="font-medium text-sm">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={doc.status} />
                      <button
                        onClick={() => documentsHttp.downloadPdf(doc.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Szybkie akcje */}
          {animal.status === 'ACTIVE' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Akcje</h2>
              <div className="space-y-2">
                <Link
                  href={`/zgloszenia/nowe-padniecie?animalId=${animal.id}`}
                  className="block w-full px-4 py-2 text-center border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  💀 Zgłoś padnięcie
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}

function Timeline({ animal }: { animal: AnimalDetails }) {
  // Połącz eventy i dokumenty w jedną timeline
  const timelineItems: Array<{
    id: string;
    date: Date;
    type: 'event' | 'document';
    label: string;
    icon: string;
    description?: string;
  }> = [];

  for (const event of animal.events) {
    const eventInfo = EVENT_LABELS[event.eventType] || { label: event.eventType, icon: '📋' };
    timelineItems.push({
      id: event.id,
      date: new Date(event.eventDate),
      type: 'event',
      label: eventInfo.label,
      icon: eventInfo.icon,
      description: event.description || undefined,
    });
  }

  for (const doc of animal.documents) {
    timelineItems.push({
      id: doc.id,
      date: new Date(doc.createdAt),
      type: 'document',
      label: DOC_TYPE_LABELS[doc.type] || doc.type,
      icon: '📄',
      description: doc.status === 'SUBMITTED' ? `Nr: ${doc.irzDocNumber}` : `Status: ${doc.status}`,
    });
  }

  // Dodaj urodzenie jeśli jest data
  if (animal.birthDate) {
    timelineItems.push({
      id: 'birth',
      date: new Date(animal.birthDate),
      type: 'event',
      label: 'Urodzenie',
      icon: '🐣',
      description: animal.motherEarTag ? `Matka: ${animal.motherEarTag}` : undefined,
    });
  }

  // Sortuj od najnowszych
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {timelineItems.map((item) => (
          <div key={item.id} className="relative pl-10">
            <div className="absolute left-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-sm">
              {item.icon}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{item.label}</p>
                <span className="text-xs text-gray-500">
                  {item.date.toLocaleDateString('pl-PL')}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SUBMITTED: 'bg-blue-100 text-blue-600',
    ACCEPTED: 'bg-green-100 text-green-600',
    REJECTED: 'bg-red-100 text-red-600',
  };

  const labels: Record<string, string> = {
    DRAFT: 'Szkic',
    SUBMITTED: 'Wysłano',
    ACCEPTED: 'OK',
    REJECTED: 'Odrzucono',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}


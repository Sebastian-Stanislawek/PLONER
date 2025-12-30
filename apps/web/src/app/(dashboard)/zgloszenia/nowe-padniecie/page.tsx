'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { animalsHttp } from '@/lib/http/animals.http';
import { farmsHttp } from '@/lib/http/farms.http';
import { documentsHttp, CreateDeathReportRequest } from '@/lib/http/documents.http';
import type { Animal } from '@ploner/types';

const DEATH_CAUSES = [
  { value: 'NATURAL', label: 'Przyczyny naturalne' },
  { value: 'DISEASE', label: 'Choroba' },
  { value: 'ACCIDENT', label: 'Wypadek' },
  { value: 'EUTHANASIA', label: 'Eutanazja' },
  { value: 'UNKNOWN', label: 'Nieznana' },
];

const DISPOSAL_METHODS = [
  { value: 'RENDERING_PLANT', label: 'Zakład utylizacyjny' },
  { value: 'BURIAL', label: 'Pochówek na terenie gospodarstwa' },
  { value: 'VETERINARY', label: 'Przekazano do badań weterynaryjnych' },
];

export default function NowePadnieciePage() {
  return (
    <Suspense fallback={<PageTemplate title="Zgłoszenie padnięcia"><div className="text-center py-12 text-gray-500">Ładowanie...</div></PageTemplate>}>
      <DeathReportForm />
    </Suspense>
  );
}

function DeathReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [deathCause, setDeathCause] = useState<CreateDeathReportRequest['deathCause']>('NATURAL');
  const [disposalMethod, setDisposalMethod] = useState<CreateDeathReportRequest['disposalMethod']>('RENDERING_PLANT');

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  // Wypełnij formularz danymi z query params (funkcja "Wystaw podobne")
  useEffect(() => {
    const cause = searchParams.get('deathCause');
    const method = searchParams.get('disposalMethod');

    if (cause && DEATH_CAUSES.some((c) => c.value === cause)) {
      setDeathCause(cause as CreateDeathReportRequest['deathCause']);
      setPrefilled(true);
    }
    if (method && DISPOSAL_METHODS.some((m) => m.value === method)) {
      setDisposalMethod(method as CreateDeathReportRequest['disposalMethod']);
      setPrefilled(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        const response = await animalsHttp.getByFarm(farms[0].id, { status: 'ACTIVE' });
        setAnimals(response.items);
      }
    } catch {
      setError('Błąd ładowania zwierząt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId) {
      setError('Wybierz zwierzę');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await documentsHttp.createDeathReport({
        animalId: selectedAnimalId,
        deathDate,
        deathCause,
        disposalMethod,
      });

      router.push('/zgloszenia');
    } catch {
      setError('Błąd tworzenia zgłoszenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Zgłoszenie padnięcia">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Zgłoszenie padnięcia"
      description="Wypełnij formularz zgłoszenia padnięcia zwierzęcia"
      breadcrumbs={[
        { label: 'Zgłoszenia', href: '/zgloszenia' },
        { label: 'Nowe padnięcie', href: '/zgloszenia/nowe-padniecie' },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-2xl">
        {prefilled && (
          <div className="mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
            📋 Formularz wypełniony na podstawie poprzedniego zgłoszenia. Wybierz zwierzę i zweryfikuj dane.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Wybór zwierzęcia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz zwierzę *
            </label>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Wybierz zwierzę --</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.earTagNumber} - {animal.species} {animal.breed ? `(${animal.breed})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dane wybranego zwierzęcia */}
          {selectedAnimal && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">Dane zwierzęcia</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Nr kolczyka</dt>
                  <dd className="font-medium">{selectedAnimal.earTagNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Gatunek</dt>
                  <dd className="font-medium">{selectedAnimal.species}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rasa</dt>
                  <dd className="font-medium">{selectedAnimal.breed || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Płeć</dt>
                  <dd className="font-medium">
                    {selectedAnimal.gender === 'MALE' ? 'Samiec' : 'Samica'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Data padnięcia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data padnięcia *
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Przyczyna padnięcia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Przyczyna padnięcia *
            </label>
            <select
              value={deathCause}
              onChange={(e) => setDeathCause(e.target.value as CreateDeathReportRequest['deathCause'])}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {DEATH_CAUSES.map((cause) => (
                <option key={cause.value} value={cause.value}>
                  {cause.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sposób utylizacji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sposób utylizacji *
            </label>
            <select
              value={disposalMethod}
              onChange={(e) => setDisposalMethod(e.target.value as CreateDeathReportRequest['disposalMethod'])}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {DISPOSAL_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Przyciski */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAnimalId}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Tworzenie...' : 'Utwórz zgłoszenie'}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Po utworzeniu zgłoszenia możesz je wysłać do IRZ+ lub pobrać jako PDF.
        </p>
      </form>
    </PageTemplate>
  );
}

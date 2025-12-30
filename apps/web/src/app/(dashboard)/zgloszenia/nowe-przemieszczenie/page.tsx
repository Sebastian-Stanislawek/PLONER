'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { documentsHttp, TransferDirection } from '@/lib/http/documents.http';
import { animalsHttp } from '@/lib/http/animals.http';
import { farmsHttp } from '@/lib/http/farms.http';
import { useToast } from '@/components/shared/Toast';

interface Animal {
  id: string;
  earTagNumber: string;
  species: string;
  breed?: string | null;
  status: string;
}

function NowePrzemieszczeniForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnimals, setIsLoadingAnimals] = useState(true);

  // Form state
  const [animalId, setAnimalId] = useState(searchParams.get('animalId') || '');
  const [direction, setDirection] = useState<TransferDirection>(
    (searchParams.get('direction') as TransferDirection) || 'OUT'
  );
  const [transferDate, setTransferDate] = useState(
    searchParams.get('transferDate') || new Date().toISOString().split('T')[0]
  );
  const [otherProducerNumber, setOtherProducerNumber] = useState(
    searchParams.get('otherProducerNumber') || ''
  );
  const [otherHerdNumber, setOtherHerdNumber] = useState(
    searchParams.get('otherHerdNumber') || ''
  );
  const [otherFarmName, setOtherFarmName] = useState(
    searchParams.get('otherFarmName') || ''
  );
  const [reason, setReason] = useState(searchParams.get('reason') || '');
  const [transportDocNumber, setTransportDocNumber] = useState(
    searchParams.get('transportDocNumber') || ''
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        setFarmId(farms[0].id);
        const response = await animalsHttp.getByFarm(farms[0].id, { status: 'ACTIVE' });
        setAnimals(response.items);
      }
    } catch {
      showToast('Błąd ładowania danych', 'error');
    } finally {
      setIsLoadingAnimals(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!animalId) {
      showToast('Wybierz zwierzę', 'error');
      return;
    }

    if (!otherProducerNumber || !otherHerdNumber) {
      showToast('Podaj dane gospodarstwa docelowego/źródłowego', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const doc = await documentsHttp.createTransferReport({
        animalId,
        direction,
        transferDate,
        otherProducerNumber,
        otherHerdNumber,
        otherFarmName: otherFarmName || undefined,
        reason: reason || undefined,
        transportDocNumber: transportDocNumber || undefined,
      });

      showToast('Zgłoszenie przemieszczenia utworzone', 'success');
      router.push(`/zgloszenia`);
    } catch (error) {
      showToast('Błąd tworzenia zgłoszenia', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAnimal = animals.find((a) => a.id === animalId);

  const REASON_OPTIONS = [
    { value: '', label: 'Wybierz powód (opcjonalnie)' },
    { value: 'SPRZEDAZ', label: 'Sprzedaż' },
    { value: 'KUPNO', label: 'Kupno' },
    { value: 'DZIERZAWA', label: 'Dzierżawa' },
    { value: 'HODOWLA', label: 'Przekazanie do hodowli' },
    { value: 'UBOJ', label: 'Przekazanie do uboju' },
    { value: 'WYSTAWA', label: 'Wystawa/pokaz' },
    { value: 'INNE', label: 'Inne' },
  ];

  return (
    <PageTemplate
      title="Nowe zgłoszenie przemieszczenia"
      description="Zgłoś przyjęcie lub wydanie zwierzęcia"
    >
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kierunek przemieszczenia */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Typ przemieszczenia</h2>
            
            <div className="flex gap-4">
              <label
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  direction === 'OUT'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="direction"
                  value="OUT"
                  checked={direction === 'OUT'}
                  onChange={() => setDirection('OUT')}
                  className="sr-only"
                />
                <div className="text-center">
                  <span className="text-2xl">📤</span>
                  <p className="font-medium mt-2">Wydanie</p>
                  <p className="text-sm text-gray-500">z mojego gospodarstwa</p>
                </div>
              </label>

              <label
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  direction === 'IN'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="direction"
                  value="IN"
                  checked={direction === 'IN'}
                  onChange={() => setDirection('IN')}
                  className="sr-only"
                />
                <div className="text-center">
                  <span className="text-2xl">📥</span>
                  <p className="font-medium mt-2">Przyjęcie</p>
                  <p className="text-sm text-gray-500">do mojego gospodarstwa</p>
                </div>
              </label>
            </div>
          </div>

          {/* Wybór zwierzęcia */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Zwierzę</h2>

            {isLoadingAnimals ? (
              <div className="text-center py-4 text-gray-500">Ładowanie...</div>
            ) : animals.length === 0 ? (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-lg text-sm">
                ⚠️ Brak aktywnych zwierząt w gospodarstwie
              </div>
            ) : (
              <>
                <select
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Wybierz zwierzę</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.earTagNumber} - {animal.species} {animal.breed ? `(${animal.breed})` : ''}
                    </option>
                  ))}
                </select>

                {selectedAnimal && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <span className="text-gray-500">Kolczyk:</span>{' '}
                      <span className="font-medium">{selectedAnimal.earTagNumber}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Gatunek:</span>{' '}
                      <span className="font-medium">{selectedAnimal.species}</span>
                    </p>
                    {selectedAnimal.breed && (
                      <p className="text-sm">
                        <span className="text-gray-500">Rasa:</span>{' '}
                        <span className="font-medium">{selectedAnimal.breed}</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dane przemieszczenia */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Dane przemieszczenia</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data przemieszczenia *
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Powód przemieszczenia
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nr dokumentu przewozowego
                </label>
                <input
                  type="text"
                  value={transportDocNumber}
                  onChange={(e) => setTransportDocNumber(e.target.value)}
                  placeholder="np. DP/2024/001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dane drugiego gospodarstwa */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">
              {direction === 'OUT' ? 'Gospodarstwo docelowe' : 'Gospodarstwo źródłowe'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer producenta *
                </label>
                <input
                  type="text"
                  value={otherProducerNumber}
                  onChange={(e) => setOtherProducerNumber(e.target.value)}
                  required
                  placeholder="np. 123456789"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer siedziby stada *
                </label>
                <input
                  type="text"
                  value={otherHerdNumber}
                  onChange={(e) => setOtherHerdNumber(e.target.value)}
                  required
                  placeholder="np. PL123456789001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa gospodarstwa
                </label>
                <input
                  type="text"
                  value={otherFarmName}
                  onChange={(e) => setOtherFarmName(e.target.value)}
                  placeholder="np. Gospodarstwo Rolne Kowalski"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading || !animalId}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Tworzenie...' : 'Utwórz zgłoszenie'}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}

export default function NowePrzemieszczeniePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Ładowanie...</div>}>
      <NowePrzemieszczeniForm />
    </Suspense>
  );
}


'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { animalsHttp } from '@/lib/http/animals.http';
import { farmsHttp } from '@/lib/http/farms.http';
import { documentsHttp, CreateBirthReportRequest, Species, Gender } from '@/lib/http/documents.http';
import type { Animal } from '@ploner/types';

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'CATTLE', label: 'Bydło' },
  { value: 'SHEEP', label: 'Owce' },
  { value: 'GOAT', label: 'Kozy' },
  { value: 'PIG', label: 'Świnie' },
  { value: 'HORSE', label: 'Koniowate' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'FEMALE', label: 'Samica' },
  { value: 'MALE', label: 'Samiec' },
];

export default function NoweUrodzeniePageWrapper() {
  return (
    <Suspense fallback={<PageTemplate title="Zgłoszenie urodzenia"><div className="text-center py-12 text-gray-500">Ładowanie...</div></PageTemplate>}>
      <NoweUrodzenieForm />
    </Suspense>
  );
}

function NoweUrodzenieForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [farmId, setFarmId] = useState<string | null>(null);
  const [mothers, setMothers] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // Form fields
  const [earTagNumber, setEarTagNumber] = useState('');
  const [species, setSpecies] = useState<Species>('CATTLE');
  const [gender, setGender] = useState<Gender>('FEMALE');
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [breed, setBreed] = useState('');
  const [motherId, setMotherId] = useState('');
  const [motherEarTag, setMotherEarTag] = useState('');

  const selectedMother = mothers.find((m) => m.id === motherId);

  // Prefill from query params
  useEffect(() => {
    const sp = searchParams.get('species');
    const br = searchParams.get('breed');

    if (sp && SPECIES_OPTIONS.some((o) => o.value === sp)) {
      setSpecies(sp as Species);
      setPrefilled(true);
    }
    if (br) {
      setBreed(br);
      setPrefilled(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (farmId && species) {
      loadMothers();
    }
  }, [farmId, species]);

  const loadData = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        setFarmId(farms[0].id);
      }
    } catch {
      setError('Błąd ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMothers = async () => {
    if (!farmId) return;
    try {
      const response = await animalsHttp.getByFarm(farmId, { 
        status: 'ACTIVE',
        species,
      });
      // Filtruj tylko samice
      setMothers(response.items.filter((a) => a.gender === 'FEMALE'));
    } catch {
      console.error('Błąd ładowania matek');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) {
      setError('Brak gospodarstwa');
      return;
    }

    if (!earTagNumber.trim()) {
      setError('Podaj numer kolczyka');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data: CreateBirthReportRequest = {
        farmId,
        earTagNumber: earTagNumber.trim(),
        species,
        gender,
        birthDate,
        breed: breed || undefined,
        motherId: motherId || undefined,
        motherEarTag: motherEarTag || selectedMother?.earTagNumber || undefined,
      };

      await documentsHttp.createBirthReport(data);
      router.push('/zgloszenia');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Błąd tworzenia zgłoszenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Zgłoszenie urodzenia">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Zgłoszenie urodzenia"
      description="Zarejestruj nowe zwierzę urodzone w gospodarstwie"
      breadcrumbs={[
        { label: 'Zgłoszenia', href: '/zgloszenia' },
        { label: 'Nowe urodzenie', href: '/zgloszenia/nowe-urodzenie' },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-2xl">
        {prefilled && (
          <div className="mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
            📋 Formularz wypełniony na podstawie poprzedniego zgłoszenia.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Numer kolczyka */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numer kolczyka noworodka *
            </label>
            <input
              type="text"
              value={earTagNumber}
              onChange={(e) => setEarTagNumber(e.target.value.toUpperCase())}
              required
              placeholder="np. PL123456789001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: PL + 12 cyfr (np. PL123456789001)
            </p>
          </div>

          {/* Gatunek i płeć */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gatunek *
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Płeć *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data urodzenia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data urodzenia *
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Urodzenie należy zgłosić w ciągu 7 dni
            </p>
          </div>

          {/* Rasa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rasa (opcjonalnie)
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="np. Holsztyńsko-Fryzyjska"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Wybór matki */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Dane matki</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz matkę z listy
                </label>
                <select
                  value={motherId}
                  onChange={(e) => {
                    setMotherId(e.target.value);
                    if (e.target.value) setMotherEarTag('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Nieznana / Nie wybrano --</option>
                  {mothers.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.earTagNumber} {animal.breed ? `(${animal.breed})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!motherId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lub podaj numer kolczyka matki ręcznie
                  </label>
                  <input
                    type="text"
                    value={motherEarTag}
                    onChange={(e) => setMotherEarTag(e.target.value.toUpperCase())}
                    placeholder="np. PL123456789000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              )}

              {selectedMother && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Wybrana matka</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Nr kolczyka</dt>
                      <dd className="font-medium">{selectedMother.earTagNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Rasa</dt>
                      <dd className="font-medium">{selectedMother.breed || '-'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
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
              disabled={isSubmitting || !earTagNumber}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Tworzenie...' : 'Utwórz zgłoszenie'}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Po utworzeniu zgłoszenia nowe zwierzę zostanie automatycznie dodane do stada.
          Możesz później wysłać zgłoszenie do IRZ+ lub pobrać jako PDF.
        </p>
      </form>
    </PageTemplate>
  );
}



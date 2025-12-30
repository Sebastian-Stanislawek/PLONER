'use client';

import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { farmsHttp } from '@/lib/http/farms.http';
import { syncHttp } from '@/lib/http/sync.http';
import type { Farm, SyncStatusResponse } from '@ploner/types';

export default function GospodarstwoPage() {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIrzModal, setShowIrzModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadFarm();
  }, []);

  const loadFarm = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) setFarm(farms[0]);
    } catch {
      console.error('Błąd ładowania gospodarstwa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!farm) return;
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const { jobId } = await syncHttp.start(farm.id);
      pollSyncStatus(jobId);
    } catch {
      setIsSyncing(false);
      alert('Błąd rozpoczęcia synchronizacji');
    }
  };

  const pollSyncStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const status = await syncHttp.getStatus(jobId);
        setSyncStatus(status);

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          setIsSyncing(false);
          loadFarm();
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setIsSyncing(false);
      }
    };
    poll();
  };

  if (isLoading) {
    return (
      <PageTemplate title="Gospodarstwo">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  if (!farm) {
    return (
      <PageTemplate title="Gospodarstwo" actions={<AddFarmButton onAdded={loadFarm} />}>
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Nie masz jeszcze dodanego gospodarstwa</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={farm.name || 'Moje gospodarstwo'}
      description={`Nr producenta: ${farm.producerNumber}`}
      actions={
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <span className="animate-spin">⟳</span>
              Synchronizacja...
            </>
          ) : (
            <>🔄 Synchronizuj z IRZ+</>
          )}
        </button>
      }
    >
      {syncStatus && (
        <SyncProgressBar status={syncStatus} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Dane gospodarstwa</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Nr producenta</dt>
              <dd className="font-medium">{farm.producerNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Nr siedziby stada</dt>
              <dd className="font-medium">{farm.herdNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Adres</dt>
              <dd className="font-medium">{farm.address || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Ostatnia synchronizacja</dt>
              <dd className="font-medium">
                {farm.lastSyncAt ? new Date(farm.lastSyncAt).toLocaleString('pl-PL') : 'Nigdy'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Połączenie z IRZ+</h2>
          <p className="text-sm text-gray-500 mb-4">
            Podłącz swoje konto IRZ+ aby synchronizować dane zwierząt
          </p>
          <button
            onClick={() => setShowIrzModal(true)}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50"
          >
            ⚙️ Konfiguruj połączenie
          </button>
        </div>
      </div>

      {showIrzModal && (
        <IrzCredentialsModal
          farmId={farm.id}
          onClose={() => setShowIrzModal(false)}
          onSaved={() => {
            setShowIrzModal(false);
            loadFarm();
          }}
        />
      )}
    </PageTemplate>
  );
}

function SyncProgressBar({ status }: { status: SyncStatusResponse }) {
  const progress = status.progress || 0;
  const isComplete = status.status === 'COMPLETED';
  const isFailed = status.status === 'FAILED';

  return (
    <div className={`mb-6 p-4 rounded-lg ${isFailed ? 'bg-red-50' : 'bg-emerald-50'}`}>
      <div className="flex justify-between text-sm mb-2">
        <span className={isFailed ? 'text-red-700' : 'text-emerald-700'}>
          {isFailed ? '❌ Błąd synchronizacji' : isComplete ? '✅ Synchronizacja zakończona' : '🔄 Synchronizacja w toku...'}
        </span>
        <span className="text-gray-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isFailed ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isComplete && status.entitiesSynced !== undefined && (
        <p className="text-sm text-emerald-700 mt-2">
          Zsynchronizowano {status.entitiesSynced} zwierząt
        </p>
      )}
      {isFailed && status.errorMessage && (
        <p className="text-sm text-red-700 mt-2">{status.errorMessage}</p>
      )}
    </div>
  );
}

function IrzCredentialsModal({
  farmId,
  onClose,
  onSaved,
}: {
  farmId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await farmsHttp.setIrzCredentials(farmId, { irzLogin: login, irzPassword: password });
      onSaved();
    } catch {
      setError('Nie udało się zapisać danych');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Dane logowania IRZ+</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login IRZ+</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Twój login do portalu IRZ+"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasło IRZ+</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Twoje hasło do portalu IRZ+"
            />
          </div>

          <p className="text-xs text-gray-500">
            Dane są szyfrowane i przechowywane bezpiecznie. Używamy ich wyłącznie do synchronizacji z IRZ+.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFarmButton({ onAdded }: { onAdded: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [producerNumber, setProducerNumber] = useState('');
  const [herdNumber, setHerdNumber] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await farmsHttp.create({ producerNumber, herdNumber, name });
      setShowModal(false);
      onAdded();
    } catch {
      alert('Błąd dodawania gospodarstwa');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        + Dodaj gospodarstwo
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Dodaj gospodarstwo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nr producenta</label>
            <input
              type="text"
              value={producerNumber}
              onChange={(e) => setProducerNumber(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nr siedziby stada</label>
            <input
              type="text"
              value={herdNumber}
              onChange={(e) => setHerdNumber(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa (opcjonalnie)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Dodawanie...' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



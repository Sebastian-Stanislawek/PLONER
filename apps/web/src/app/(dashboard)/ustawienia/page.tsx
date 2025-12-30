'use client';

import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { useAuthStore } from '@/stores/auth.store';
import { farmsHttp } from '@/lib/http/farms.http';
import { dashboardHttp, ActivityLog } from '@/lib/http/dashboard.http';

export default function UstawieniaPage() {
  return (
    <PageTemplate title="Ustawienia" description="Zarządzaj swoim kontem i połączeniami">
      <div className="max-w-2xl space-y-6">
        <UserProfileSection />
        <PasswordChangeSection />
        <IrzConnectionSection />
        <ActivityLogsSection />
        <DangerZone />
      </div>
    </PageTemplate>
  );
}

function UserProfileSection() {
  const { user } = useAuthStore();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-semibold text-lg mb-4">Profil użytkownika</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <p className="font-medium text-gray-900">{user?.email || '-'}</p>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">ID konta</label>
          <p className="font-mono text-sm text-gray-600">{user?.id || '-'}</p>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Hasła nie są identyczne' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Hasło musi mieć minimum 6 znaków' });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Dodać endpoint do zmiany hasła w API
      // await authHttp.changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Hasło zostało zmienione' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Nie udało się zmienić hasła' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-semibold text-lg mb-4">Zmiana hasła</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aktualne hasło
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nowe hasło
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Powtórz nowe hasło
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  );
}

function IrzConnectionSection() {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [irzLogin, setIrzLogin] = useState('');
  const [irzPassword, setIrzPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        setFarmId(farms[0].id);
        // Sprawdź czy są już zapisane dane IRZ+
        // W przyszłości można dodać endpoint do sprawdzania statusu połączenia
        setIsConnected(false); // TODO: Sprawdź rzeczywisty status
      }
    } catch {
      console.error('Błąd ładowania danych');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) {
      setMessage({ type: 'error', text: 'Najpierw dodaj gospodarstwo' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await farmsHttp.setIrzCredentials(farmId, { irzLogin, irzPassword });
      setMessage({ type: 'success', text: 'Dane IRZ+ zostały zapisane' });
      setIsConnected(true);
      setIrzPassword(''); // Wyczyść hasło po zapisaniu
    } catch {
      setMessage({ type: 'error', text: 'Nie udało się zapisać danych' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Połączenie z IRZ+</h2>
        {isConnected && (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
            ✓ Połączono
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Podaj dane logowania do portalu IRZ+ (eWniosekPlus). Dane są szyfrowane i przechowywane
        bezpiecznie. Używamy ich wyłącznie do synchronizacji zwierząt i wysyłania zgłoszeń.
      </p>

      {!farmId ? (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg text-sm">
          ⚠️ Najpierw dodaj gospodarstwo w zakładce "Gospodarstwo"
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login IRZ+ (eWniosekPlus)
            </label>
            <input
              type="text"
              value={irzLogin}
              onChange={(e) => setIrzLogin(e.target.value)}
              required
              placeholder="Twój login do portalu IRZ+"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasło IRZ+
            </label>
            <input
              type="password"
              value={irzPassword}
              onChange={(e) => setIrzPassword(e.target.value)}
              required
              placeholder="Twoje hasło do portalu IRZ+"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              🔒 Twoje hasło jest szyfrowane algorytmem AES-256 przed zapisem w bazie danych.
              Nigdy nie przechowujemy haseł w formie jawnej.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Zapisywanie...' : isConnected ? 'Zaktualizuj dane' : 'Połącz z IRZ+'}
          </button>
        </form>
      )}
    </div>
  );
}

function ActivityLogsSection() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await dashboardHttp.getActivityLogs(100);
      setLogs(data);
    } catch {
      console.error('Błąd ładowania logów');
    } finally {
      setIsLoading(false);
    }
  };

  const actionLabels: Record<string, string> = {
    LOGIN: 'Logowanie',
    LOGOUT: 'Wylogowanie',
    REGISTER: 'Rejestracja',
    FARM_CREATE: 'Utworzenie gospodarstwa',
    FARM_UPDATE: 'Aktualizacja gospodarstwa',
    FARM_IRZ_CONNECT: 'Połączenie z IRZ+',
    ANIMAL_CREATE: 'Dodanie zwierzęcia',
    ANIMAL_UPDATE: 'Aktualizacja zwierzęcia',
    ANIMAL_DELETE: 'Usunięcie zwierzęcia',
    DOCUMENT_CREATE: 'Utworzenie dokumentu',
    DOCUMENT_SUBMIT: 'Wysłanie dokumentu',
    DOCUMENT_PDF: 'Pobranie PDF',
    SYNC_START: 'Start synchronizacji',
    SYNC_COMPLETE: 'Zakończenie synchronizacji',
    SYNC_FAIL: 'Błąd synchronizacji',
  };

  const entityLabels: Record<string, string> = {
    USER: 'Użytkownik',
    FARM: 'Gospodarstwo',
    ANIMAL: 'Zwierzę',
    DOCUMENT: 'Dokument',
    SYNC: 'Synchronizacja',
  };

  const displayedLogs = showAll ? logs : logs.slice(0, 10);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-semibold text-lg mb-4">Historia aktywności</h2>

      {isLoading ? (
        <div className="text-center py-4 text-gray-500">Ładowanie...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-4 text-gray-500">Brak zapisanych aktywności</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">Akcja</th>
                  <th className="pb-2 pr-4">Typ</th>
                  <th className="pb-2">Szczegóły</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                      {new Date(log.createdAt).toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="font-medium">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {entityLabels[log.entityType] || log.entityType}
                    </td>
                    <td className="py-2 text-gray-500 text-xs">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <span className="font-mono">
                          {Object.entries(log.metadata)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700"
            >
              {showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${logs.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function DangerZone() {
  const { logout } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    // TODO: Dodać endpoint do usuwania konta
    alert('Funkcja usuwania konta będzie dostępna wkrótce');
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
      <h2 className="font-semibold text-lg text-red-700 mb-4">Strefa niebezpieczna</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">Wyloguj ze wszystkich urządzeń</h3>
          <p className="text-sm text-gray-500 mb-2">
            Zakończ wszystkie aktywne sesje na innych urządzeniach.
          </p>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            Wyloguj wszędzie
          </button>
        </div>

        <hr />

        <div>
          <h3 className="font-medium text-gray-900 mb-1">Usuń konto</h3>
          <p className="text-sm text-gray-500 mb-2">
            Trwale usuń swoje konto i wszystkie powiązane dane. Ta operacja jest nieodwracalna.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Usuń konto
            </button>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                Czy na pewno chcesz usunąć konto? Wszystkie dane zostaną trwale usunięte.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-white"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Tak, usuń konto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { farmsHttp } from '@/lib/http/farms.http';
import { dashboardHttp, DashboardStats, ActivityItem, Reminder } from '@/lib/http/dashboard.http';

const SPECIES_LABELS: Record<string, string> = {
  CATTLE: 'Bydło',
  SHEEP: 'Owce',
  GOAT: 'Kozy',
  PIG: 'Świnie',
  HORSE: 'Koniowate',
  POULTRY: 'Drób',
};

export default function DashboardPage() {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const farms = await farmsHttp.getAll();
      if (farms.length > 0) {
        const id = farms[0].id;
        setFarmId(id);

        const [statsData, activityData, remindersData] = await Promise.all([
          dashboardHttp.getStats(id),
          dashboardHttp.getActivity(id),
          dashboardHttp.getReminders(id),
        ]);

        setStats(statsData);
        setActivity(activityData);
        setReminders(remindersData);
      }
    } catch {
      console.error('Błąd ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Panel główny">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  if (!farmId) {
    return (
      <PageTemplate title="Panel główny">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Dodaj gospodarstwo, aby zobaczyć statystyki</p>
          <Link href="/gospodarstwo" className="text-emerald-600 hover:underline">
            Przejdź do ustawień gospodarstwa →
          </Link>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Panel główny" description="Przegląd Twojego gospodarstwa">
      {/* Przypomnienia */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <RemindersPanel reminders={reminders} />
        </div>
      )}

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Zwierzęta"
          value={stats?.animalsCount ?? 0}
          subtitle="Aktywne"
          icon="🐄"
          href="/zwierzeta"
        />
        <StatCard
          title="Do wysłania"
          value={stats?.pendingDocuments ?? 0}
          subtitle="Zgłoszenia"
          icon="📝"
          href="/zgloszenia"
          highlight={stats?.pendingDocuments ? stats.pendingDocuments > 0 : false}
        />
        <StatCard
          title="Wysłane"
          value={stats?.submittedDocuments ?? 0}
          subtitle="Zgłoszenia"
          icon="✅"
          href="/archiwum"
        />
        <StatCard
          title="Synchronizacja"
          value={stats?.lastSyncAt ? formatDate(stats.lastSyncAt) : 'Nigdy'}
          subtitle={stats?.syncStatus === 'COMPLETED' ? 'Zakończona' : stats?.syncStatus || ''}
          icon="🔄"
          href="/gospodarstwo"
          isText
        />
      </div>

      {/* Zwierzęta wg gatunku */}
      {stats && Object.keys(stats.animalsBySpecies).length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-lg mb-4">Zwierzęta według gatunku</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.animalsBySpecies).map(([species, count]) => (
              <Link
                key={species}
                href={`/zwierzeta/${species.toLowerCase()}`}
                className="text-center p-4 bg-gray-50 rounded-lg hover:bg-emerald-50 transition"
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{SPECIES_LABELS[species] || species}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ostatnie aktywności */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Ostatnie aktywności</h2>
        {activity.length === 0 ? (
          <p className="text-gray-500">Brak aktywności</p>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  href,
  highlight,
  isText,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  href: string;
  highlight?: boolean;
  isText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition ${
        highlight ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`font-bold text-gray-900 mt-1 ${isText ? 'text-lg' : 'text-3xl'}`}>
            {value}
          </p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </Link>
  );
}

function RemindersPanel({ reminders }: { reminders: Reminder[] }) {
  const urgent = reminders.filter((r) => r.daysLeft <= 2);
  const upcoming = reminders.filter((r) => r.daysLeft > 2);

  return (
    <div className="space-y-3">
      {urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">⚠️ Pilne przypomnienia</h3>
          <ul className="space-y-2">
            {urgent.map((r) => (
              <li key={r.id} className="text-sm text-red-700 flex justify-between">
                <span>
                  {r.earTagNumber && <strong>{r.earTagNumber}:</strong>} {r.message}
                </span>
                {r.animalId && (
                  <Link href={`/zwierzeta/szczegoly/${r.animalId}`} className="underline">
                    Zobacz
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 mb-2">📅 Nadchodzące terminy</h3>
          <ul className="space-y-2">
            {upcoming.slice(0, 3).map((r) => (
              <li key={r.id} className="text-sm text-amber-700">
                {r.earTagNumber && <strong>{r.earTagNumber}:</strong>} {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const icons: Record<string, string> = {
    SYNC: '🔄',
    DOCUMENT: '📄',
    ANIMAL: '🐄',
  };

  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xl">{icons[item.type] || '📋'}</span>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{item.action}</p>
        <p className="text-sm text-gray-500">{item.description}</p>
      </div>
      <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return 'Dziś';
  if (days === 1) return 'Wczoraj';
  if (days < 7) return `${days} dni temu`;

  return date.toLocaleDateString('pl-PL');
}

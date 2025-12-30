'use client';

import { useEffect } from 'react';
import { useAnimalsStore } from '@/stores/animals.store';
import { LoadingState } from '@/components/shared/LoadingState';
import type { Species } from '@ploner/types';

interface Props {
  species: string;
}

export function AnimalListTemplate({ species }: Props) {
  const { animals, isLoading, error, setFilters } = useAnimalsStore();

  useEffect(() => {
    setFilters({ species: species as Species });
  }, [species, setFilters]);

  if (isLoading) return <LoadingState message="Ładowanie zwierząt..." />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  if (animals.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500">Brak zwierząt w tej kategorii</p>
        <p className="text-sm text-gray-400 mt-2">Zsynchronizuj dane z IRZ+ aby pobrać listę zwierząt</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr kolczyka</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rasa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Płeć</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {animals.map((animal) => (
            <tr key={animal.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium">{animal.earTagNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap">{animal.breed || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{animal.gender === 'MALE' ? 'Samiec' : 'Samica'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={animal.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    DECEASED: 'bg-gray-100 text-gray-800',
    SOLD: 'bg-blue-100 text-blue-800',
    SLAUGHTERED: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    ACTIVE: 'Aktywny',
    DECEASED: 'Padły',
    SOLD: 'Sprzedany',
    SLAUGHTERED: 'Ubity',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}


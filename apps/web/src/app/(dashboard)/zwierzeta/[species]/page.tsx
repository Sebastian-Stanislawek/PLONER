'use client';

import { use } from 'react';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { AnimalListTemplate } from '../_components/AnimalListTemplate';

const SPECIES_CONFIG: Record<string, { title: string; apiKey: string }> = {
  bydlo: { title: 'Bydło', apiKey: 'CATTLE' },
  owce: { title: 'Owce', apiKey: 'SHEEP' },
  kozy: { title: 'Kozy', apiKey: 'GOAT' },
  swinie: { title: 'Świnie', apiKey: 'PIG' },
  koniowate: { title: 'Koniowate', apiKey: 'HORSE' },
  drob: { title: 'Drób', apiKey: 'POULTRY' },
};

interface Props {
  params: Promise<{ species: string }>;
}

export default function SpeciesPage({ params }: Props) {
  const { species } = use(params);
  const config = SPECIES_CONFIG[species] || { title: species, apiKey: species.toUpperCase() };

  return (
    <PageTemplate
      title={config.title}
      breadcrumbs={[
        { label: 'Zwierzęta', href: '/zwierzeta' },
        { label: config.title, href: `/zwierzeta/${species}` },
      ]}
      actions={
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Synchronizuj z IRZ+
        </button>
      }
    >
      <AnimalListTemplate species={config.apiKey} />
    </PageTemplate>
  );
}



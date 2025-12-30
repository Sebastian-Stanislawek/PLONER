import Link from 'next/link';
import { PageTemplate } from '@/components/shared/PageTemplate';

const SPECIES_CONFIG = [
  { slug: 'bydlo', label: 'Bydło', icon: '🐄', apiKey: 'CATTLE' },
  { slug: 'owce', label: 'Owce', icon: '🐑', apiKey: 'SHEEP' },
  { slug: 'kozy', label: 'Kozy', icon: '🐐', apiKey: 'GOAT' },
  { slug: 'swinie', label: 'Świnie', icon: '🐷', apiKey: 'PIG' },
  { slug: 'koniowate', label: 'Koniowate', icon: '🐴', apiKey: 'HORSE' },
  { slug: 'drob', label: 'Drób', icon: '🐔', apiKey: 'POULTRY' },
];

export default function AnimalsPage() {
  return (
    <PageTemplate
      title="Zwierzęta"
      description="Wybierz kategorię zwierząt"
      breadcrumbs={[{ label: 'Zwierzęta', href: '/zwierzeta' }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SPECIES_CONFIG.map((species) => (
          <Link
            key={species.slug}
            href={`/zwierzeta/${species.slug}`}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <span className="text-4xl">{species.icon}</span>
            <p className="mt-2 font-medium text-gray-900">{species.label}</p>
          </Link>
        ))}
      </div>
    </PageTemplate>
  );
}



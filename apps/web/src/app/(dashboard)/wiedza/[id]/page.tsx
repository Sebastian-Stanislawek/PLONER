'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageTemplate } from '@/components/shared/PageTemplate';
import { knowledgeHttp, KnowledgeArticle } from '@/lib/http/knowledge.http';

const CATEGORY_NAMES: Record<string, string> = {
  LEGAL: 'Przepisy prawne',
  IRZ_PROCEDURES: 'Procedury IRZ',
  DEADLINES: 'Terminy',
  SUBSIDIES: 'Dotacje',
  ANIMAL_HEALTH: 'Zdrowie zwierząt',
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [params.id]);

  const loadArticle = async () => {
    try {
      const data = await knowledgeHttp.getArticle(params.id as string);
      setArticle(data);
    } catch {
      console.error('Błąd ładowania artykułu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Ładowanie...">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  if (!article) {
    return (
      <PageTemplate title="Nie znaleziono">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Artykuł nie został znaleziony.</p>
          <button
            onClick={() => router.push('/wiedza')}
            className="text-emerald-600 hover:underline"
          >
            Wróć do Strefy Wiedzy
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={article.title}
      description={CATEGORY_NAMES[article.category]}
    >
      <button
        onClick={() => router.push('/wiedza')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <span>←</span>
        <span>Powrót do Strefy Wiedzy</span>
      </button>

      <article className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {CATEGORY_NAMES[article.category]}
            </span>
            <span>•</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-gray max-w-none">
            {article.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Sources */}
        {article.sources.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Źródła</h3>
            <ul className="space-y-2">
              {article.sources.map((source, idx) => (
                <li key={idx}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm flex items-center gap-2"
                  >
                    <span>🔗</span>
                    <span>{source.title || source.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </PageTemplate>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}



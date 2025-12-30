'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageTemplate } from '@/components/shared/PageTemplate';
import {
  knowledgeHttp,
  KnowledgeCategory,
  KnowledgeArticle,
} from '@/lib/http/knowledge.http';
import { AskAIDialog } from './_components/AskAIDialog';

const CATEGORY_COLORS: Record<string, string> = {
  LEGAL: 'from-indigo-500 to-indigo-600',
  IRZ_PROCEDURES: 'from-emerald-500 to-emerald-600',
  DEADLINES: 'from-amber-500 to-amber-600',
  SUBSIDIES: 'from-green-500 to-green-600',
  ANIMAL_HEALTH: 'from-rose-500 to-rose-600',
};

export default function KnowledgePage() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [articlesByCategory, setArticlesByCategory] = useState<
    Record<string, { id: string; title: string; publishedAt: string }[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryArticles(selectedCategory);
    }
  }, [selectedCategory]);

  const loadInitialData = async () => {
    try {
      const [cats, byCategory] = await Promise.all([
        knowledgeHttp.getCategories(),
        knowledgeHttp.getArticlesByCategory(),
      ]);
      setCategories(cats);
      setArticlesByCategory(byCategory);
    } catch {
      console.error('Błąd ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoryArticles = async (category: string) => {
    try {
      const data = await knowledgeHttp.getArticles(category, 20);
      setArticles(data);
    } catch {
      console.error('Błąd ładowania artykułów');
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Strefa Wiedzy">
        <div className="text-center py-12 text-gray-500">Ładowanie...</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Strefa Wiedzy"
      description="Aktualne informacje prawne, proceduralne i interpretacyjne"
    >
      {/* Kafle kategorii */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((cat) => (
            <CategoryTile
              key={cat.id}
              category={cat}
              articles={articlesByCategory[cat.id] || []}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      )}

      {/* Widok kategorii */}
      {selectedCategory && (
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <span>←</span>
            <span>Powrót do kategorii</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">
                {categories.find((c) => c.id === selectedCategory)?.icon}{' '}
                {categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
            </div>

            {articles.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Brak artykułów w tej kategorii.</p>
                <p className="text-sm mt-2">
                  Artykuły są aktualizowane automatycznie codziennie.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button - Zapytaj AI */}
      <button
        onClick={() => setIsAskDialogOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
      >
        <span className="text-xl">🤖</span>
        <span>Zapytaj AI</span>
      </button>

      {/* Dialog AI */}
      <AskAIDialog
        isOpen={isAskDialogOpen}
        onClose={() => setIsAskDialogOpen(false)}
      />
    </PageTemplate>
  );
}

function CategoryTile({
  category,
  articles,
  onClick,
}: {
  category: KnowledgeCategory;
  articles: { id: string; title: string; publishedAt: string }[];
  onClick: () => void;
}) {
  const colorClass = CATEGORY_COLORS[category.id] || 'from-gray-500 to-gray-600';

  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
    >
      <div
        className={`bg-gradient-to-r ${colorClass} p-5 text-white`}
      >
        <span className="text-3xl block mb-2">{category.icon}</span>
        <h3 className="font-semibold text-lg">{category.name}</h3>
      </div>

      <div className="p-4">
        {articles.length === 0 ? (
          <p className="text-sm text-gray-400">Brak artykułów</p>
        ) : (
          <ul className="space-y-2">
            {articles.slice(0, 2).map((article) => (
              <li key={article.id} className="text-sm text-gray-600 truncate">
                • {article.title}
              </li>
            ))}
            {articles.length > 2 && (
              <li className="text-sm text-gray-400">
                +{articles.length - 2} więcej...
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="px-4 pb-4">
        <span className="text-sm text-emerald-600 group-hover:text-emerald-700 font-medium">
          Zobacz wszystkie →
        </span>
      </div>
    </button>
  );
}

function ArticleRow({ article }: { article: KnowledgeArticle }) {
  return (
    <Link
      href={`/wiedza/${article.id}`}
      className="block p-4 hover:bg-gray-50 transition"
    >
      <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{article.content}</p>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span>{formatDate(article.publishedAt)}</span>
        {article.sources.length > 0 && (
          <span>{article.sources.length} źródeł</span>
        )}
      </div>
    </Link>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}



import { httpClient } from './client';

export interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  sources: { url: string; title?: string }[];
  publishedAt: string;
  createdAt: string;
}

export interface AskAIResponse {
  answer: string;
  sources: { url: string; title?: string }[];
}

export const knowledgeHttp = {
  getCategories: () => httpClient.get<KnowledgeCategory[]>('/knowledge/categories'),

  getArticles: (category?: string, limit = 10) =>
    httpClient.get<KnowledgeArticle[]>(
      `/knowledge/articles${category ? `?category=${category}&limit=${limit}` : `?limit=${limit}`}`,
    ),

  getArticlesByCategory: () =>
    httpClient.get<Record<string, { id: string; title: string; publishedAt: string }[]>>(
      '/knowledge/articles/by-category',
    ),

  getArticle: (id: string) => httpClient.get<KnowledgeArticle>(`/knowledge/articles/${id}`),

  askAI: (question: string) =>
    httpClient.post<AskAIResponse>('/knowledge/ask', { question }),
};



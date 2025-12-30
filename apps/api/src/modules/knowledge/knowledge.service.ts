import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KnowledgeCategory } from '@prisma/client';
import { PerplexityService } from './perplexity.service';

interface ArticleSource {
  url: string;
  title?: string;
}

@Injectable()
export class KnowledgeService {
  constructor(
    private prisma: PrismaService,
    private perplexity: PerplexityService,
  ) {}

  async getArticles(category?: KnowledgeCategory, limit = 10) {
    return this.prisma.knowledgeArticle.findMany({
      where: category ? { category } : undefined,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getArticleById(id: string) {
    return this.prisma.knowledgeArticle.findUnique({ where: { id } });
  }

  async getLatestByCategory() {
    const categories = Object.values(KnowledgeCategory);
    const result: Record<string, { id: string; title: string; publishedAt: Date }[]> = {};

    for (const category of categories) {
      const articles = await this.prisma.knowledgeArticle.findMany({
        where: { category },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, publishedAt: true },
      });
      result[category] = articles;
    }

    return result;
  }

  async askAI(question: string) {
    const response = await this.perplexity.ask(
      question,
      `Jesteś ekspertem ds. rolnictwa i hodowli zwierząt w Polsce.
Odpowiadasz na pytania dotyczące przepisów, procedur IRZ+, terminów, dotacji i zdrowia zwierząt.
Zawsze podawaj aktualne informacje ze źródeł takich jak ARiMR, GIW, MRiRW.
Odpowiadaj zwięźle, konkretnie i w języku polskim.`,
    );

    return {
      answer: response.content,
      sources: response.citations,
    };
  }

  async createArticle(data: {
    category: KnowledgeCategory;
    title: string;
    content: string;
    sources: ArticleSource[];
  }) {
    return this.prisma.knowledgeArticle.create({
      data: {
        category: data.category,
        title: data.title,
        content: data.content,
        sources: JSON.parse(JSON.stringify(data.sources)),
        publishedAt: new Date(),
      },
    });
  }

  async syncCategoryArticles(category: KnowledgeCategory, topic: string) {
    const response = await this.perplexity.searchKnowledge(category, topic);

    if (!response.content) return null;

    const title = this.generateTitle(category, topic);

    return this.createArticle({
      category,
      title,
      content: response.content,
      sources: response.citations,
    });
  }

  private generateTitle(category: KnowledgeCategory, topic: string): string {
    const prefixes: Record<KnowledgeCategory, string> = {
      LEGAL: 'Przepisy:',
      IRZ_PROCEDURES: 'Procedura IRZ:',
      DEADLINES: 'Terminy:',
      SUBSIDIES: 'Dotacje:',
      ANIMAL_HEALTH: 'Zdrowie:',
    };

    const date = new Date().toLocaleDateString('pl-PL', {
      month: 'long',
      year: 'numeric',
    });

    return `${prefixes[category]} ${topic} (${date})`;
  }
}


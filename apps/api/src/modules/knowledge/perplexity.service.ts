import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityCitation {
  url: string;
  title?: string;
}

interface PerplexityResponse {
  content: string;
  citations: PerplexityCitation[];
}

@Injectable()
export class PerplexityService {
  private readonly logger = new Logger(PerplexityService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('PERPLEXITY_API_KEY') || '';
  }

  async ask(question: string, systemPrompt?: string): Promise<PerplexityResponse> {
    if (!this.apiKey) {
      this.logger.warn('PERPLEXITY_API_KEY not configured');
      return { content: 'Brak konfiguracji API Perplexity', citations: [] };
    }

    const messages: PerplexityMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: question });

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'sonar',
          messages,
          max_tokens: 2000,
          return_citations: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const choice = response.data.choices?.[0];
      const content = choice?.message?.content || '';
      const citations: PerplexityCitation[] = response.data.citations || [];

      return { content, citations };
    } catch (error) {
      this.logger.error('Perplexity API error', error);
      throw new Error('Błąd komunikacji z Perplexity AI');
    }
  }

  async searchKnowledge(
    category: string,
    topic: string,
  ): Promise<PerplexityResponse> {
    const systemPrompt = `Jesteś ekspertem ds. rolnictwa i hodowli zwierząt w Polsce. 
Odpowiadasz na pytania dotyczące przepisów, procedur IRZ+, terminów, dotacji i zdrowia zwierząt.
Zawsze podawaj aktualne informacje ze źródeł takich jak ARiMR, GIW, MRiRW.
Odpowiadaj zwięźle, konkretnie i w języku polskim.`;

    const question = this.buildCategoryQuestion(category, topic);
    return this.ask(question, systemPrompt);
  }

  private buildCategoryQuestion(category: string, topic: string): string {
    const categoryQuestions: Record<string, string> = {
      LEGAL: `Jakie są aktualne przepisy prawne dotyczące ${topic} w hodowli zwierząt w Polsce?`,
      IRZ_PROCEDURES: `Jakie są procedury IRZ+ dotyczące ${topic}? Opisz krok po kroku.`,
      DEADLINES: `Jakie są terminy i obowiązki dotyczące ${topic} w hodowli zwierząt w Polsce?`,
      SUBSIDIES: `Jakie dotacje i dopłaty są dostępne dla rolników dotyczące ${topic}?`,
      ANIMAL_HEALTH: `Jakie są aktualne wymagania i zalecenia dotyczące ${topic} w zdrowiu zwierząt?`,
    };

    return categoryQuestions[category] || topic;
  }
}


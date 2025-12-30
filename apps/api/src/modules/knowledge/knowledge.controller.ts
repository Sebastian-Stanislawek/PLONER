import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KnowledgeCategory } from '@prisma/client';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Get('articles')
  @ApiOperation({ summary: 'Pobierz artykuły z bazy wiedzy' })
  getArticles(
    @Query('category') category?: KnowledgeCategory,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeService.getArticles(
      category,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('articles/by-category')
  @ApiOperation({ summary: 'Pobierz najnowsze artykuły pogrupowane wg kategorii' })
  getLatestByCategory() {
    return this.knowledgeService.getLatestByCategory();
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Pobierz szczegóły artykułu' })
  getArticle(@Param('id') id: string) {
    return this.knowledgeService.getArticleById(id);
  }

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Zadaj pytanie AI (Perplexity)' })
  askAI(@Body() body: { question: string }) {
    return this.knowledgeService.askAI(body.question);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Pobierz dostępne kategorie' })
  getCategories() {
    return [
      { id: 'LEGAL', name: 'Przepisy prawne', icon: '⚖️' },
      { id: 'IRZ_PROCEDURES', name: 'Procedury IRZ', icon: '📋' },
      { id: 'DEADLINES', name: 'Terminy', icon: '📅' },
      { id: 'SUBSIDIES', name: 'Dotacje', icon: '💰' },
      { id: 'ANIMAL_HEALTH', name: 'Zdrowie zwierząt', icon: '🏥' },
    ];
  }
}



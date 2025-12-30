# Strefa Wiedzy AI - Dokumentacja

## Przegląd

Moduł "Strefa Wiedzy" to baza wiedzy dla rolników i hodowców, wykorzystująca Perplexity AI do dostarczania aktualnych informacji prawnych, proceduralnych i interpretacyjnych.

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Kafle       │  │ Lista       │  │ Dialog "Zapytaj AI" │  │
│  │ kategorii   │  │ artykułów   │  │ (live chat)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ KnowledgeController                                  │    │
│  │  GET  /knowledge/articles                            │    │
│  │  GET  /knowledge/articles/:id                        │    │
│  │  GET  /knowledge/articles/by-category                │    │
│  │  POST /knowledge/ask                                 │    │
│  │  GET  /knowledge/categories                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │ Knowledge     │  │ Perplexity    │  │ Knowledge      │   │
│  │ Service       │  │ Service       │  │ SyncService    │   │
│  │ (CRUD)        │  │ (API client)  │  │ (Cron job)     │   │
│  └───────────────┘  └───────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ZEWNĘTRZNE SERWISY                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Perplexity Sonar API                                 │    │
│  │ https://api.perplexity.ai/chat/completions          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Tryb działania: Hybrid

Moduł działa w trybie hybrydowym:

### 1. Cached Content (kafle)
- Artykuły pobierane cyklicznie przez cron job (codziennie o 6:00)
- Przechowywane w bazie PostgreSQL
- Użytkownik przegląda gotowe treści bez opóźnień
- Niski koszt (jedno zapytanie do API = wiele wyświetleń)

### 2. Live Chat (Zapytaj AI)
- Użytkownik zadaje pytanie → real-time zapytanie do Perplexity
- Odpowiedź z aktualnymi źródłami
- Wyższy koszt (każde pytanie = jedno zapytanie API)

## Kategorie

| ID | Nazwa | Opis |
|----|-------|------|
| `LEGAL` | Przepisy prawne | Akty prawne, rozporządzenia, ustawy |
| `IRZ_PROCEDURES` | Procedury IRZ | Instrukcje krok po kroku dla systemu IRZ+ |
| `DEADLINES` | Terminy | Obowiązkowe terminy zgłoszeń i badań |
| `SUBSIDIES` | Dotacje | Dostępne dopłaty i programy wsparcia |
| `ANIMAL_HEALTH` | Zdrowie zwierząt | Profilaktyka, choroby, wymagania weterynaryjne |

## Perplexity API

### Endpoint
```
POST https://api.perplexity.ai/chat/completions
```

### Model
- `sonar` - szybki, ekonomiczny (~$1/1000 zapytań)
- `sonar-pro` - dokładniejszy, droższy

### Przykładowe zapytanie
```json
{
  "model": "sonar",
  "messages": [
    {
      "role": "system",
      "content": "Jesteś ekspertem ds. rolnictwa..."
    },
    {
      "role": "user", 
      "content": "Jakie są terminy zgłoszenia urodzenia cielęcia?"
    }
  ],
  "max_tokens": 2000,
  "return_citations": true
}
```

### Odpowiedź
```json
{
  "choices": [{
    "message": {
      "content": "Urodzenie cielęcia należy zgłosić w ciągu 7 dni..."
    }
  }],
  "citations": [
    {"url": "https://arimr.gov.pl/...", "title": "..."}
  ]
}
```

## Konfiguracja

### Zmienne środowiskowe
```bash
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
```

### Uzyskanie klucza API
1. Zarejestruj się na https://www.perplexity.ai
2. Przejdź do Settings → API
3. Wygeneruj klucz API

## Cron Job - Synchronizacja

Serwis `KnowledgeSyncService` uruchamia się codziennie o 6:00 i pobiera aktualne informacje dla predefiniowanych tematów:

```typescript
const syncTopics = [
  { category: 'LEGAL', topic: 'rejestracja zwierząt gospodarskich' },
  { category: 'IRZ_PROCEDURES', topic: 'zgłaszanie urodzeń zwierząt' },
  { category: 'DEADLINES', topic: 'terminy zgłoszeń do IRZ' },
  // ... więcej tematów
];
```

## Baza danych

### Model `KnowledgeArticle`
```prisma
model KnowledgeArticle {
  id          String            @id @default(cuid())
  category    KnowledgeCategory
  title       String
  content     String            @db.Text
  sources     Json              // [{url, title}]
  publishedAt DateTime
  createdAt   DateTime          @default(now())
}
```

## Endpointy API

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| GET | `/knowledge/categories` | Lista kategorii | Nie |
| GET | `/knowledge/articles` | Lista artykułów | Nie |
| GET | `/knowledge/articles/by-category` | Artykuły pogrupowane | Nie |
| GET | `/knowledge/articles/:id` | Szczegóły artykułu | Nie |
| POST | `/knowledge/ask` | Pytanie do AI | Tak |

## Koszty

| Operacja | Szacowany koszt |
|----------|-----------------|
| Sync dzienny (11 tematów) | ~$0.01 |
| Pytanie użytkownika | ~$0.001 |
| Miesięcznie (100 pytań/dzień) | ~$3-5 |

## Rozszerzenia (przyszłość)

- [ ] Cache odpowiedzi AI (Redis)
- [ ] Personalizacja tematów na podstawie profilu użytkownika
- [ ] Powiadomienia o nowych przepisach
- [ ] Eksport artykułów do PDF



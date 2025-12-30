# Ploner - System zarządzania gospodarstwem

Aplikacja SaaS do zarządzania gospodarstwem rolnym z integracją z systemem IRZ+ (Identyfikacja i Rejestracja Zwierząt).

## Wymagania

- Node.js 22 LTS
- pnpm 9+
- Docker i Docker Compose

## Szybki start (Development)

### 1. Instalacja zależności

```bash
pnpm install
```

### 2. Konfiguracja środowiska

```bash
cp .env.example .env
```

Edytuj `.env` i uzupełnij wymagane wartości (dla dev domyślne są OK).

### 3. Uruchomienie usług (PostgreSQL, Redis)

```bash
docker-compose up -d
```

### 4. Generowanie klienta Prisma i migracje

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Dodanie testowych danych (opcjonalne)

```bash
pnpm db:seed
```

### 6. Uruchomienie aplikacji

```bash
# Terminal 1 - Backend (NestJS) na porcie 3001
pnpm --filter @ploner/api dev

# Terminal 2 - Frontend (Next.js) na porcie 3000
pnpm --filter @ploner/web dev
```

Lub uruchom wszystko jednocześnie:

```bash
pnpm dev
```

## Dostęp do aplikacji

| Usługa | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | `pnpm db:studio` |

---

## Dane testowe

Po uruchomieniu `pnpm db:seed` w bazie pojawią się testowe dane:

### Konto testowe

| Pole | Wartość |
|------|---------|
| Email | `test@ploner.pl` |
| Hasło | `test123` |

### Gospodarstwo testowe

| Pole | Wartość |
|------|---------|
| Nazwa | Gospodarstwo Rolne Kowalski |
| Nr producenta | PL123456789 |
| Nr stada | 12345678 |

### Zwierzęta testowe (16 sztuk)

| Gatunek | Ilość | Rasy |
|---------|-------|------|
| Bydło | 6 | Holsztyńsko-Fryzyjska, Limousine, Simental, Polska Czerwona, Charolaise |
| Owce | 3 | Merynos Polski, Suffolk |
| Kozy | 2 | Biała Uszlachetniona, Saaneńska |
| Świnie | 3 | Wielka Biała Polska, Duroc, Pietrain |
| Konie | 2 | Konik Polski, Wielkopolski |

---

## Reset bazy danych

Aby wyczyścić bazę i zacząć od nowa:

```bash
# 1. Zatrzymaj aplikacje
# 2. Usuń i utwórz bazę od nowa
docker-compose down -v
docker-compose up -d

# 3. Uruchom migracje
pnpm db:migrate

# 4. (Opcjonalnie) Dodaj dane testowe
pnpm db:seed
```

---

## Wdrożenie na produkcję

### Wymagania produkcyjne

- Serwer VPS (minimum 2GB RAM, 2 vCPU)
- PostgreSQL 16 (np. Supabase, Neon, Railway lub self-hosted)
- Redis 7 (np. Upstash, Railway lub self-hosted)
- Node.js 22 LTS
- PM2 lub Docker do zarządzania procesami
- Reverse proxy (nginx/Caddy) z SSL

### 1. Zmienne środowiskowe produkcyjne

Utwórz plik `.env.production`:

```bash
# Baza danych
DATABASE_URL="postgresql://user:password@host:5432/ploner_prod?schema=public"

# Redis
REDIS_URL="redis://user:password@host:6379"

# JWT
JWT_SECRET="BARDZO_DLUGI_LOSOWY_CIAG_ZNAKOW_MIN_64_ZNAKI"
JWT_REFRESH_SECRET="INNY_BARDZO_DLUGI_LOSOWY_CIAG_ZNAKOW"

# API
API_PORT=3001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.twoja-domena.pl

# IRZ+ (produkcyjne endpointy - bez /test/)
IRZ_API_BASE_URL=https://irz.arimr.gov.pl/api
IRZ_SSO_URL=https://sso.arimr.gov.pl
IRZ_CLIENT_ID=aplikacja-irzplus

# Szyfrowanie danych IRZ+
ENCRYPTION_KEY="32_BAJTOWY_KLUCZ_SZYFROWANIA_AES"
```

### 2. Build aplikacji

```bash
# Zainstaluj zależności produkcyjne
pnpm install --frozen-lockfile

# Zbuduj wszystkie pakiety
pnpm build
```

### 3. Migracje na produkcji

```bash
# Uruchom migracje (NIE używaj db:push na produkcji!)
DATABASE_URL="postgresql://..." pnpm db:migrate
```

### 4. Uruchomienie z PM2

```bash
# Zainstaluj PM2 globalnie
npm install -g pm2

# Utwórz plik ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ploner-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
```

```bash
# Uruchom
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Frontend na Vercel (zalecane)

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Wdróż frontend
cd apps/web
vercel --prod
```

Ustaw zmienne środowiskowe w panelu Vercel:
- `NEXT_PUBLIC_API_URL` = `https://api.twoja-domena.pl`

### 6. Konfiguracja nginx (przykład)

```nginx
# /etc/nginx/sites-available/ploner-api
server {
    listen 443 ssl http2;
    server_name api.twoja-domena.pl;

    ssl_certificate /etc/letsencrypt/live/api.twoja-domena.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.twoja-domena.pl/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Włącz i zrestartuj nginx
sudo ln -s /etc/nginx/sites-available/ploner-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL z Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.twoja-domena.pl
```

---

## Checklist przed produkcją

- [ ] Zmień wszystkie sekrety (JWT_SECRET, ENCRYPTION_KEY)
- [ ] Usuń dane testowe z bazy (`pnpm db:seed` NIE uruchamiać na produkcji)
- [ ] Skonfiguruj backup bazy danych
- [ ] Włącz monitoring (np. PM2 Plus, Sentry)
- [ ] Skonfiguruj rate limiting na nginx
- [ ] Ustaw CORS tylko na dozwolone domeny
- [ ] Włącz HTTPS wszędzie
- [ ] Skonfiguruj logi (np. do pliku lub serwisu jak Logtail)

---

## Struktura projektu

```
ploner/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── database/         # Prisma schema + seed
│   └── types/            # Współdzielone typy TS
├── docs/                 # Dokumentacja techniczna
├── docker-compose.yml    # PostgreSQL + Redis (dev)
└── turbo.json            # Konfiguracja Turborepo
```

## Strefa Wiedzy AI

Moduł "Strefa Wiedzy" wykorzystuje **Perplexity Sonar API** do dostarczania aktualnych informacji dla rolników:

- **Kafle tematyczne** - przepisy prawne, procedury IRZ, terminy, dotacje, zdrowie zwierząt
- **Automatyczna synchronizacja** - codzienne pobieranie aktualnych informacji
- **Live chat AI** - możliwość zadawania pytań w czasie rzeczywistym

### Konfiguracja Perplexity

```bash
# Dodaj do .env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
```

Klucz API uzyskasz na https://www.perplexity.ai → Settings → API

Szczegółowa dokumentacja: [docs/knowledge-base.md](docs/knowledge-base.md)

## Komendy

| Komenda | Opis |
|---------|------|
| `pnpm dev` | Uruchom wszystkie aplikacje (dev) |
| `pnpm build` | Zbuduj wszystkie aplikacje |
| `pnpm lint` | Sprawdź lint |
| `pnpm db:migrate` | Uruchom migracje Prisma |
| `pnpm db:push` | Synchronizuj schemat (tylko dev!) |
| `pnpm db:studio` | Otwórz Prisma Studio |
| `pnpm db:generate` | Generuj klienta Prisma |
| `pnpm db:seed` | Dodaj testowe dane |

## Środowiska

| Środowisko | API URL | IRZ+ API |
|------------|---------|----------|
| Local | http://localhost:3001 | Endpointy testowe (/test/) |
| Production | https://api.ploner.pl | Endpointy produkcyjne (/prod/) |

## API IRZ+

Dokumentacja integracji z IRZ+ znajduje się w plikach:
- `api_irz_plus.md` - Ogólna dokumentacja API
- `endpoint_api_irz_plus.md` - Lista endpointów produkcyjnych
- `endpoint_testowe_izr_plus.md` - Lista endpointów testowych

### Testowe dane logowania IRZ+

```
Username: api_test_portalirzplus1
Password: api_test_portalirzplus1
```

⚠️ **Uwaga:** Testowe endpointy IRZ+ używają ścieżki `/test/`, produkcyjne `/prod/`.

## Licencja

Projekt prywatny.

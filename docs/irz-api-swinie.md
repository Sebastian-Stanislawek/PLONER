# API IRZ+ dla Świń (Grupowe)

Dokumentacja integracji z API IRZ+ dla świń, zgodna z oficjalną specyfikacją OpenAPI (usługa_API_świnie_poP233).

## Uwaga: Specyfika rejestracji świń

**Świnie w systemie IRZ+ są rejestrowane GRUPOWO (jako stada), nie jako pojedyncze zwierzęta.**

Każde stado świń ma:
- `numerDzialalnosci` - numer działalności (siedziby stada)
- `liczbaSwin` - łączna liczba świń
- `liczbaSwinOznakowanych` - liczba świń oznakowanych
- `liczbaSwinNieoznakowanych` - liczba świń nieoznakowanych
- `numeryLochy` - identyfikatory loch (matek)

## Endpointy

### 1. Pobieranie danych stada świń

```
GET /api/grupowe/swinie/api/{test|prod}/dane
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerProducenta` | string | Numer producenta |

### 2. Składanie dyspozycji SSSS (Stan Stada Świń)

```
POST /api/grupowe/dokument/api/{test|prod}/ssss
```

Służy do zgłaszania stanu stada świń.

**Body (JSON):**

```json
{
  "komorkaOrganizacyjna": "BP/01",
  "numerProducenta": "123456789",
  "zgloszenie": {
    "czyKorekta": false,
    "typZdarzenia": { "kod": "SS" },
    "numerDzialalnosci": "PL123456789001",
    "liczbaSwinOznakowanych": 150,
    "liczbaSwinNieoznakowanych": 50,
    "liczbaSwin": 200,
    "technologiaProdukcji": [
      { "kod": "TU", "opis": "Tucz" }
    ],
    "systemUtrzymaniaSwin": [
      { "kod": "SC", "opis": "Ściółkowy" }
    ],
    "dataZdarzenia": "2024-01-15",
    "numeryLochy": [
      { "indywidualnyNumerIdentyfikacyjnyLochy": "PL123456789001001" },
      { "indywidualnyNumerIdentyfikacyjnyLochy": "PL123456789001002" }
    ],
    "pozycje": [
      {
        "lp": 1,
        "statusPozycji": "DO_ZATWIERDZENIA"
      }
    ]
  }
}
```

**Odpowiedź:**

```json
{
  "komunikat": "Dokument został złożony pomyślnie",
  "numerDokumentu": "SSSS/2024/00123",
  "bledy": []
}
```

## Inne dokumenty dla świń

| Skrót | Endpoint | Opis |
|-------|----------|------|
| ZPRS | `/api/grupowe/dokument/api/{test\|prod}/zprs` | Zgłoszenie przemieszczenia świń |
| ZPS | `/api/grupowe/dokument/api/{test\|prod}/zps` | Zgłoszenie padnięcia świń |
| ZPZUS | `/api/grupowe/dokument/api/{test\|prod}/zpzus` | Zgłoszenie padnięcia/zabicia/uboju świń |
| ZURS | `/api/grupowe/dokument/api/{test\|prod}/zurs` | Zgłoszenie urodzenia świń |
| ZOUS | `/api/grupowe/dokument/api/{test\|prod}/zous` | Zgłoszenie oznakowania świń |
| ZDOL | `/api/grupowe/dokument/api/{test\|prod}/zdol` | Zgłoszenie dołączenia lochy |
| ZZDOL | `/api/grupowe/dokument/api/{test\|prod}/zzdol` | Zgłoszenie zdarzenia lochy |
| ZUZS | `/api/grupowe/dokument/api/{test\|prod}/zuzs` | Zgłoszenie uboju/zabicia świń |
| SSSS | `/api/grupowe/dokument/api/{test\|prod}/ssss` | Stan stada świń |

## Kody słownikowe

### Typ zdarzenia

| Kod | Opis |
|-----|------|
| SS | Stan stada |
| UR | Urodzenie |
| PR | Przemieszczenie |
| PA | Padnięcie |
| UB | Ubój |
| OZ | Oznakowanie |

### Technologia produkcji

| Kod | Opis |
|-----|------|
| TU | Tucz |
| RE | Reprodukcja |
| CH | Chów |
| ZA | Zamknięty cykl produkcji |

### System utrzymania świń

| Kod | Opis |
|-----|------|
| SC | Ściółkowy |
| BE | Bezściółkowy |
| WO | Wolnowybiegowy |
| EK | Ekologiczny |

### Status pozycji

| Wartość | Opis |
|---------|------|
| ZATWIERDZONA | Pozycja zatwierdzona |
| DO_ZATWIERDZENIA | Pozycja oczekuje na zatwierdzenie |
| POMINIETA | Pozycja pominięta |

## Identyfikacja świń

### Numer działalności
Świnie są przypisane do **działalności** (siedziby stada), nie do pojedynczych numerów kolczyków.

Format: `PLXXXXXXXXXnnn`
- `PL` - kod kraju
- `XXXXXXXXX` - numer producenta
- `nnn` - numer siedziby stada

### Numery loch
Lochy (matki) mają indywidualne numery identyfikacyjne, które są rejestrowane w systemie.

## Użycie w aplikacji

```typescript
// Pobieranie danych stada świń
const pigs = await irzService.fetchAnimalsPigs(
  username,
  password,
  producerNumber
);

// Składanie dyspozycji SSSS (stan stada)
const result = await irzService.submitPigHerdSSSS(
  username,
  password,
  {
    numerProducenta: '123456789',
    zgloszenie: {
      typZdarzenia: { kod: 'SS' },
      numerDzialalnosci: 'PL123456789001',
      liczbaSwin: 200,
      liczbaSwinOznakowanych: 150,
      liczbaSwinNieoznakowanych: 50,
      dataZdarzenia: '2024-01-15',
      technologiaProdukcji: [{ kod: 'TU' }],
      systemUtrzymaniaSwin: [{ kod: 'SC' }],
      numeryLochy: [
        { indywidualnyNumerIdentyfikacyjnyLochy: 'PL123456789001001' }
      ]
    }
  }
);

if (result.numerDokumentu) {
  console.log('Dokument złożony:', result.numerDokumentu);
} else {
  console.error('Błędy:', result.bledy);
}
```

## Różnice względem innych gatunków

| Aspekt | Świnie | Zwierzęta indywidualne |
|--------|--------|------------------------|
| Identyfikacja | Numer działalności | Numer kolczyka |
| Jednostka | Stado (wiele sztuk) | Pojedyncze zwierzę |
| Oznakowanie | Grupowe + lochy | Indywidualne |
| Liczba | `liczbaSwin` | 1 |
| Matki | `numeryLochy` | `numerMatkiKolczyk` |



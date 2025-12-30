# API IRZ+ dla Koniowatych

Dokumentacja integracji z API IRZ+ dla koniowatych, zgodna z oficjalną specyfikacją OpenAPI (ZHK API).

## Endpointy

### 1. Pobieranie listy koniowatych (ZHK API)

```
GET /api/koniowate/zwierze/zhk/api/{test|prod}/lista
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerProducenta` | string | Numer producenta |
| `numerDzialalnosci` | string | Numer działalności |
| `gatunek` | string | Kod słownikowy gatunku (SIA-SL02120) |
| `niepowtarzalnyDozywotniNumer` | string | UELN - główny identyfikator koniowatego |
| `plec` | string | Kod płci (SIA-SL02121): O=ogier, K=klacz, W=wałach |
| `numerSrodkaIdentyfikacji` | string | Numer/kod transpondera |
| `nazwaKoniowatego` | string | Imię/nazwa koniowatego |
| `masc` | string | Kod maści (SIA-SL02122) |
| `stanDanychNaDzien` | date | Stan danych na dzień (YYYY-MM-DD) |
| `idKoniowatego` | integer | ID koniowatego w systemie IRZ+ |
| `dataModyfikacjiBiznesowejOd` | date | Data modyfikacji od |
| `dataModyfikacjiBiznesowejDo` | date | Data modyfikacji do |
| `tylkoWykastrowane` | boolean | Tylko wykastrowane |
| `tylkoZeZmianaTranspondera` | boolean | Tylko ze zmianą transpondera |
| `tylkoZWaznaLicencja` | boolean | Tylko z ważną licencją |

**Odpowiedź:**

```json
{
  "komunikat": "OK",
  "listaZwierzeta": [
    {
      "lp": 1,
      "idKoniowatego": 12345,
      "niepowtarzalnyDozywotniNumer": "616007123456789",
      "imieNazwaKoniowatego": "BURSZTYN",
      "dataUrodzenia": "2020-05-15",
      "gatunek": { "kod": "K", "opis": "Koń" },
      "plec": { "kod": "O", "opis": "Ogier" },
      "masc": { "kod": "GN", "opis": "Gniada" },
      "statusZwierzecia": { "kod": "A", "opis": "Aktywne" },
      "szczegolyZwierzeKoniowate": {
        "rasa": { "kod": "SP", "opis": "Polski koń szlachetny półkrwi" },
        "typRasowy": { "kod": "W", "opis": "Wierzchowy" },
        "niepowtarzalnyDozywotniNumerUelnMatki": "616007987654321",
        "nazwaMatki": "PERŁA",
        "niepowtarzalnyDozywotniNumerUelnOjcaDawcyNasienia": "616007111222333",
        "nazwaOjcaLubDawcyNasienia": "DIAMENT",
        "kastracja": false
      },
      "historiaKodowTranspondera": [
        {
          "numerKodTranspondera": "985100012345678",
          "dataObowiazywaniaOd": "2020-06-01"
        }
      ]
    }
  ]
}
```

### 2. Pobieranie zdarzeń koniowatych (ZHK API)

```
GET /api/koniowate/zdarzenia/zhk/api/{test|prod}/lista
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerDzialalnosci` | string | Numer działalności |
| `idKoniowatego` | string | ID koniowatego |
| `numerKodTranspondera` | string | Numer transpondera |
| `niepowtarzalnyDozywotniNumerUELN` | string | UELN |
| `gatunek` | string | Kod gatunku |
| `typZdarzenia` | string | Typ zdarzenia |
| `stanZdarzenia` | string | Stan zdarzenia |
| `kodBledu` | string | Kod błędu |
| `dataZdarzeniaOd` | date | Data zdarzenia od |
| `dataZdarzeniaDo` | date | Data zdarzenia do |
| `dataUtworzeniaOd` | date | Data utworzenia od |
| `dataUtworzeniaDo` | date | Data utworzenia do |
| `dataModyfikacjiOd` | date | Data modyfikacji od |
| `dataModyfikacjiDo` | date | Data modyfikacji do |

### 3. Modyfikacja danych koniowatego (ZHK API)

```
POST /api/koniowate/zwierze/zhk/api/{test|prod}/modyfikuj
```

**Body (JSON):**

```json
{
  "tryb": 1,
  "uzasadnienie": "Korekta danych",
  "idKoniowatego": 12345,
  "gatunek": { "kod": "K" },
  "plec": { "kod": "O" },
  "masc": { "kod": "GN" },
  "dataUrodzenia": "2020-05-15",
  "imieNazwaKoniowatego": "BURSZTYN"
}
```

## Dokumenty dla koniowatych

| Skrót | Endpoint | Opis |
|-------|----------|------|
| ZURKON | `/api/koniowate/dokument/api/{test\|prod}/zurkon` | Zgłoszenie urodzenia |
| ZRKON | `/api/koniowate/dokument/api/{test\|prod}/zrkon` | Zgłoszenie rejestracji |
| ZPKON | `/api/koniowate/dokument/api/{test\|prod}/zpkon` | Zgłoszenie przemieszczenia |
| ZPZUKON | `/api/koniowate/dokument/api/{test\|prod}/zpzukon` | Zgłoszenie padnięcia/zabicia/uboju |
| ZUZKON | `/api/koniowate/dokument/api/{test\|prod}/zuzkon` | Zgłoszenie uboju/zabicia |
| WDDIKON | `/api/koniowate/dokument/api/{test\|prod}/wddikon` | Wniosek o duplikat dokumentu |
| WNZNKON | `/api/koniowate/dokument/api/{test\|prod}/wnznkon` | Wniosek o zmianę nazwy |
| OZWKON | `/api/koniowate/dokument/api/{test\|prod}/ozwkon` | Oświadczenie o własności |
| IWLZKON | `/api/koniowate/dokument/api/{test\|prod}/iwlzkon` | Info o wyłączeniu z łańcucha żywnościowego |
| WWTKON | `/api/koniowate/dokument/api/{test\|prod}/wwtkon` | Wniosek o wszczepienie transpondera |

## Kody słownikowe

### Gatunek (SIA-SL02120)

| Kod | Opis |
|-----|------|
| K | Koń |
| O | Osioł |
| M | Muł/osłomuł |
| KP | Koń Przewalskiego |

### Płeć (SIA-SL02121)

| Kod | Opis |
|-----|------|
| O | Ogier (samiec) |
| K | Klacz (samica) |
| W | Wałach (samiec wykastrowany) |

### Maść (SIA-SL02122)

| Kod | Opis |
|-----|------|
| GN | Gniada |
| KA | Kara |
| SI | Siwa |
| SZ | Szara |
| BU | Bułana |
| IZ | Izabelowata |
| SK | Skarogniada |
| TA | Tarantowata |
| DE | Dereszowata |
| AP | Apaloosa |

## Identyfikacja koniowatych

### UELN (Unique Equine Life Number)

Koniowate identyfikowane są przez **UELN** (Niepowtarzalny Dożywotni Numer), a nie przez numer kolczyka jak inne zwierzęta.

Format UELN: `XXXYYYZZZZZZZZZZ`
- `XXX` - kod kraju (616 dla Polski)
- `YYY` - kod organizacji wydającej
- `ZZZZZZZZZZ` - unikalny numer zwierzęcia

### Transponder

Koniowate mają wszczepiony transponder (chip) z unikalnym kodem. Historia transponderów jest przechowywana w `historiaKodowTranspondera`.

## Użycie w aplikacji

```typescript
// Pobieranie koniowatych przez standardowe API
const horses = await irzService.fetchAnimalsHorses(
  username,
  password,
  producerNumber
);

// Pobieranie koniowatych przez ZHK API (więcej szczegółów)
const horsesZHK = await irzService.fetchAnimalsHorsesZHK(
  username,
  password,
  {
    numerProducenta: producerNumber,
    tylkoZWaznaLicencja: true
  }
);

// Pobieranie zdarzeń koniowatych
const events = await irzService.fetchHorseEventsZHK(
  username,
  password,
  {
    idKoniowatego: '12345',
    dataZdarzeniaOd: '2024-01-01'
  }
);
```

## Różnice między standardowym API a ZHK API

| Aspekt | Standardowe API | ZHK API |
|--------|-----------------|---------|
| Endpoint | `/koniowate/zwierze/api/{mode}/koniowate` | `/koniowate/zwierze/zhk/api/{mode}/lista` |
| Szczegółowość | Podstawowe dane | Pełne dane z historią |
| Przeznaczenie | Producenci | Związki Hodowców Koniowatych |
| Modyfikacja danych | Brak | Dostępna |



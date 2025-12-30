# API IRZ+ dla Drobiu

Dokumentacja integracji z API IRZ+ dla drobiu, zgodna z oficjalną specyfikacją OpenAPI (usługa_API_drób_poP237).

## Uwaga: Specyfika rejestracji drobiu

**Drób w systemie IRZ+ jest rejestrowany jako PARTIE, nie jako pojedyncze zwierzęta.**

Każda partia drobiu ma:
- `numerPartiiDrobiu` - unikalny identyfikator partii
- `liczbaSztukDrobiu` - liczba sztuk drobiu w partii
- `liczbaSztukJajWylegowych` - liczba jaj wylęgowych (jeśli dotyczy)

## Endpointy

### 1. Pobieranie zdarzeń drobiu

```
GET /api/drob/zdarzenia/api/{test|prod}/zdarzeniadrob
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerProducenta` | string | Numer producenta |
| `numerDzialalnosci` | string | Numer działalności |
| `numerPartiiDrobiu` | string | Numer partii drobiu |
| `gatunek` | string | Kod gatunku (SIA-SL02125) |
| `typZdarzenia` | string | Kod typu zdarzenia (SIA-SL02126) |
| `stanZdarzenia` | string | Kod stanu zdarzenia (SIA-SL02194) |
| `dataZdarzeniaOd` | date | Data zdarzenia od (YYYY-MM-DD) |
| `dataZdarzeniaDo` | date | Data zdarzenia do (YYYY-MM-DD) |

**Odpowiedź:**

```json
{
  "komunikat": "OK",
  "listaZdarzenie": [
    {
      "lp": 1,
      "numerPartiiDrobiu": "PL123456789/2024/001",
      "gatunek": { "kod": "KU", "opis": "Kury" },
      "liczbaSztukDrobiu": 5000,
      "liczbaSztukJajWylegowych": 0,
      "typZdarzenia": { "kod": "UR", "opis": "Urodzenie" },
      "stanZdarzenia": { "kod": "Z", "opis": "Zatwierdzone" },
      "dataZdarzenia": "2024-01-15",
      "numerDzialalnosciZglaszajacej": "PL123456789",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "szczegolyZdarzenia": {
        "budynek": { "kod": "B1", "opis": "Budynek 1" },
        "oznaczenieWsadu": "W001"
      }
    }
  ]
}
```

### 2. Pobieranie zdarzeń dla Inspekcji Weterynaryjnej (IW)

```
GET /api/drob/zdarzenia/iw/api/{test|prod}/lista
```

**Dodatkowe parametry:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `historiaZdarzen` | string | Kod historii zdarzeń (SIA-SL02196) |
| `stanKorekty` | string | Kod stanu korekty (SIA-SL02253) |
| `numerDzialalnosciFormowaniaWysylki` | string | Numer działalności formowania wysyłki |
| `tylkoZdarzeniaWplywajaceNaLokalizacje` | boolean | Tylko zdarzenia wpływające na lokalizację |

### 3. Składanie dyspozycji ZZSSD

```
POST /api/drob/dokument/api/{test|prod}/zzssd
```

Służy do zgłaszania sprzedaży/przemieszczenia drobiu.

**Body (JSON):**

```json
{
  "komorkaOrganizacyjna": "BP/01",
  "numerProducenta": "PL123456789",
  "zgloszenie": {
    "czyKorekta": false,
    "gatunek": { "kod": "KU" },
    "doDzialalnosci": "PL987654321",
    "typZdarzenia": { "kod": "SP" },
    "dataZdarzenia": "2024-01-20",
    "liczbaDrobiuPrzybylo": 0,
    "liczbaJajWylegowychPrzybylo": 0,
    "pozycje": [
      {
        "lp": 1,
        "statusPozycji": "DO_ZATWIERDZENIA",
        "numerIdenPartiiDrobiu": "PL123456789/2024/001",
        "liczbaDrobiuUbylo": 1000,
        "liczbaJajWylegowychUbylo": 0,
        "transportWlasny": true,
        "nrRejestracyjnySrodkaTransportu": "WX12345",
        "budynek": { "kod": "B1" }
      }
    ]
  }
}
```

**Odpowiedź:**

```json
{
  "komunikat": "Dokument został złożony pomyślnie",
  "numerDokumentu": "ZZSSD/2024/00123",
  "bledy": []
}
```

## Typy zdarzeń drobiu

| Kod | Opis | Dokument |
|-----|------|----------|
| UR | Urodzenie/wylęg | ZRD |
| UB | Ubój w rzeźni | ZURD |
| UN | Unieszkodliwienie zwłok | ZUZD |
| SP | Sprzedaż/przemieszczenie | ZZSSD |
| AK | Aktualizacja (po kontroli) | - |

## Dokumenty dla drobiu

| Skrót | Endpoint | Opis |
|-------|----------|------|
| ZRD | `/api/drob/dokument/api/{test\|prod}/zrd` | Zgłoszenie rejestracji drobiu |
| ZURD | `/api/drob/dokument/api/{test\|prod}/zurd` | Zgłoszenie uboju w rzeźni |
| ZUZD | `/api/drob/dokument/api/{test\|prod}/zuzd` | Zgłoszenie unieszkodliwienia zwłok |
| ZZSSD | `/api/drob/dokument/api/{test\|prod}/zzssd` | Zgłoszenie zmiany stanu stada drobiu |

## Kody słownikowe

### Gatunek drobiu (SIA-SL02125)

| Kod | Opis |
|-----|------|
| KU | Kury |
| IN | Indyki |
| KA | Kaczki |
| GE | Gęsi |
| PE | Perliczki |
| PR | Przepiórki |
| ST | Strusie |
| EM | Emu |
| FA | Fazany |
| GO | Gołębie |

### Typ zdarzenia (SIA-SL02126)

| Kod | Opis |
|-----|------|
| UR | Urodzenie |
| UB | Ubój |
| UN | Unieszkodliwienie |
| SP | Sprzedaż/przemieszczenie |
| PR | Przybycie |
| WY | Wybycie |
| AK | Aktualizacja |

### Stan zdarzenia (SIA-SL02194)

| Kod | Opis |
|-----|------|
| Z | Zatwierdzone |
| O | Oczekujące |
| B | Z błędami |
| A | Anulowane |

### Kategoria jaj wylęgowych

| Kod | Opis |
|-----|------|
| R | Reprodukcyjne |
| K | Konsumpcyjne |

## Użycie w aplikacji

```typescript
// Pobieranie zdarzeń drobiu
const events = await irzService.fetchPoultryEvents(
  username,
  password,
  {
    numerProducenta: '123456789',
    dataZdarzeniaOd: '2024-01-01',
    gatunek: 'KU' // Kury
  }
);

// Pobieranie zdarzeń dla IW
const eventsIW = await irzService.fetchPoultryEventsIW(
  username,
  password,
  {
    numerDzialalnosci: 'PL123456789',
    tylkoZdarzeniaWplywajaceNaLokalizacje: true
  }
);

// Składanie dyspozycji ZZSSD (sprzedaż/przemieszczenie)
const result = await irzService.submitPoultryZZSSD(
  username,
  password,
  {
    numerProducenta: '123456789',
    zgloszenie: {
      gatunek: { kod: 'KU' },
      doDzialalnosci: 'PL987654321',
      typZdarzenia: { kod: 'SP' },
      dataZdarzenia: '2024-01-20',
      pozycje: [
        {
          numerIdenPartiiDrobiu: 'PL123456789/2024/001',
          liczbaDrobiuUbylo: 1000,
          transportWlasny: true
        }
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

## Szczegóły zdarzenia (szczegolyZdarzenia)

W zależności od typu zdarzenia, obiekt `szczegolyZdarzenia` zawiera różne pola:

### Urodzenie (ZRD)
- `budynek` - budynek w którym znajduje się drób
- `oznaczenieWsadu` - oznaczenie wsadu
- `kodKraju` - kraj pochodzenia (dla importu)
- `numerIdenPartiiDrobiuSpozaKraju` - numer partii z zagranicy

### Ubój (ZURD)
- `numerPartiiUboju` - numer partii uboju
- `masaDrobiu` - masa drobiu poddanego ubojowi (kg)
- `ubojRytualny` - czy ubój rytualny
- `dataKomplementarna` - data kupna/wwozu

### Unieszkodliwienie (ZUZD)
- `masaCialaDrobiuJajWylegowych` - masa drobiu/jaj (kg)
- `kategoriaJajWylegowych` - kategoria jaj
- `dataKomplementarna` - data przyjęcia do zakładu

### Sprzedaż/przemieszczenie (ZZSSD)
- `numerDzialalnosciKomplementanej` - działalność docelowa/źródłowa
- `sprzedazNaUzytekWlasny` - czy sprzedaż na własny użytek
- `wniPrzewoznika` - WNI przewoźnika
- `rodzajSrodkaTransportu` - rodzaj transportu
- `nrRejestracyjnySrodkaTransportu` - numer rejestracyjny
- `transportWlasny` - czy transport własny

## Różnice względem innych gatunków

| Aspekt | Drób | Inne zwierzęta |
|--------|------|----------------|
| Identyfikacja | Numer partii | Numer kolczyka |
| Jednostka | Partia (wiele sztuk) | Pojedyncze zwierzę |
| Płeć | Nie rejestrowana | Rejestrowana |
| Data urodzenia | Data wylęgu partii | Data urodzenia osobnika |
| Jaja wylęgowe | Tak | Nie dotyczy |



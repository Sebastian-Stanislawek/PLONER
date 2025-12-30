# API IRZ+ dla Zwierząt Indywidualnych

Dokumentacja integracji z API IRZ+ dla zwierząt indywidualnych (bydło, owce, kozy, jelenie, wielbłądy), zgodna z oficjalną specyfikacją OpenAPI (indywidualne_P237).

## Gatunki obsługiwane przez API Indywidualne

| Kod | Gatunek |
|-----|---------|
| B | Bydło |
| O | Owce |
| K | Kozy |
| J | Jelenie |
| W | Wielbłądy |

## Endpointy

### 1. Pobieranie listy zwierząt indywidualnych

```
GET /api/indywidualne/zwierze/api/{test|prod}/zwierzetaIndywidualne
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerProducenta` | string | Numer producenta |

### 2. Pobieranie szczegółów pojedynczego zwierzęcia

```
GET /api/indywidualne/zwierze/api/{test|prod}/zwierzeIndywidualne
```

**Parametry zapytania:**

| Parametr | Typ | Opis |
|----------|-----|------|
| `numerIdentyfikacyjnyZwierzecia` | string | Numer kolczyka zwierzęcia |

**Odpowiedź:**

```json
{
  "komunikat": "OK",
  "numerIdentyfikacyjnyZwierzecia": "PL123456789012",
  "gatunek": { "kod": "B", "opis": "Bydło" },
  "dataUrodzenia": "2022-03-15",
  "plec": { "kod": "S", "opis": "Samica" },
  "kodRasy": { "kod": "HF", "opis": "Holsztyńsko-fryzyjska" },
  "czyMatka": true,
  "dataWyrejestrowania": null,
  "masaCialaZwierzecia": 650.5,
  "masaTuszy": null,
  "numerDzialalnosci": "PL123456789001",
  "sposobOznakowania": "Kolczyk + Paszport",
  "informacjaOOswiadczeniuDDS": null
}
```

## Dokumenty dla zwierząt indywidualnych

| Skrót | Endpoint | Opis |
|-------|----------|------|
| ZR | `/api/indywidualne/dokument/api/{test\|prod}/zr` | Zgłoszenie rejestracji |
| ZW | `/api/indywidualne/dokument/api/{test\|prod}/zw` | Zgłoszenie wyrejestrowania |
| ZUR | `/api/indywidualne/dokument/api/{test\|prod}/zur` | Zgłoszenie urodzenia |
| ZUZ | `/api/indywidualne/dokument/api/{test\|prod}/zuz` | Zgłoszenie uboju/zabicia |
| ZPZU | `/api/indywidualne/dokument/api/{test\|prod}/zpzu` | Zgłoszenie padnięcia/zabicia/uboju |
| ZP | `/api/indywidualne/dokument/api/{test\|prod}/zp` | Zgłoszenie przemieszczenia |
| ZAEI | `/api/indywidualne/dokument/api/{test\|prod}/zaei` | Zgłoszenie aktualizacji ewidencji |
| ZTUKU | `/api/indywidualne/dokument/api/{test\|prod}/ztuku` | Zgłoszenie tymczasowego ubytku kolczyka |
| ZZO | `/api/indywidualne/dokument/api/{test\|prod}/zzo` | Zgłoszenie zmiany oznakowania |

## Kody słownikowe

### Gatunek

| Kod | Opis |
|-----|------|
| B | Bydło |
| O | Owce |
| K | Kozy |
| J | Jelenie |
| W | Wielbłądy |

### Płeć

| Kod | Opis |
|-----|------|
| S | Samica |
| M | Samiec |

### Rasy bydła (przykładowe)

| Kod | Opis |
|-----|------|
| HF | Holsztyńsko-fryzyjska |
| SM | Simentalska |
| LM | Limousine |
| CH | Charolaise |
| AA | Aberdeen Angus |
| HE | Hereford |
| MM | Montbeliarde |
| JE | Jersey |
| RW | Polska czerwona |
| PC | Polska czarno-biała |

### Rasy owiec (przykładowe)

| Kod | Opis |
|-----|------|
| ME | Merynos |
| SU | Suffolk |
| TX | Texel |
| RO | Romney |
| DO | Dorset |

## Identyfikacja zwierząt indywidualnych

### Numer kolczyka
Zwierzęta indywidualne są identyfikowane przez **numer kolczyka** (numer identyfikacyjny).

Format: `PLXXXXXXXXXXXX`
- `PL` - kod kraju
- `XXXXXXXXXXXX` - unikalny numer (12 cyfr)

### Paszport
Bydło posiada dodatkowo paszport zwierzęcia z pełną historią.

## Pola odpowiedzi

| Pole | Typ | Opis |
|------|-----|------|
| `numerIdentyfikacyjnyZwierzecia` | string | Numer kolczyka |
| `gatunek` | object | Kod i opis gatunku |
| `dataUrodzenia` | date | Data urodzenia |
| `plec` | object | Kod i opis płci |
| `kodRasy` | object | Kod i opis rasy |
| `czyMatka` | boolean | Czy zwierzę było matką |
| `dataWyrejestrowania` | date | Data uboju/padnięcia/wywozu |
| `masaCialaZwierzecia` | number | Masa ciała (kg) |
| `masaTuszy` | number | Masa tuszy po uboju (kg) |
| `numerDzialalnosci` | string | Ostatnia działalność |
| `sposobOznakowania` | string | Sposób oznakowania |
| `informacjaOOswiadczeniuDDS` | string | Oświadczenie DDS |

## Użycie w aplikacji

```typescript
// Pobieranie listy zwierząt indywidualnych
const animals = await irzService.fetchAnimalsIndividual(
  username,
  password,
  producerNumber
);

// Pobieranie szczegółów pojedynczego zwierzęcia
const animalDetails = await irzService.fetchIndividualAnimalDetails(
  username,
  password,
  'PL123456789012'
);

if (animalDetails) {
  console.log('Zwierzę:', animalDetails.earTagNumber);
  console.log('Gatunek:', animalDetails.speciesName);
  console.log('Rasa:', animalDetails.breedName);
  console.log('Płeć:', animalDetails.genderName);
  console.log('Data urodzenia:', animalDetails.birthDate);
  console.log('Czy matka:', animalDetails.wasMother);
  console.log('Masa ciała:', animalDetails.bodyWeight, 'kg');
  
  if (animalDetails.deregistrationDate) {
    console.log('Wyrejestrowane:', animalDetails.deregistrationDate);
  }
} else {
  console.log('Zwierzę nie znalezione');
}
```

## Znormalizowane dane wyjściowe

```typescript
interface NormalizedIndividualAnimal {
  // Podstawowe pola
  irzId: string;
  earTagNumber: string;
  species: string;
  breed: string | null;
  gender: 'MALE' | 'FEMALE';
  birthDate: string | null;
  motherEarTag: string | null;

  // Pola rozszerzone
  speciesCode: string;      // Kod gatunku
  speciesName: string;      // Nazwa gatunku
  breedCode: string;        // Kod rasy
  breedName: string;        // Nazwa rasy
  genderCode: string;       // Kod płci
  genderName: string;       // Nazwa płci
  wasMother: boolean;       // Czy było matką
  deregistrationDate: string | null;  // Data wyrejestrowania
  bodyWeight: number | null;          // Masa ciała (kg)
  carcassWeight: number | null;       // Masa tuszy (kg)
  activityNumber: string | null;      // Ostatnia działalność
  markingMethod: string | null;       // Sposób oznakowania
  ddsStatement: string | null;        // Oświadczenie DDS
}
```

## Różnice między endpointami

| Aspekt | Lista zwierząt | Szczegóły zwierzęcia |
|--------|----------------|----------------------|
| Endpoint | `/zwierzetaIndywidualne` | `/zwierzeIndywidualne` |
| Parametr | `numerProducenta` | `numerIdentyfikacyjnyZwierzecia` |
| Wynik | Lista zwierząt | Pojedyncze zwierzę |
| Szczegółowość | Podstawowe dane | Pełne dane |
| Masa ciała | Brak | Dostępna |
| Masa tuszy | Brak | Dostępna |
| Status matki | Brak | Dostępny |



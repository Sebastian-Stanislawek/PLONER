import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { IrzAuthService } from './irz-auth.service';

// ============================================
// Interfejsy dla standardowego API IRZ+
// ============================================

interface IrzAnimal {
  numerIdentyfikacyjny?: string;
  numerKolczyka?: string;
  gatunek?: string;
  rasa?: string;
  plec?: string;
  dataUrodzenia?: string;
  numerMatkiKolczyk?: string;
}

interface IrzAnimalsResponse {
  dane?: IrzAnimal[];
  listaZwierzat?: IrzAnimal[];
}

// ============================================
// Interfejsy dla ZHK API (Koniowate)
// Zgodne z dokumentacją OpenAPI koniowate_P237
// ============================================

interface KodOpisWartosciDto {
  kod?: string;
  opis?: string;
}

interface SzczegolyZwierzeKoniowateDTO {
  rasa?: KodOpisWartosciDto;
  typRasowy?: KodOpisWartosciDto;
  niepowtarzalnyDozywotniNumerUelnMatki?: string;
  nazwaMatki?: string;
  niepowtarzalnyDozywotniNumerUelnOjcaDawcyNasienia?: string;
  nazwaOjcaLubDawcyNasienia?: string;
  numerKodTranspondera?: string;
  miejsceWszczepieniaTranspondera?: string;
  miejsceUrodzenia?: string;
  kodKrajuUrodzenia?: KodOpisWartosciDto;
  kastracja?: boolean;
  dataKastracji?: string;
}

interface ZwierzetaZHKDTO {
  lp?: number;
  idKoniowatego?: number;
  niepowtarzalnyDozywotniNumer?: string; // UELN - główny identyfikator
  imieNazwaKoniowatego?: string;
  dataUrodzenia?: string;
  gatunek?: KodOpisWartosciDto;
  plec?: KodOpisWartosciDto;
  masc?: KodOpisWartosciDto;
  numerDzialalnosci?: string;
  dataPrzybyciaDoDzialalnosci?: string;
  statusZwierzecia?: KodOpisWartosciDto;
  aktualnyStatusEpizootyczny?: KodOpisWartosciDto;
  krajPochodzenia?: KodOpisWartosciDto;
  wylaczenieZLancuchaZywnosciowego?: string;
  szczegolyZwierzeKoniowate?: SzczegolyZwierzeKoniowateDTO;
  historiaKodowTranspondera?: Array<{
    numerKodTranspondera?: string;
    dataObowiazywaniaOd?: string;
    dataObowiazywaniaDo?: string;
  }>;
}

interface IrzHorsesResponse {
  komunikat?: string;
  listaZwierzeta?: ZwierzetaZHKDTO[]; // Uwaga: 'listaZwierzeta' z 'a' na końcu
}

// ============================================
// Interfejsy dla zdarzeń koniowatych
// ============================================

interface ZdarzenieKoniowateZHKApiDTO {
  lp?: number;
  niepowtarzalnyDozytowniNumer?: string;
  typZdarzenia?: string;
  stanZdarzenia?: string;
  dataZdarzenia?: string;
  dataWplywu?: string;
  numerDzialalnosciZglaszajacej?: string;
  numerDzialalnosciKomplementarnej?: string;
  numerDokumentu?: string;
  idTechniczneZwierzecia?: number;
  dataUtworzenia?: string;
  dataModyfikacji?: string;
  bledy?: Array<{ kodBledu?: string; komunikat?: string }>;
}

interface IrzHorseEventsResponse {
  komunikat?: string;
  listaZdarzen?: ZdarzenieKoniowateZHKApiDTO[];
}

// ============================================
// Interfejsy dla API Drobiu
// Zgodne z dokumentacją OpenAPI usługa_API_drób_poP237
// ============================================

interface ZdarzenieDrobioweApiDTO {
  lp?: number;
  numerPartiiDrobiu?: string;
  gatunek?: KodOpisWartosciDto;
  liczbaSztukDrobiu?: number;
  liczbaSztukJajWylegowych?: number;
  typZdarzenia?: KodOpisWartosciDto;
  stanZdarzenia?: KodOpisWartosciDto;
  dataZdarzenia?: string;
  numerDzialalnosciZglaszajacej?: string;
  numerDzialalnosciKomplementarnej?: string;
  uuid?: string;
  blad?: Array<{ kodBledu?: string; komunikat?: string }>;
  szczegolyZdarzenia?: SzczegolyZdarzeniaDrobioweDTO;
}

interface SzczegolyZdarzeniaDrobioweDTO {
  // Wspólne pola
  gatunek?: KodOpisWartosciDto;
  numerPartiiDrobiu?: string;
  numerDzialalnosciZglaszajacej?: string;
  liczbaDrobiu?: number;
  liczbaJajWylegowych?: number;
  kategoriaJajWylegowych?: KodOpisWartosciDto;
  typZdarzenia?: KodOpisWartosciDto;
  dataZdarzenia?: string;
  dataWplywu?: string;
  
  // Transport
  wniPrzewoznika?: string;
  rodzajSrodkaTransportu?: KodOpisWartosciDto;
  nrRejestracyjnySrodkaTransportu?: string;
  transportWlasny?: boolean;
  
  // Lokalizacja
  budynek?: KodOpisWartosciDto;
  oznaczenieWsadu?: string;
  kodKraju?: KodOpisWartosciDto;
  
  // Specyficzne dla uboju (ZURD)
  numerPartiiUboju?: string;
  masaDrobiu?: number;
  ubojRytualny?: boolean;
  
  // Specyficzne dla unieszkodliwienia (ZUZD)
  masaCialaDrobiuJajWylegowych?: number;
  
  // Specyficzne dla ZZSSD
  sprzedazNaUzytekWlasny?: boolean;
  numerDzialalnosciKomplementanej?: string;
  
  // Import
  numerIdenPartiiDrobiuSpozaKraju?: string;
}

interface IrzPoultryEventsResponse {
  komunikat?: string;
  listaZdarzenie?: ZdarzenieDrobioweApiDTO[]; // Uwaga: 'listaZdarzenie' (bez 'a')
}

// Request do składania dyspozycji ZZSSD
interface DyspozycjaZZSSD {
  komorkaOrganizacyjna?: string;
  numerProducenta: string;
  zgloszenie: ZgloszenieZZSSDDTO;
}

interface ZgloszenieZZSSDDTO {
  pozycje?: PozycjaZZSSDDTO[];
  czyKorekta?: boolean;
  gatunek?: KodOpisWartosciDto;
  doDzialalnosci?: string;
  typZdarzenia?: KodOpisWartosciDto;
  dataZdarzenia?: string;
  liczbaDrobiuPrzybylo?: number;
  liczbaJajWylegowychPrzybylo?: number;
  kodKraju?: KodOpisWartosciDto;
}

interface PozycjaZZSSDDTO {
  lp?: number;
  statusPozycji?: 'ZATWIERDZONA' | 'DO_ZATWIERDZENIA' | 'POMINIETA';
  numerIdenPartiiDrobiu?: string;
  liczbaDrobiuUbylo?: number;
  liczbaJajWylegowychUbylo?: number;
  kategoriaJajWylegowych?: KodOpisWartosciDto;
  numerIdenPartiiDrobiuSpozaKraju?: string;
  wniPrzewoznika?: string;
  rodzajSrodkaTransportu?: KodOpisWartosciDto;
  nrRejestracyjnySrodkaTransportu?: string;
  transportWlasny?: boolean;
  budynek?: KodOpisWartosciDto;
  oznaczenieWsadu?: string;
  masaCialaDrobiuJajWylegowych?: number;
  czySprzedazNaWlasnePotrzeby?: boolean;
  zDzialalnosci?: string;
}

interface ZlozenieDyspozycjiResponse {
  komunikat?: string;
  bledy?: Array<{ kodBledu?: string; komunikat?: string }>;
  numerDokumentu?: string;
}

// ============================================
// Interfejsy dla API Świń (Grupowe)
// Zgodne z dokumentacją OpenAPI usługa_API_świnie_poP233
// ============================================

interface IdentyfikatorLochy {
  indywidualnyNumerIdentyfikacyjnyLochy?: string;
}

interface ZgloszenieSSSSDTO {
  pozycje?: Array<{
    lp?: number;
    statusPozycji?: 'ZATWIERDZONA' | 'DO_ZATWIERDZENIA' | 'POMINIETA';
  }>;
  czyKorekta?: boolean;
  typZdarzenia?: KodOpisWartosciDto;
  numerDzialalnosci?: string;
  liczbaSwinOznakowanych?: number;
  liczbaSwinNieoznakowanych?: number;
  liczbaSwin?: number;
  technologiaProdukcji?: KodOpisWartosciDto[];
  systemUtrzymaniaSwin?: KodOpisWartosciDto[];
  dataZdarzenia?: string;
  numeryLochy?: IdentyfikatorLochy[];
}

interface DyspozycjaSSSS {
  komorkaOrganizacyjna?: string;
  numerProducenta: string;
  zgloszenie: ZgloszenieSSSSDTO;
}

// ============================================
// Interfejsy dla API Zwierząt Indywidualnych
// Zgodne z dokumentacją OpenAPI indywidualne_P237
// ============================================

interface DaneZwierzeciaApiResponse {
  komunikat?: string;
  numerIdentyfikacyjnyZwierzecia?: string;
  gatunek?: KodOpisWartosciDto;
  dataUrodzenia?: string;
  plec?: KodOpisWartosciDto;
  kodRasy?: KodOpisWartosciDto;
  czyMatka?: boolean;
  dataWyrejestrowania?: string;
  masaCialaZwierzecia?: number;
  masaTuszy?: number;
  numerDzialalnosci?: string;
  sposobOznakowania?: string;
  informacjaOOswiadczeniuDDS?: string;
}

// ============================================
// Znormalizowane dane wyjściowe
// ============================================

export interface NormalizedAnimal {
  irzId: string;
  earTagNumber: string;
  species: string;
  breed: string | null;
  gender: 'MALE' | 'FEMALE';
  birthDate: string | null;
  motherEarTag: string | null;
}

export interface NormalizedHorse extends NormalizedAnimal {
  ueln: string; // Niepowtarzalny dożywotni numer UELN
  name: string | null; // Imię/nazwa koniowatego
  coat: string | null; // Maść
  transponderCode: string | null; // Numer transpondera
  fatherUeln: string | null; // UELN ojca
  fatherName: string | null; // Nazwa ojca
  isCastrated: boolean;
  castrationDate: string | null;
  countryOfOrigin: string | null;
  breedType: string | null; // Typ rasowy
}

/**
 * Znormalizowane dane partii drobiu
 * Drób w IRZ+ jest rejestrowany jako partie, nie pojedyncze zwierzęta
 */
export interface NormalizedPoultryBatch {
  batchNumber: string; // Numer partii drobiu
  species: string; // Gatunek (kod)
  speciesName: string | null; // Gatunek (opis)
  poultryCount: number; // Liczba sztuk drobiu
  hatchingEggsCount: number; // Liczba jaj wylęgowych
  activityNumber: string | null; // Numer działalności
}

/**
 * Znormalizowane zdarzenie drobiu
 */
export interface NormalizedPoultryEvent {
  id: string; // UUID zdarzenia
  batchNumber: string;
  species: string;
  speciesName: string | null;
  poultryCount: number;
  hatchingEggsCount: number;
  eventType: string; // Typ zdarzenia (kod)
  eventTypeName: string | null; // Typ zdarzenia (opis)
  eventStatus: string; // Stan zdarzenia (kod)
  eventStatusName: string | null; // Stan zdarzenia (opis)
  eventDate: string | null;
  reportingActivityNumber: string | null;
  complementaryActivityNumber: string | null;
  errors: Array<{ code: string; message: string }>;
}

/**
 * Znormalizowane dane stada świń
 * Świnie w IRZ+ są rejestrowane grupowo (stada), nie indywidualnie
 */
export interface NormalizedPigHerd {
  activityNumber: string; // Numer działalności
  totalPigs: number; // Łączna liczba świń
  taggedPigs: number; // Liczba świń oznakowanych
  untaggedPigs: number; // Liczba świń nieoznakowanych
  productionTechnologies: string[]; // Technologie produkcji
  keepingSystems: string[]; // Systemy utrzymania
  sowNumbers: string[]; // Numery loch (matek)
}

/**
 * Znormalizowane dane zwierzęcia indywidualnego
 * Zgodne z dokumentacją OpenAPI indywidualne_P237
 */
export interface NormalizedIndividualAnimal extends NormalizedAnimal {
  speciesCode: string; // Kod gatunku
  speciesName: string | null; // Nazwa gatunku
  breedCode: string | null; // Kod rasy
  breedName: string | null; // Nazwa rasy
  genderCode: string | null; // Kod płci
  genderName: string | null; // Nazwa płci
  wasMother: boolean; // Czy było matką
  deregistrationDate: string | null; // Data wyrejestrowania (ubój/padnięcie/wywóz)
  bodyWeight: number | null; // Masa ciała (kg)
  carcassWeight: number | null; // Masa tuszy (kg)
  activityNumber: string | null; // Ostatnia działalność
  markingMethod: string | null; // Sposób oznakowania
  ddsStatement: string | null; // Informacja o oświadczeniu DDS
}

@Injectable()
export class IrzService {
  private readonly logger = new Logger(IrzService.name);
  private readonly baseUrl: string;
  private readonly isTestMode: boolean;
  private httpClient: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly authService: IrzAuthService,
  ) {
    this.baseUrl = this.config.get('IRZ_API_BASE_URL') || 'https://irz.arimr.gov.pl/api';
    this.isTestMode = this.config.get('NODE_ENV') !== 'production';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: { Accept: 'application/json' },
    });
  }

  private getEndpointPath(path: string): string {
    const mode = this.isTestMode ? 'test' : 'prod';
    return path.replace('/prod/', `/${mode}/`).replace('/test/', `/${mode}/`);
  }

  /**
   * Pobiera listę zwierząt indywidualnych (bydło, owce, kozy, jelenie, wielbłądy)
   * Endpoint: /indywidualne/zwierze/api/{test|prod}/zwierzetaIndywidualne
   */
  async fetchAnimalsIndividual(
    username: string,
    password: string,
    producerNumber: string,
  ): Promise<NormalizedAnimal[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/indywidualne/zwierze/api/prod/zwierzetaIndywidualne');

    return this.fetchWithRetry(endpoint, token, producerNumber);
  }

  /**
   * Pobiera szczegółowe dane pojedynczego zwierzęcia indywidualnego
   * Endpoint: /indywidualne/zwierze/api/{test|prod}/zwierzeIndywidualne
   * Zgodne z dokumentacją OpenAPI indywidualne_P237
   */
  async fetchIndividualAnimalDetails(
    username: string,
    password: string,
    animalNumber: string,
  ): Promise<NormalizedIndividualAnimal | null> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/indywidualne/zwierze/api/prod/zwierzeIndywidualne');

    try {
      const response = await this.httpClient.get<DaneZwierzeciaApiResponse>(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { numerIdentyfikacyjnyZwierzecia: animalNumber },
      });

      if (!response.data.numerIdentyfikacyjnyZwierzecia) {
        return null;
      }

      return this.normalizeIndividualAnimal(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 404) {
        return null;
      }
      
      this.logger.error(`Błąd pobierania danych zwierzęcia: ${axiosError.message}`);
      throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
    }
  }

  /**
   * Pobiera dane świń ze standardowego API IRZ+
   * UWAGA: Świnie są rejestrowane grupowo (stada), nie indywidualnie
   * Endpoint: /grupowe/swinie/api/{test|prod}/dane
   */
  async fetchAnimalsPigs(
    username: string,
    password: string,
    producerNumber: string,
  ): Promise<NormalizedAnimal[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/grupowe/swinie/api/prod/dane');

    return this.fetchWithRetry(endpoint, token, producerNumber);
  }

  /**
   * Składa dyspozycję SSSS (Stan Stada Świń)
   * Endpoint: /grupowe/dokument/api/{test|prod}/ssss
   * Służy do zgłaszania stanu stada świń
   */
  async submitPigHerdSSSS(
    username: string,
    password: string,
    dyspozycja: DyspozycjaSSSS,
  ): Promise<ZlozenieDyspozycjiResponse> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/grupowe/dokument/api/prod/ssss');

    try {
      const response = await this.httpClient.post<ZlozenieDyspozycjiResponse>(
        endpoint,
        dyspozycja,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ZlozenieDyspozycjiResponse>;
      
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      
      this.logger.error(`Błąd składania dyspozycji SSSS: ${axiosError.message}`);
      throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
    }
  }

  /**
   * Pobiera dane drobiu ze standardowego API IRZ+
   * UWAGA: Drób jest rejestrowany jako partie, nie pojedyncze zwierzęta
   * Endpoint: /drob/zwierze/api/{test|prod}/drob
   */
  async fetchAnimalsPoultry(
    username: string,
    password: string,
    producerNumber: string,
  ): Promise<NormalizedAnimal[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/drob/zwierze/api/prod/drob');

    return this.fetchWithRetry(endpoint, token, producerNumber);
  }

  /**
   * Pobiera zdarzenia drobiu z API IRZ+
   * Endpoint: /drob/zdarzenia/api/{test|prod}/zdarzeniadrob
   * Zgodne z dokumentacją OpenAPI usługa_API_drób_poP237
   */
  async fetchPoultryEvents(
    username: string,
    password: string,
    params: {
      numerProducenta?: string;
      numerDzialalnosci?: string;
      numerPartiiDrobiu?: string;
      gatunek?: string; // Kod SIA-SL02125
      typZdarzenia?: string; // Kod SIA-SL02126
      stanZdarzenia?: string; // Kod SIA-SL02194
      dataZdarzeniaOd?: string; // Format: YYYY-MM-DD
      dataZdarzeniaDo?: string;
    },
  ): Promise<NormalizedPoultryEvent[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/drob/zdarzenia/api/prod/zdarzeniadrob');

    return this.fetchPoultryEventsWithRetry(endpoint, token, params);
  }

  /**
   * Pobiera zdarzenia drobiu dla Inspekcji Weterynaryjnej (IW)
   * Endpoint: /drob/zdarzenia/iw/api/{test|prod}/lista
   */
  async fetchPoultryEventsIW(
    username: string,
    password: string,
    params: {
      gatunek?: string; // Kod SIA-SL02125
      historiaZdarzen?: string; // Kod SIA-SL02196
      stanKorekty?: string; // Kod SIA-SL02253
      stanZdarzenia?: string; // Kod SIA-SL02194
      numerPartiiDrobiu?: string;
      typZdarzenia?: string; // Kod SIA-SL02126
      numerDzialalnosci?: string;
      numerDzialalnosciFormowaniaWysylki?: string;
      dataZdarzeniaOd?: string;
      dataZdarzeniaDo?: string;
      tylkoZdarzeniaWplywajaceNaLokalizacje?: boolean;
    },
  ): Promise<NormalizedPoultryEvent[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/drob/zdarzenia/iw/api/prod/lista');

    return this.fetchPoultryEventsWithRetry(endpoint, token, params);
  }

  /**
   * Składa dyspozycję ZZSSD (Zgłoszenie Zmiany Stanu Stada Drobiu)
   * Endpoint: /drob/dokument/api/{test|prod}/zzssd
   * Służy do zgłaszania sprzedaży/przemieszczenia drobiu
   */
  async submitPoultryZZSSD(
    username: string,
    password: string,
    dyspozycja: DyspozycjaZZSSD,
  ): Promise<ZlozenieDyspozycjiResponse> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/drob/dokument/api/prod/zzssd');

    try {
      const response = await this.httpClient.post<ZlozenieDyspozycjiResponse>(
        endpoint,
        dyspozycja,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ZlozenieDyspozycjiResponse>;
      
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      
      this.logger.error(`Błąd składania dyspozycji ZZSSD: ${axiosError.message}`);
      throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
    }
  }

  private async fetchPoultryEventsWithRetry(
    endpoint: string,
    token: string,
    params: Record<string, unknown>,
    retries = 3,
  ): Promise<NormalizedPoultryEvent[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.get<IrzPoultryEventsResponse>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const events = response.data.listaZdarzenie || [];
        return events.map(this.normalizePoultryEvent);
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 401) {
          throw new Error('Token IRZ+ wygasł');
        }

        if (status && status >= 500 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Błąd serwera IRZ+ (${status}), ponowna próba za ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`Błąd pobierania zdarzeń drobiu: ${axiosError.message}`);
        throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
      }
    }

    throw new Error('Przekroczono limit prób połączenia z IRZ+');
  }

  /**
   * Pobiera koniowate ze standardowego API IRZ+
   * Endpoint: /koniowate/zwierze/api/{test|prod}/koniowate
   */
  async fetchAnimalsHorses(
    username: string,
    password: string,
    producerNumber: string,
  ): Promise<NormalizedHorse[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/koniowate/zwierze/api/prod/koniowate');

    return this.fetchHorsesWithRetry(endpoint, token, { numerProducenta: producerNumber });
  }

  /**
   * Pobiera koniowate z ZHK API (Związek Hodowców Koniowatych)
   * Endpoint: /koniowate/zwierze/zhk/api/{test|prod}/lista
   * Zgodne z dokumentacją OpenAPI koniowate_P237
   */
  async fetchAnimalsHorsesZHK(
    username: string,
    password: string,
    params: {
      numerProducenta?: string;
      numerDzialalnosci?: string;
      gatunek?: string; // Kod SIA-SL02120
      niepowtarzalnyDozywotniNumer?: string; // UELN
      plec?: string; // Kod SIA-SL02121
      numerSrodkaIdentyfikacji?: string; // Transponder
      nazwaKoniowatego?: string;
      masc?: string; // Kod SIA-SL02122
      stanDanychNaDzien?: string; // Format: YYYY-MM-DD
      idKoniowatego?: number;
      dataModyfikacjiBiznesowejOd?: string;
      dataModyfikacjiBiznesowejDo?: string;
      tylkoWykastrowane?: boolean;
      tylkoZeZmianaTranspondera?: boolean;
      tylkoZWaznaLicencja?: boolean;
    },
  ): Promise<NormalizedHorse[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/koniowate/zwierze/zhk/api/prod/lista');

    return this.fetchHorsesWithRetry(endpoint, token, params);
  }

  /**
   * Pobiera zdarzenia koniowatych z ZHK API
   * Endpoint: /koniowate/zdarzenia/zhk/api/{test|prod}/lista
   */
  async fetchHorseEventsZHK(
    username: string,
    password: string,
    params: {
      numerDzialalnosci?: string;
      idKoniowatego?: string;
      numerKodTranspondera?: string;
      niepowtarzalnyDozywotniNumerUELN?: string;
      gatunek?: string;
      typZdarzenia?: string;
      stanZdarzenia?: string;
      kodBledu?: string;
      dataZdarzeniaOd?: string;
      dataZdarzeniaDo?: string;
      dataUtworzeniaOd?: string;
      dataUtworzeniaDo?: string;
      dataModyfikacjiOd?: string;
      dataModyfikacjiDo?: string;
    },
  ): Promise<ZdarzenieKoniowateZHKApiDTO[]> {
    const token = await this.authService.getToken(username, password);
    const endpoint = this.getEndpointPath('/koniowate/zdarzenia/zhk/api/prod/lista');

    return this.fetchHorseEventsWithRetry(endpoint, token, params);
  }

  private async fetchHorsesWithRetry(
    endpoint: string,
    token: string,
    params: Record<string, unknown>,
    retries = 3,
  ): Promise<NormalizedHorse[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.get<IrzHorsesResponse>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const horses = response.data.listaZwierzeta || [];
        return horses.map(this.normalizeHorse);
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 401) {
          this.logger.warn('Token wygasł, próba ponowna...');
          throw new Error('Token IRZ+ wygasł');
        }

        if (status && status >= 500 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Błąd serwera IRZ+ (${status}), ponowna próba za ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`Błąd pobierania koniowatych: ${axiosError.message}`);
        throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
      }
    }

    throw new Error('Przekroczono limit prób połączenia z IRZ+');
  }

  private async fetchHorseEventsWithRetry(
    endpoint: string,
    token: string,
    params: Record<string, unknown>,
    retries = 3,
  ): Promise<ZdarzenieKoniowateZHKApiDTO[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.get<IrzHorseEventsResponse>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        return response.data.listaZdarzen || [];
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 401) {
          throw new Error('Token IRZ+ wygasł');
        }

        if (status && status >= 500 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`Błąd pobierania zdarzeń koniowatych: ${axiosError.message}`);
        throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
      }
    }

    throw new Error('Przekroczono limit prób połączenia z IRZ+');
  }

  private async fetchWithRetry(
    endpoint: string,
    token: string,
    producerNumber: string,
    retries = 3,
  ): Promise<NormalizedAnimal[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.get<IrzAnimalsResponse>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params: { numerProducenta: producerNumber },
        });

        const animals = response.data.dane || response.data.listaZwierzat || [];
        return animals.map(this.normalizeAnimal);
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 401) {
          this.logger.warn('Token wygasł, próba ponowna...');
          throw new Error('Token IRZ+ wygasł');
        }

        if (status && status >= 500 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Błąd serwera IRZ+ (${status}), ponowna próba za ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`Błąd pobierania zwierząt: ${axiosError.message}`);
        throw new Error(`Błąd API IRZ+: ${axiosError.message}`);
      }
    }

    throw new Error('Przekroczono limit prób połączenia z IRZ+');
  }

  private normalizeAnimal = (animal: IrzAnimal): NormalizedAnimal => {
    const earTag = animal.numerKolczyka || animal.numerIdentyfikacyjny || '';
    
    return {
      irzId: earTag,
      earTagNumber: earTag,
      species: this.mapSpecies(animal.gatunek),
      breed: animal.rasa || null,
      gender: this.mapGender(animal.plec),
      birthDate: animal.dataUrodzenia || null,
      motherEarTag: animal.numerMatkiKolczyk || null,
    };
  };

  private mapSpecies(gatunek?: string): string {
    const mapping: Record<string, string> = {
      bydlo: 'CATTLE',
      bydło: 'CATTLE',
      owce: 'SHEEP',
      kozy: 'GOAT',
      swinie: 'PIG',
      świnie: 'PIG',
      drob: 'POULTRY',
      drób: 'POULTRY',
      koniowate: 'HORSE',
      konie: 'HORSE',
      jelenie: 'DEER',
      wielblady: 'CAMEL',
      wielbłądy: 'CAMEL',
    };

    const normalized = gatunek?.toLowerCase() || '';
    return mapping[normalized] || 'CATTLE';
  }

  private mapGender(plec?: string): 'MALE' | 'FEMALE' {
    const male = ['samiec', 'm', 'male', 'byk', 'buhaj', 'knur', 'tryk', 'cap', 'ogier'];
    return male.includes(plec?.toLowerCase() || '') ? 'MALE' : 'FEMALE';
  }

  /**
   * Mapowanie płci z kodu słownikowego (SIA-SL02121)
   * Kody: O - ogier (samiec), K - klacz (samica), W - wałach (samiec wykastrowany)
   */
  private mapGenderFromCode(kod?: string): 'MALE' | 'FEMALE' {
    const maleCodes = ['o', 'w', 'm', '1']; // O=ogier, W=wałach, M=samiec
    return maleCodes.includes(kod?.toLowerCase() || '') ? 'MALE' : 'FEMALE';
  }

  /**
   * Normalizacja szczegółowych danych zwierzęcia indywidualnego
   */
  private normalizeIndividualAnimal = (data: DaneZwierzeciaApiResponse): NormalizedIndividualAnimal => {
    const earTag = data.numerIdentyfikacyjnyZwierzecia || '';
    
    return {
      // Podstawowe pola NormalizedAnimal
      irzId: earTag,
      earTagNumber: earTag,
      species: this.mapSpeciesFromCode(data.gatunek?.kod),
      breed: data.kodRasy?.opis || null,
      gender: this.mapGenderFromCode(data.plec?.kod),
      birthDate: data.dataUrodzenia || null,
      motherEarTag: null, // Nie dostępne w tym endpoincie

      // Pola rozszerzone
      speciesCode: data.gatunek?.kod || '',
      speciesName: data.gatunek?.opis || null,
      breedCode: data.kodRasy?.kod || null,
      breedName: data.kodRasy?.opis || null,
      genderCode: data.plec?.kod || null,
      genderName: data.plec?.opis || null,
      wasMother: data.czyMatka || false,
      deregistrationDate: data.dataWyrejestrowania || null,
      bodyWeight: data.masaCialaZwierzecia || null,
      carcassWeight: data.masaTuszy || null,
      activityNumber: data.numerDzialalnosci || null,
      markingMethod: data.sposobOznakowania || null,
      ddsStatement: data.informacjaOOswiadczeniuDDS || null,
    };
  };

  /**
   * Mapowanie gatunku z kodu słownikowego
   */
  private mapSpeciesFromCode(kod?: string): string {
    const mapping: Record<string, string> = {
      'B': 'CATTLE',    // Bydło
      'O': 'SHEEP',     // Owce
      'K': 'GOAT',      // Kozy
      'J': 'DEER',      // Jelenie
      'W': 'CAMEL',     // Wielbłądy
      'S': 'PIG',       // Świnie
      'D': 'POULTRY',   // Drób
      'KO': 'HORSE',    // Koniowate
    };
    return mapping[kod?.toUpperCase() || ''] || 'CATTLE';
  }

  /**
   * Normalizacja zdarzenia drobiu
   */
  private normalizePoultryEvent = (event: ZdarzenieDrobioweApiDTO): NormalizedPoultryEvent => {
    return {
      id: event.uuid || String(event.lp || ''),
      batchNumber: event.numerPartiiDrobiu || '',
      species: event.gatunek?.kod || '',
      speciesName: event.gatunek?.opis || null,
      poultryCount: event.liczbaSztukDrobiu || 0,
      hatchingEggsCount: event.liczbaSztukJajWylegowych || 0,
      eventType: event.typZdarzenia?.kod || '',
      eventTypeName: event.typZdarzenia?.opis || null,
      eventStatus: event.stanZdarzenia?.kod || '',
      eventStatusName: event.stanZdarzenia?.opis || null,
      eventDate: event.dataZdarzenia || null,
      reportingActivityNumber: event.numerDzialalnosciZglaszajacej || null,
      complementaryActivityNumber: event.numerDzialalnosciKomplementarnej || null,
      errors: (event.blad || []).map((b) => ({
        code: b.kodBledu || '',
        message: b.komunikat || '',
      })),
    };
  };

  /**
   * Normalizacja danych koniowatego z ZHK API
   */
  private normalizeHorse = (horse: ZwierzetaZHKDTO): NormalizedHorse => {
    const ueln = horse.niepowtarzalnyDozywotniNumer || '';
    const szczegoly = horse.szczegolyZwierzeKoniowate;

    // Znajdź aktualny transponder (pierwszy bez daty zakończenia)
    const currentTransponder = horse.historiaKodowTranspondera?.find(
      (t) => !t.dataObowiazywaniaDo
    );

    return {
      // Podstawowe pola NormalizedAnimal
      irzId: String(horse.idKoniowatego || ueln),
      earTagNumber: ueln, // Dla koniowatych UELN pełni rolę kolczyka
      species: 'HORSE',
      breed: szczegoly?.rasa?.opis || null,
      gender: this.mapGenderFromCode(horse.plec?.kod),
      birthDate: horse.dataUrodzenia || null,
      motherEarTag: szczegoly?.niepowtarzalnyDozywotniNumerUelnMatki || null,

      // Pola specyficzne dla koniowatych
      ueln,
      name: horse.imieNazwaKoniowatego || null,
      coat: horse.masc?.opis || null,
      transponderCode: currentTransponder?.numerKodTranspondera || szczegoly?.numerKodTranspondera || null,
      fatherUeln: szczegoly?.niepowtarzalnyDozywotniNumerUelnOjcaDawcyNasienia || null,
      fatherName: szczegoly?.nazwaOjcaLubDawcyNasienia || null,
      isCastrated: szczegoly?.kastracja || false,
      castrationDate: szczegoly?.dataKastracji || null,
      countryOfOrigin: horse.krajPochodzenia?.opis || szczegoly?.kodKrajuUrodzenia?.opis || null,
      breedType: szczegoly?.typRasowy?.opis || null,
    };
  };

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


 Propozycje dalszych prac nad aplikacją
Propozycja 1: Integracja z API IRZ+ (Klient + Synchronizacja)
Priorytet: WYSOKI | Czas: 2-3 dni
Implementacja pełnej integracji z IRZ+:
Klient HTTP do API IRZ+ z OAuth2 (token refresh, retry logic)
Background job do synchronizacji zwierząt (BullMQ processor)
UI do podłączenia danych logowania IRZ+ w ustawieniach gospodarstwa
Przycisk "Synchronizuj" z progress barem i statusem
Efekt: Użytkownik będzie mógł pobrać listę zwierząt z IRZ+ do aplikacji.
Propozycja 2: Formularz zgłoszenia padnięcia + PDF
Priorytet: WYSOKI | Czas: 2 dni
Kluczowa funkcja MVP:
Formularz wyboru zwierzęcia z listy
Automatyczne uzupełnianie danych z bazy
Generowanie PDF zgodnego z wymaganiami GIW
Wysyłka zgłoszenia do IRZ+ (endpoint /zpzu)
Archiwizacja dokumentu w systemie
Efekt: Rolnik może zgłosić padnięcie zwierzęcia w 2 kliknięcia zamiast ręcznego wypełniania formularzy.
Propozycja 3: Dashboard z danymi + Przypomnienia
Priorytet: ŚREDNI | Czas: 1-2 dni
Ulepszenie UX:
Statystyki na dashboardzie (liczba zwierząt, ostatnia sync, zgłoszenia do wysłania)
Lista ostatnich aktywności
System przypomnień o terminach zgłoszeń (urodzenia: 7 dni, padnięcia: 7 dni)
Powiadomienia w aplikacji (toast/banner)
Efekt: Użytkownik widzi stan gospodarstwa na pierwszy rzut oka i nie przegapi terminów.
Moja rekomendacja: Zacznij od Propozycji 1 (integracja IRZ+), ponieważ bez danych zwierząt pozostałe funkcje nie mają sensu. Następnie Propozycja 2 (zgłoszenie padnięcia) - to core value aplikacji.
Którą propozycję chcesz zrealizować?
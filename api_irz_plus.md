API Produkcyjne v.1 (02.02.2023r.)
Wprowadzenie
API IRZplus to zestaw usług dla Producentów oraz Pracowników producentów, za pomocą których możliwe jest złożenie dokumentów IRZ za pośrednictwem API. Użytkownik ma możliwość wprowadzania dokumentów dotyczących świń, bydła, owiec, kóz, jeleni, wielbłądów, koni i drobiu.                     API IRZplus umożliwia również pobranie danych dokumentów złożonych, zwierząt oraz zdarzeń zwierząt.
Informacje podstawowe
API IRZplus umożliwia uprawnionym użytkownikom złożenie zgłoszenia lub pobranie danych z systemu po wcześniejszym wdrożeniu mechanizmów integracyjnych w ramach systemu/aplikacji po stronie użytkownika zewnętrznego. 
W celu budowy i przetestowania mechanizmów integrujących użytkownicy mogą skorzystać z API Testowego Portalu IRZplus.
Dane nie stanowią tzw. danych publicznych ze względów bezpieczeństwa dostęp do ww. danych wymaga uwierzytelnienia użytkownika. Uwierzytelnianie zrealizowane jest poprzez dedykowaną usługę opisaną w rozdziale Autoryzacja. 
Po skutecznym uwierzytelnieniu użytkownika, w odpowiedzi (do serwisu wywołującego) zwrócony zostanie token użytkownika uprawniający (dla danego użytkownika) do wywołania usług merytorycznych zapewniających możliwość złożenia dokumentu oraz pobrania danych z systemu.

Autoryzacja
W celu wywołania mechanizmu uwierzytelnienia użytkownika po stronie serwisu wywołującego należy wygenerować request z uwzględnieniem następujących parametrów:
Request URL: https://sso.arimr.gov.pl/auth/realms/ewniosekplus/protocol/openid-connect/token
Request Method: POST
Request Headers:
	KEY: Content-Type
	VALUE: application/x-www-form-urlencoded

Request Body: zestaw danych KEY oraz VALUE – zgodnie z definicją parametrów wejściowych usługi 

KEY: 
username
password
client_id
grant_type
	VALUE:
<login użytkownika>
<hasło do konta Portal IRZplus>
aplikacja-irzplus
password

W odpowiedzi na request pochodzący z serwisu wywołującego, serwis uwierzytelniający użytkownika 
po stronie ARiMR przekaże odpowiedź w ramach której:
•	w przypadku skutecznego uwierzytelnienia użytkownika przekazany zostanie jego „access_token”. Przekazywany w odpowiedzi token jest zgodny ze standardem JSON Web Token,
•	w przypadku nieprawidłowych danych logowania przekazana zostanie informacja o błędzie.
W przypadku braku możliwości uwierzytelnienia użytkownika (np. błędny login i/lub hasłu) 
w odpowiedzi przekazane zostaną następujące informacje:
 "error": "invalid_grant",
 "error_description": "Invalid user credentials"

W przypadku API serwis wywołujący powinien wykorzystywać login i hasło takie jak 
w przypadku logowania do aplikacji IRZplus. 
W przypadku API testowego serwis wywołujący powinien wykorzystywać następujący  login i hasło:
Username : api_test_portalirzplus1
Password: api_test_portalirzplus1


API IRZplus
API IRZplus pozwala (po wcześniejszym uwierzytelnieniu) na składanie dokumentów z wykorzystaniem dedykowanych usług oraz na pobranie danych merytorycznych.
Składanie zgłoszeń
Składanie zgłoszeń z poziomu API IRZplus pozwala na złożenie dokumentu analogicznie jak ma to miejsce w IRZplus. Po otrzymaniu wywołania usługi pochodzącego z serwisu wywołującego system Portal IRZplus wykonuje następujące kroki:
•	Weryfikacja możliwości złożenia dokumentu na podstawie danych zakodowanych 
w access_token i danych merytorycznych dokumentu,
•	Walidacja i wstępna weryfikacja parametrów wejściowych,
•	Zapis/zmodyfikowanie danych dokumentu.

W celu wywołania usługi do składania dyspozycji po stronie serwisu wywołującego należy wygenerować request z uwzględnieniem następujących parametrów:
Request URL: zgodnie z adresami usług wymienionymi w kolejnych rozdziałach.
Request Method: POST
Request Authorization: Bearer „access_token”
Request Headers:
	KEY: content-type
	VALUE: multipart/from-data
Request Body: zgodnie z dokumentacją swagger 
Dokumentację swagger można uruchomić przez wczytanie poszczególnych plików z zakresem na stronie np. https://editor.swagger.io/
Jeśli złożenie dyspozycji powiodło się, zostanie zwrócony komunikat o pomyślnym złożeniu dokumentu wraz z nadanym numerem.

Pobieranie danych.
Usługa służy do pobierania danych w IRZplus z poziomu API.
W celu wywołania usługi do składania dyspozycji po stronie serwisu wywołującego należy wygenerować request z uwzględnieniem następujących parametrów:
Request URL: zgodnie z adresami usług wymienionymi w poszczególnych usługach.
Request Method: GET
Request Authorization: Bearer „access_token”
Request Headers:
	KEY: Accept
	VALUE: application/json
Request Body: zgodnie z dokumentacją swagger
Dokumentację swagger można uruchomić przez wczytanie poszczególnych plików z zakresem na stronie np. https://editor.swagger.io/

Jeśli wywołana usługa poprawnie zweryfikuje parametry wejściowe, zostaną wyszukane dane merytoryczne określone w specjalizacji poszczególnych funkcji.
System weryfikuje poprawność parametrów wejściowych a w przypadku braku podania parametrów obowiązkowych zwraca komunikat „Nie podano obowiązkowych parametrów” jeśli wystąpi błędny format parametrów wejściowych zwracany jest komunikat „Wprowadzono parametry w błędnym formacie”.



API testowe Portalu IRZplus
API Testowe Portalu IRZplus pozwala (po wcześniejszym uwierzytelnieniu) na testowe składanie dyspozycji dokumentów z wykorzystaniem dedykowanych usług oraz na testowe pobranie danych merytorycznych. API Testowe IRZplus to wersja w której można używać do integracji i testów. API Testowe PIRZplus działa na spreparowanych danych, zdefiniowanych na sztywno. API Testowe Portalu IRZplus nie ma dostępu do produkcyjnej bazy danych Portalu IRZplus.
W przypadku składania dyspozycji/pobierania danych  w ramach API Testowego  IRZplus, API działa w ramach dwóch scenariuszy:
•	Scenariusz pozytywny (tj. wywołanie usługi z danymi zgodnymi z danymi oczekiwanymi) – API Testowe Portalu IRZplus zwraca informację o pomyślnym złożeniu dokumentu,
•	Scenariusz negatywny (tj. wywołanie usługi z danymi niezgodnymi z danymi oczekiwanymi) – API Testowe Portalu IRZplus zwraca informację o wystąpieniu błędu blokującego, który uniemożliwia złożenie dyspozycji.

Adresy funkcji i ich krótki opis w załączonym pliku. API_IRZplus_producent_02.02.2023.xlsx


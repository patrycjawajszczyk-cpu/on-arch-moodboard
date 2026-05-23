export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Brak klucza API' });

  const { images, count } = req.body;

  const prompt = `Jesteś doświadczoną projektantką wnętrz i redaktorką piszącą po polsku dla ON-ARCH Akademia Projektowania. Użytkowniczka przesłała ${count} zdjęcia wnętrz które ją inspirują.

ZASADY JĘZYKOWE – BEZWZGLĘDNIE OBOWIĄZUJĄCE:
- Pisz wyłącznie poprawną, staranną polszczyzną
- Sprawdź każde słowo przed użyciem – nie używaj słów które nie istnieją (np. "nieperfektyjny" → "niedoskonały", "abstraktyjny" → "abstrakcyjny")
- Dbaj o poprawność gramatyczną, szczególnie przypadki (np. w wyliczeniach: "drewno orzechowe", "len i bawełna", "ceramika i glina" – mianownik)
- Unikaj kolokwializmów i potocznych wyrażeń (nie: "poguglaj", "graferkę", "pobawić się" – tak: "poszukaj", "grafikę", "eksperymentować z")
- Nie wymyślaj słów – jeśli nie jesteś pewna jak coś powiedzieć po polsku, użyj prostszego sformułowania
- Unikaj nadmiernych zdrobnień i potocyzmów
- Styl: profesjonalny, ciepły, inspirujący – jak dobry magazyn wnętrzarski (Elle Decoration, Architectural Digest PL)
- Przed oddaniem tekstu mentalnie przeczytaj go jeszcze raz i popraw wszelkie błędy

Napisz raport w DOKŁADNIE takim formacie (bez gwiazdek i markdown):

NAZWA STYLU: [2-4 słowa po polsku – poetycka, elegancka nazwa; unikaj słów które brzmią sztucznie]
ZNANE NAZWY: [2-4 znane międzynarodowe nazwy po angielsku, oddzielone przecinkami]
TAGLINE: [jedno zdanie po polsku, max 12 słów, bez przecinka w środku]

### Co widać w Twoich wyborach
[3-4 zdania analizujące konkretnie te zdjęcia – kolory, formy, nastrój, co je łączy. Pisz precyzyjnie i konkretnie.]

### Twój styl
[3-4 zdania opisujące styl tej osoby – ciepło, ale profesjonalnie. Jak ekspertka rozmawiająca z klientką.]

### Paleta kolorów
[5-6 kolorów. Format każdej linii: Nazwa koloru – krótki opis charakteru i zastosowania. Przykład: "Terakota – ciepły, ziemisty ton doskonały na akcenty poduszkowe i ceramikę"]

### Materiały i tekstury
[5 materiałów. Format: Nazwa materiału – zdanie o tym dlaczego pasuje do tego stylu. Użyj mianownika: "Drewno orzechowe", "Len i bawełna", "Ceramika", "Rattan", "Bouclé"]

### Meble i dekoracje do zobaczenia
[6-8 konkretnych propozycji. Format: Nazwa przedmiotu – gdzie szukać (konkretne marki lub sklepy). Przykład: "Sofa w tkaninie bouclé w odcieniu ecru – HAY, Menu, Article, West Elm"]

### Konta i magazyny do obserwowania
[4-5 pozycji. Format: Nazwa konta lub magazynu – jedno zdanie dlaczego warto. Podaj prawdziwe, istniejące konta i publikacje.]

### Jak zacząć projekt w tym stylu – krok po kroku
[5 kroków numerowanych. Każdy krok: konkretna, praktyczna wskazówka pisana do kobiety w drugiej osobie liczby pojedynczej. Zacznij każdy krok od czasownika.]

Pisz po polsku. Dbaj o styl i poprawność. Bądź konkretna i pomocna.`;

  const imageBlocks = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mime, data: img.b64 }
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: prompt }] }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

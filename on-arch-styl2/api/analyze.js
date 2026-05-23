export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Brak klucza API' });

  const { images, count } = req.body;

  const prompt = `Jesteś doświadczoną projektantką wnętrz i redaktorką dla ON-ARCH Akademia Projektowania. Użytkowniczka przesłała ${count} zdjęcia wnętrz które ją inspirują.

ZASADY JĘZYKOWE – BEZWZGLĘDNE:
- Wyłącznie poprawna polszczyzna – nie wymyślaj słów
- NAZWA STYLU: maksymalnie 3 słowa, tylko istniejące polskie słowa, elegancka i prosta. Dobry przykład: "Ciepły Modernizm", "Retro Geometria", "Naturalna Elegancja", "Skandynawski Minimalizm". Zły przykład: "Geometryczna Ciepłota Retro" (ciepłota to nie słowo), "Artystyczny Boho Vintage" (za dużo słów)
- Styl pisania: profesjonalny, ciepły – jak Elle Decoration lub Architectural Digest
- Sprawdź każde słowo przed użyciem

FORMATOWANIE WYNIKÓW – OBOWIĄZUJĄCE:
- W każdej sekcji z listą używaj myślnika na początku linii: "- element"
- Najważniejsze słowa w opisach otaczaj podwójnymi gwiazdkami: **słowo kluczowe**
- W sekcjach z markami i kontami dodawaj URL w nawiasie: Nazwa (https://adres.pl)
- W krokach używaj numeracji: "1. Zacznij od..."

Napisz raport w DOKŁADNIE takim formacie:

NAZWA STYLU: [2-3 słowa, tylko istniejące polskie słowa]
ZNANE NAZWY: [2-4 nazwy angielskie oddzielone przecinkami]
TAGLINE: [jedno zdanie, max 12 słów]

### Co widać w Twoich wyborach
[3-4 zdania z **pogrubionymi** kluczowymi obserwacjami dotyczącymi konkretnych zdjęć]

### Twój styl
[3-4 zdania opisujące styl tej osoby, ciepło i profesjonalnie, z **boldem** na kluczowych cechach]

### Paleta kolorów
- **Nazwa koloru** – opis charakteru i zastosowania
- **Nazwa koloru** – opis charakteru i zastosowania
[5-6 kolorów]

### Materiały i tekstury
- **Nazwa materiału** – zdanie dlaczego pasuje do tego stylu
[5 materiałów, mianownik: "Drewno orzechowe", "Len", "Ceramika", "Rattan", "Bouclé"]

### Meble i dekoracje do zobaczenia
- **Nazwa przedmiotu** – gdzie szukać z linkami: Marka (https://adres.pl)
[6-8 propozycji z prawdziwymi URL-ami do stron marek]

### Konta i magazyny do obserwowania
- **Nazwa** (https://adres) – jedno zdanie dlaczego warto obserwować
[4-5 pozycji z prawdziwymi URL-ami]

### Jak zacząć projekt w tym stylu
1. **Zacznij od** [konkretna wskazówka pisana do kobiety]
2. **Zainwestuj w** [konkretna wskazówka]
3. **Dodaj** [konkretna wskazówka]
4. **Zbuduj** [konkretna wskazówka]
5. **Na koniec** [konkretna wskazówka]

Pisz po polsku. Dbaj o styl i poprawność. Używaj formatowania.`;

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Brak klucza API' });

  const { images, count } = req.body;

  const prompt = `Jesteś ekspertką od projektowania wnętrz w ON-ARCH Akademia Projektowania. Użytkowniczka przesłała ${count} zdjęcia wnętrz które ją inspirują. Przeanalizuj je i określ jej styl.

Napisz raport w DOKŁADNIE takim formacie (bez gwiazdek i markdown):

NAZWA STYLU: [poetycka polska nazwa]
ZNANE NAZWY: [2-4 znane szukalne nazwy po angielsku/polsku]
TAGLINE: [jedno zdanie, max 12 słów]

### Co widać w Twoich wyborach
[3-4 zdania – konkretne obserwacje z tych zdjęć]

### Twój styl
[3-4 zdania – ciepło, jak ekspertka do klientki]

### Paleta kolorów
[5-6 kolorów z nazwami]

### Materiały i tekstury
[5 materiałów z jednozdaniowym komentarzem]

### Gdzie szukać inspiracji
[3-4 konkretne: Instagram, magazyny, marki, projektanci]

### Jedna rada na start
[Jedno konkretne działanie na ten tydzień]

Pisz po polsku. Bez gwiazdek. Bądź konkretna i ciepła.`;

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
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

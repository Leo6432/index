const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));

app.get('/api/check', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = (req.query.url || '').trim();
  if (!url) return res.json({ status: 'error', msg: 'missing url' });

  const bingUrl = 'https://www.bing.com/search?q=' +
    encodeURIComponent('site:' + url) + '&count=1&setlang=fr';

  try {
    const r = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    });

    const html = await r.text();

    const NO = [
      /no results found/i,
      /there are no results for/i,
      /didn.t match any results/i,
      /aucun r[eé]sultat/i,
      /keine Ergebnisse/i,
      /class="b_no"/,
    ];
    const YES = [
      /class="b_algo"/,
      /b_attribution/,
    ];

    for (const p of NO)  if (p.test(html)) return res.json({ status: 'not-indexed' });
    for (const p of YES) if (p.test(html)) return res.json({ status: 'indexed' });

    return res.json({ status: 'error', msg: 'ambiguous response' });

  } catch (e) {
    return res.json({ status: 'error', msg: e.message });
  }
});

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('');
  console.log('  SEO Index Dashboard');
  console.log('  -------------------');
  console.log(`  Ouvrez http://localhost:${PORT} dans votre navigateur`);
  console.log('');
});

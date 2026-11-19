# Greyson Contact Mailer (Cloudflare Worker + Resend — €0/mnd)

Serverless contactformulier-backend voor `greyson.nl` en `automate.greyson.nl` die buiten je gratis DigitalOcean Static Site draait (zodat DigitalOcean $0 blijft) en via **Resend** rechtstreeks naar `info@greyson.nl` mailt.

## Ingebouwde beveiliging
- **Limiet per gebruiker:** Maximaal **3 berichten per dag** per gehashte IP (`SHA-256` met salt in Cloudflare KV, geen ruwe IP's opgeslagen, 25 uur TTL).
- **Globale daglimiet:** Maximaal **80 berichten per dag** als veiligheidsrem onder Resend's gratis cap van 100/dag.
- **CORS / Origin allowlist:** Alleen verzoeken vanaf `greyson.nl`, `www.greyson.nl`, `automate.greyson.nl` en `automation.greyson.nl`.
- **Honeypot (`website`):** Bots worden stil genegeerd zonder Resend-quota te verbruiken.

## Eenmalig gratis live zetten (5 minuten)

1. **Gratis Resend-account (`resend.com`):**
   - Maak een gratis account (3.000 mails/mnd, max 100/dag).
   - Voeg domein **`greyson.nl`** toe onder *Domains* en plak de getoonde `DKIM` (`resend._domainkey`) en `send.greyson.nl` `MX`/`SPF`-records in je **`mijn.host`** DNS. *(Jouw root `MX 10 dk01.my.host` blijft hierdoor intact!)*
   - Maak onder *API Keys* een sleutel (`Sending access` op `greyson.nl`) en kopieer hem (`re_...`).

2. **Gratis Cloudflare Worker + KV deployen:**
   ```powershell
   cd workers/contact-mailer
   npx wrangler login
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```
   Plak het verkregen `id` in `wrangler.toml` (haal de `#` weg bij `[[kv_namespaces]]`), sla op en zet je secrets:
   ```powershell
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RATE_LIMIT_SALT
   npx wrangler deploy
   ```
   Je krijgt daarna een URL zoals `https://greyson-contact-mailer.<subdomain>.workers.dev` (of koppel een eigen domein/route).

3. **Frontend koppelen:**
   Zet `VITE_CONTACT_ENDPOINT` als build environment variable op DigitalOcean App Platform (of in `.env.local` tijdens dev) naar die Worker-URL, of vul hem in [automateConfig.ts](../../src/config/automateConfig.ts) in.

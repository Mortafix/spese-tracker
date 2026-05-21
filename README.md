# Spese Tracker

Web app privata per tracciare spese ricorrenti, entrate mensili e mutui/finanziamenti di coppia.

## Stack

- Next.js App Router + TypeScript
- MongoDB con driver ufficiale
- Tailwind CSS + componenti stile shadcn/ui
- Recharts per grafici
- Session cookie HTTP-only firmato con `jose`

## Setup locale

```bash
npm install
cp .env.example .env.local
npm run hash-password -- "scegli-una-password"
```

Compila `.env.local`:

```bash
MONGODB_URI=mongodb://...
MONGODB_DB=spese_tracker
APP_USERNAME=admin
APP_PASSWORD_HASH=<riga-escapata-stampata-dallo-script>
SESSION_SECRET=<stringa-lunga-random>
```

Avvia:

```bash
npm run dev
```

Apri `http://localhost:3000`. Senza `MONGODB_URI`, l'app mostra dati demo in sola lettura; in locale senza `APP_PASSWORD_HASH` puoi entrare con `admin / password`.

Quando modifichi `.env.local`, riavvia il processo Next. In produzione rifai anche la build prima di ripartire:

```bash
npm run build
PORT=3000 npm run start
```

## Deploy self-hosted

Usa una versione Node.js LTS compatibile con Next.js 16, poi installa da lockfile:

```bash
npm ci
```

In produzione queste variabili sono obbligatorie e l'app fallisce con errore esplicito se mancano:

```bash
MONGODB_URI=mongodb://...
MONGODB_DB=spese_tracker
APP_USERNAME=admin
APP_PASSWORD_HASH=<hash bcrypt generato con npm run hash-password>
SESSION_SECRET=<stringa-lunga-random>
```

Avvia dietro un reverse proxy HTTPS, ad esempio Nginx, Caddy o Traefik. Il proxy deve inoltrare almeno `Host`, `X-Forwarded-For` e `X-Forwarded-Proto`; applica HSTS, limite dimensione body e rate limit su `POST /login`. L'app include anche un limite in memoria sui tentativi di login per IP e username, pensato per un singolo processo Node.

Checklist rapida:

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
PORT=3000 npm run start
```

Configura backup periodici di MongoDB prima del primo deploy e prima di aggiornamenti applicativi.

## Funzionalita

- Login unico condiviso.
- Dashboard dark con budget mensile, spese ricorrenti, residuo stimato, conto comune e grafici.
- Viste `Io`, `Lei`, `Comune` con ratio configurabile per voci condivise.
- CRUD per entrate, spese ricorrenti, categorie e mutui/finanziamenti.
- Cadenze spese: settimanale, mensile, bimestrale, trimestrale, quadrimestrale, semestrale, annuale.
- Le nuove spese usano `firstDueDate` per calcolare prossima scadenza e residuo mese.
- Progress automatico delle rate pagate sui finanziamenti.

## Comandi

```bash
npm run lint
npm test
npm run build
```

## Deploy Vercel

Configura le stesse variabili ambiente in Vercel e assicurati che il server MongoDB accetti connessioni dalla piattaforma di deploy.

# Discord YT Bot

Discord bot na prehrávanie hudby z YouTube (cez DisTube + yt-dlp) a náhodné prehrávanie zvukových efektov, keď sú ľudia vo voice kanáli.

## Funkcie

- `/play` — prehratie YouTube linku, playlistu/mixu, alebo vyhľadanie textom
- Automatické pripojenie do voice kanála, keď doň vojde človek, a odpojenie, keď kanál ostane prázdny
- Náhodné prehrávanie zvukových efektov zo súborov v priečinku `sounds/` v pravidelných intervaloch, kým je bot v kanáli
- Náhodné zvuky sa automaticky pozastavia počas prehrávania hudby a bot sa ich vzdá, kým hudba dohrá

## Požiadavky

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) dostupný v `PATH`
- ffmpeg (buď systémovo nainštalovaný, alebo cez `ffmpeg-static`)

## Inštalácia

```bash
npm install
```

Skopíruj `.env.example` na `.env` a doplň skutočný token bota:

```bash
cp .env.example .env
```

V `.env` nastav:

```
DISCORD_TOKEN=tvoj_skutocny_token
```

Token získaš v [Discord Developer Portal](https://discord.com/developers/applications) → tvoja aplikácia → Bot → Reset Token.

### Discord intents

V Developer Portal → tvoja aplikácia → Bot → Privileged Gateway Intents zapni:

- **Server Members Intent**

Bez toho bot pri štarte zlyhá kvôli `GatewayIntentBits.GuildMembers` v kóde.

### Zvukové efekty

Priečinok `sounds/` musí obsahovať aspoň jeden `.mp3` alebo `.wav` súbor — z nich sa náhodne vyberá pri prehrávaní.

### Slash príkazy

Ak máš skript `deploy-commands.js`, príkazy treba zaregistrovať u Discordu (raz, alebo po každej zmene príkazov):

```bash
node deploy-commands.js
```

## Spustenie

```bash
node index.js
```

Po úspešnom prihlásení uvidíš v konzole `Prihlaseny ako <meno bota>`.

## Štruktúra projektu

```
.
├── index.js          # hlavný súbor, klient, DisTube, eventy
├── soundBot.js        # logika náhodného prehrávania zvukov
├── commands/          # slash príkazy (napr. play.js)
├── sounds/             # zvukové súbory na náhodné prehrávanie
├── .env                # token bota (negituje sa)
└── .env.example        # šablóna pre .env
```

## Bezpečnosť

`.env` je v `.gitignore` a nikdy by nemal skončiť v git histórii — ani v private repozitári. Ak sa token niekedy dostane von, zregeneruj ho v Developer Portal.
# API Pokémon - Express + TypeScript

## Prérequis

- Node.js 18+
- PostgreSQL
- Fichier `.env` :
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mabase
DB_USER=postgres
DB_PASSWORD=2916
```

## Installation

```bash
npm install
psql -U postgres -d mabase -f schema.sql
npm run dev
```

**Interface web** : http://localhost:3000

## Structure

```
├── index.ts          # Backend
├── index.html        # Frontend
├── schema.sql        # BDD
└── package.json
```

## API Routes

```
GET/POST  /api/attacks
GET/POST  /api/pokemons
GET/POST  /api/trainers
POST      /api/battles/random
POST      /api/pokemons/:id/heal
POST      /api/trainers/:id/add-pokemon
```

## Concepts POO

- `Attack` : nom, dégâts, limite d'utilisation
- `Pokemon` : nom, PV, attaques (max 4)
- `Trainer` : nom, niveau, expérience, pokémons

---



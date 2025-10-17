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
# Si déjà installé, appliquer le correctif :
psql -U postgres -d mabase -f fix-schema.sql
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
POST      /api/battles/random           # Combat aléatoire (avec taverne)
POST      /api/battles/deterministic    # Combat déterministe (Pokémon avec le plus de PV)
POST      /api/battles/arena1           # 100 combats aléatoires (vainqueur par niveau/XP)
POST      /api/battles/arena2           # 100 combats déterministes consécutifs
POST      /api/pokemons/:id/heal
POST      /api/trainers/:id/add-pokemon
POST      /api/trainers/:id/heal
POST      /api/trainers/:id/gain-experience
```

## Concepts POO

- `Attack` : nom, dégâts, limite d'utilisation, méthode display()
- `Pokemon` : nom, PV, attaques (max 4, sans doublon), heal(), attackRandom()
- `Trainer` : nom, niveau, expérience, pokémons, healAll(), gainExperience()

## Types de combats

1. **Défi aléatoire** : Taverne + Pokémon aléatoire
2. **Arène 1** : 100 combats aléatoires, vainqueur selon niveau/XP
3. **Défi déterministe** : Pokémon avec le plus de PV, sans taverne
4. **Arène 2** : 100 combats déterministes, arrêt si tous les Pokémon perdent

---



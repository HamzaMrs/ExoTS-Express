# API Pokémon minimaliste (Express + TypeScript + PostgreSQL)

> Une mini API REST, accompagnée d'une page HTML, pour illustrer la POO autour des attaques, Pokémon, dresseurs et combats.

## 1. Pré-requis

- Node.js 18+
- PostgreSQL installé en local
- Un fichier `.env` basé sur `.env.example` :

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mabase
DB_USER=postgres
DB_PASSWORD=2916
```

## 2. Installation & lancement

```bash
npm install
psql -U <user> -d <db> -f schema.sql   # crée les tables + un exemple (Sacha/Pikachu)

```

- Interface web : http://localhost:3000
- Health check : http://localhost:3000/health

## 3. Endpoints utiles

```
# Attaques
GET    /api/attacks
POST   /api/attacks
GET    /api/attacks/:id
DELETE /api/attacks/:id

# Pokémon
GET    /api/pokemons
GET    /api/pokemons/:id
POST   /api/pokemons
POST   /api/pokemons/:id/learn-attack
POST   /api/pokemons/:id/heal
DELETE /api/pokemons/:id

# Dresseurs
GET    /api/trainers
GET    /api/trainers/:id
POST   /api/trainers
POST   /api/trainers/:id/add-pokemon
POST   /api/trainers/:id/heal
POST   /api/trainers/:id/gain-experience
DELETE /api/trainers/:id

# Combats
POST   /api/battles/random
POST   /api/battles/deterministic
POST   /api/battles/arena1
POST   /api/battles/arena2
```

## 4. Structure

```

└── index.ts          # Logique complète (POO + routes + combats)
public/
└── index.html        # Interface web minimaliste
schema.sql            # Schéma + données d'exemple
```

- `Attack`, `Pokemon`, `Trainer` : classes POO directement dans `index.ts`
- Connexion PostgreSQL + requêtes simples (`pg`)
- Gestion des combats en mémoire (les PV de la base ne sont pas modifiés)

## 5. Rappels métier

- Un Pokémon peut apprendre 4 attaques maximum, sans doublon.
- `heal` remet les PV au maximum et réinitialise les compteurs d'attaque.
- Les combats disponibles :
	- `random` : soins préalables + Pokémon aléatoires
	- `deterministic` : Pokémon les plus en forme, sans soin
	- `arena1` : 100 combats aléatoires, score final
	- `arena2` : combats déterministes successifs, arrêt si un dresseur n’a plus de Pokémon

Tu peux livrer ce projet tel quel : tout tient en quelques fichiers et répond à l’énoncé. Bon rendu ✨
5. **Lancer un combat**



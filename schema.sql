CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level > 0),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0)
);

CREATE TABLE IF NOT EXISTS pokemons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  life_point INTEGER NOT NULL CHECK (life_point > 0),
  max_life_point INTEGER NOT NULL CHECK (max_life_point > 0),
  trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attacks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  damage INTEGER NOT NULL CHECK (damage > 0),
  usage_limit INTEGER NOT NULL CHECK (usage_limit > 0)
);

CREATE TABLE IF NOT EXISTS pokemon_attacks (
  pokemon_id INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
  attack_id INTEGER NOT NULL REFERENCES attacks(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  PRIMARY KEY (pokemon_id, attack_id)
);

INSERT INTO trainers (name, level, experience) VALUES 
  ('Sacha', 5, 0),
  ('Ondine', 4, 5),
  ('Pierre', 6, 2)
ON CONFLICT DO NOTHING;

INSERT INTO attacks (name, damage, usage_limit) VALUES
  ('Éclair', 40, 10),
  ('Flammèche', 40, 10),
  ('Pistolet à O', 40, 10),
  ('Charge', 35, 15),
  ('Tonnerre', 90, 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pokemons (name, life_point, max_life_point, trainer_id)
SELECT 'Pikachu', 100, 100, id FROM trainers WHERE name = 'Sacha'
UNION ALL
SELECT 'Salamèche', 90, 90, id FROM trainers WHERE name = 'Sacha'
UNION ALL
SELECT 'Carapuce', 110, 110, id FROM trainers WHERE name = 'Ondine'
UNION ALL
SELECT 'Stari', 80, 80, id FROM trainers WHERE name = 'Ondine'
UNION ALL
SELECT 'Onix', 120, 120, id FROM trainers WHERE name = 'Pierre'
ON CONFLICT DO NOTHING;

INSERT INTO pokemon_attacks (pokemon_id, attack_id, usage_count)
SELECT p.id, a.id, 0
FROM pokemons p
JOIN attacks a ON (
  (p.name = 'Pikachu' AND a.name = 'Éclair') OR
  (p.name = 'Salamèche' AND a.name = 'Flammèche') OR
  (p.name = 'Carapuce' AND a.name = 'Pistolet à O') OR
  (p.name = 'Stari' AND a.name = 'Pistolet à O') OR
  (p.name = 'Onix' AND a.name = 'Charge')
)
ON CONFLICT (pokemon_id, attack_id) DO NOTHING;

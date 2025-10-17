-- Supprimer l'ancienne contrainte et en créer une nouvelle qui autorise 0 PV
ALTER TABLE pokemons DROP CONSTRAINT IF EXISTS pokemons_life_point_check;
ALTER TABLE pokemons ADD CONSTRAINT pokemons_life_point_check CHECK (life_point >= 0);

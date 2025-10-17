# Résolution du problème "Erreur combat déterministe"

## 🐛 Problème identifié

L'erreur se produisait lors des combats car la contrainte SQL sur la table `pokemons` interdisait les PV à 0 :

```sql
-- ❌ ANCIEN (problématique)
life_point INTEGER NOT NULL CHECK (life_point > 0)
```

Quand un Pokémon perdait tous ses PV (0 PV), la sauvegarde échouait avec l'erreur :
```
Error: new row for relation "pokemons" violates check constraint "pokemons_life_point_check"
```

## ✅ Solution appliquée

### 1. Modification du schéma SQL (`schema.sql`)
```sql
-- ✅ NOUVEAU (correct)
life_point INTEGER NOT NULL CHECK (life_point >= 0)
```

### 2. Script de migration créé (`fix-schema.sql`)
```sql
ALTER TABLE pokemons DROP CONSTRAINT IF EXISTS pokemons_life_point_check;
ALTER TABLE pokemons ADD CONSTRAINT pokemons_life_point_check CHECK (life_point >= 0);
```

### 3. Application de la migration
```bash
psql -U postgres -d mabase -f fix-schema.sql
```

### 4. Amélioration de la gestion d'erreur
Ajout d'une vérification explicite dans le combat déterministe :
```typescript
if (pokemon1.attacks.length === 0 || pokemon2.attacks.length === 0) {
  return res.status(400).json({ error: 'Les Pokémon doivent avoir au moins une attaque' });
}
```

## 🚀 Résultat

✅ Les combats fonctionnent maintenant correctement
✅ Les Pokémon peuvent avoir 0 PV après un combat
✅ Meilleure gestion des erreurs avec messages explicites

## 📝 Fichiers modifiés

- `schema.sql` : Contrainte CHECK modifiée
- `fix-schema.sql` : Script de migration créé
- `index.ts` : Vérification des attaques ajoutée
- `README.md` : Instructions de migration ajoutées

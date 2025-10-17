import { Request, Response } from 'express';
import { AttackRepository } from '../repositories/AttackRepository';
import { Attack } from '../models/Attack';

/**
 * Contrôleur pour gérer les attaques
 */
export class AttackController {
  /**
   * Crée une nouvelle attaque
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, damage, usageLimit } = req.body;

      if (!name || !damage || !usageLimit) {
        res.status(400).json({ error: 'Tous les champs sont requis (name, damage, usageLimit)' });
        return;
      }

      const attack = new Attack(name, damage, usageLimit);
      const createdAttack = await AttackRepository.create(attack);

      res.status(201).json({
        message: 'Attaque créée avec succès',
        attack: {
          id: createdAttack.getId(),
          name: createdAttack.getName(),
          damage: createdAttack.getDamage(),
          usageLimit: createdAttack.getUsageLimit()
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère toutes les attaques
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const attacks = await AttackRepository.findAll();
      
      res.json({
        count: attacks.length,
        attacks: attacks.map(attack => ({
          id: attack.getId(),
          name: attack.getName(),
          damage: attack.getDamage(),
          usageLimit: attack.getUsageLimit()
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Récupère une attaque par ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const attack = await AttackRepository.findById(id);

      if (!attack) {
        res.status(404).json({ error: 'Attaque non trouvée' });
        return;
      }

      res.json({
        id: attack.getId(),
        name: attack.getName(),
        damage: attack.getDamage(),
        usageLimit: attack.getUsageLimit(),
        info: attack.getInfo()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Met à jour une attaque
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { name, damage, usageLimit } = req.body;

      if (!name || !damage || !usageLimit) {
        res.status(400).json({ error: 'Tous les champs sont requis (name, damage, usageLimit)' });
        return;
      }

      const attack = new Attack(name, damage, usageLimit);
      const updatedAttack = await AttackRepository.update(id, attack);

      if (!updatedAttack) {
        res.status(404).json({ error: 'Attaque non trouvée' });
        return;
      }

      res.json({
        message: 'Attaque mise à jour avec succès',
        attack: {
          id: updatedAttack.getId(),
          name: updatedAttack.getName(),
          damage: updatedAttack.getDamage(),
          usageLimit: updatedAttack.getUsageLimit()
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Supprime une attaque
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await AttackRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Attaque non trouvée' });
        return;
      }

      res.json({ message: 'Attaque supprimée avec succès' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

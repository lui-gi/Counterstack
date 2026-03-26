import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

export async function createOrg(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO organizations (owner_id, name) VALUES ($1, $2) RETURNING *',
      [req.user!.userId, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createOrg error:', err);
    res.status(500).json({ error: 'Failed to create organization' });
  }
}

export async function listOrgs(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM organizations WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user!.userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('listOrgs error:', err);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
}

export async function getOrg(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    const org = result.rows[0] as { owner_id: string };
    if (org.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json(org);
  } catch (err) {
    console.error('getOrg error:', err);
    res.status(500).json({ error: 'Failed to get organization' });
  }
}

export async function deleteOrg(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    const org = result.rows[0] as { owner_id: string };
    if (org.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await pool.query('DELETE FROM organizations WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Organization deleted' });
  } catch (err) {
    console.error('deleteOrg error:', err);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
}

import { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import * as gemini from '../services/gemini.js';

async function verifyOwnership(orgId: string, userId: string): Promise<boolean> {
  const result = await pool.query('SELECT owner_id FROM organizations WHERE id = $1', [orgId]);
  if (result.rows.length === 0) return false;
  const row = result.rows[0] as { owner_id: string };
  return row.owner_id === userId;
}

export async function uploadProfile(req: Request, res: Response): Promise<void> {
  const orgId = req.params.orgId as string;
  try {
    const owned = await verifyOwnership(orgId, req.user!.userId);
    if (!owned) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(req.file.buffer.toString());
    } catch {
      res.status(400).json({ error: 'Invalid JSON file' });
      return;
    }
    const ranks = await gemini.analyzeOrgProfile(json);
    const result = await pool.query(
      'INSERT INTO org_profiles (org_id, source, raw_profile, ranks, summary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, 'upload', JSON.stringify(json), JSON.stringify(ranks), ranks.summary || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('uploadProfile error:', err);
    res.status(500).json({ error: 'Failed to process profile' });
  }
}

export async function onboardingProfile(req: Request, res: Response): Promise<void> {
  const orgId = req.params.orgId as string;
  const { answers, ranks } = req.body as { answers: unknown; ranks: Record<string, number> };
  if (!answers || !ranks) {
    res.status(400).json({ error: 'answers and ranks are required' });
    return;
  }
  try {
    const owned = await verifyOwnership(orgId, req.user!.userId);
    if (!owned) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await pool.query(
      'INSERT INTO org_profiles (org_id, source, raw_profile, ranks) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, 'onboarding', JSON.stringify(answers), JSON.stringify(ranks)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('onboardingProfile error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
}

export async function listProfiles(req: Request, res: Response): Promise<void> {
  const orgId = req.params.orgId as string;
  try {
    const owned = await verifyOwnership(orgId, req.user!.userId);
    if (!owned) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await pool.query(
      'SELECT * FROM org_profiles WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('listProfiles error:', err);
    res.status(500).json({ error: 'Failed to list profiles' });
  }
}

export async function latestProfile(req: Request, res: Response): Promise<void> {
  const orgId = req.params.orgId as string;
  try {
    const owned = await verifyOwnership(orgId, req.user!.userId);
    if (!owned) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await pool.query(
      'SELECT * FROM org_profiles WHERE org_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orgId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No profiles found' });
      return;
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('latestProfile error:', err);
    res.status(500).json({ error: 'Failed to get latest profile' });
  }
}

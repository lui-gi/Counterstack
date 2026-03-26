import { Request, Response } from 'express';
import * as gemini from '../services/gemini.js';

export async function analyzePosture(req: Request, res: Response): Promise<void> {
  const { profile } = req.body as { profile: unknown };
  if (!profile) {
    res.status(400).json({ error: 'profile is required' });
    return;
  }
  try {
    const ranks = await gemini.analyzeOrgProfile(profile);
    res.status(200).json(ranks);
  } catch (err) {
    console.error('analyzePosture error:', err);
    res.status(500).json({ error: 'Failed to analyze profile' });
  }
}

export async function analyzeCveThreatLevel(req: Request, res: Response): Promise<void> {
  const { cve, orgProfile } = req.body as { cve: Record<string, unknown>; orgProfile: unknown };
  if (!cve || !orgProfile) {
    res.status(400).json({ error: 'cve and orgProfile are required' });
    return;
  }
  const required = ['cveId', 'name', 'description', 'cvssScore', 'affectedVendor', 'affectedProduct'];
  for (const field of required) {
    if (cve[field] === undefined || cve[field] === null) {
      res.status(400).json({ error: `cve.${field} is required` });
      return;
    }
  }
  try {
    const result = await gemini.analyzeCveThreat(cve, orgProfile);
    res.status(200).json(result);
  } catch (err) {
    console.error('analyzeCveThreatLevel error:', err);
    res.status(500).json({ error: 'Failed to analyze CVE threat' });
  }
}

export async function analyzeSuitDomain(req: Request, res: Response): Promise<void> {
  const { suit, orgProfile } = req.body as { suit: Record<string, unknown>; orgProfile: unknown };
  if (!suit || !orgProfile) {
    res.status(400).json({ error: 'suit and orgProfile are required' });
    return;
  }
  if (!suit.suitKey || !suit.suitName || suit.currentRank === undefined) {
    res.status(400).json({ error: 'suit.suitKey, suit.suitName, suit.currentRank are required' });
    return;
  }
  try {
    const result = await gemini.analyzeSuit(suit, orgProfile);
    res.status(200).json(result);
  } catch (err) {
    console.error('analyzeSuitDomain error:', err);
    res.status(500).json({ error: 'Failed to analyze suit domain' });
  }
}

export async function analyzeMagicianReadingHandler(req: Request, res: Response): Promise<void> {
  const { orgProfile, ranks } = req.body as { orgProfile: unknown; ranks: Record<string, number> };
  if (!orgProfile || !ranks) {
    res.status(400).json({ error: 'orgProfile and ranks are required' });
    return;
  }
  if (!ranks.clover || !ranks.spade || !ranks.diamond || !ranks.heart) {
    res.status(400).json({ error: 'ranks must have clover, spade, diamond, heart' });
    return;
  }
  try {
    const result = await gemini.analyzeMagicianReading({ orgProfile, ranks });
    res.status(200).json(result);
  } catch (err) {
    console.error('analyzeMagicianReadingHandler error:', err);
    res.status(500).json({ error: 'Failed to generate magician reading' });
  }
}

export async function analyzeFiveYearPlanHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const required = ['ranks', 'targetRanks', 'currentHand', 'targetHand', 'currentScore', 'targetScore'];
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      res.status(400).json({ error: `${field} is required` });
      return;
    }
  }
  try {
    const result = await gemini.analyzeFiveYearPlan(body);
    res.status(200).json(result);
  } catch (err) {
    console.error('analyzeFiveYearPlanHandler error:', err);
    res.status(500).json({ error: 'Failed to generate five year plan' });
  }
}

export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({ status: 'ok' });
}

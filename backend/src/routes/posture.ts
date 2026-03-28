import { Router } from 'express';
import {
  analyzePosture,
  analyzeCveThreatLevel,
  analyzeSuitDomain,
  analyzeMagicianReadingHandler,
  analyzeFiveYearPlanHandler,
  askMagicianHandler,
  healthCheck,
} from '../controllers/posture.controller.js';

const router = Router();
router.post('/analyze', analyzePosture);
router.post('/cve-threat', analyzeCveThreatLevel);
router.post('/suit-analysis', analyzeSuitDomain);
router.post('/magician-reading', analyzeMagicianReadingHandler);
router.post('/five-year-plan', analyzeFiveYearPlanHandler);
router.post('/ask-magician', askMagicianHandler);
router.get('/health', healthCheck);
export default router;

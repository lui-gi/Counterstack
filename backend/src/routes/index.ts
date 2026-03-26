import { Router } from 'express';
import authRouter from './auth.js';
import orgsRouter from './orgs.js';
import profilesRouter from './profiles.js';
import postureRouter from './posture.js';
import { healthCheck } from '../controllers/posture.controller.js';

const router = Router();
router.use('/auth', authRouter);
router.use('/orgs', orgsRouter);
router.use('/orgs/:orgId/profiles', profilesRouter);
router.use('/posture', postureRouter);
router.get('/health', healthCheck);
export default router;

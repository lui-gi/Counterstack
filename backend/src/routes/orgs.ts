import { Router } from 'express';
import { createOrg, listOrgs, getOrg, deleteOrg } from '../controllers/orgs.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.post('/', createOrg);
router.get('/', listOrgs);
router.get('/:id', getOrg);
router.delete('/:id', deleteOrg);
export default router;

import { Router } from 'express';
import multer from 'multer';
import { uploadProfile, onboardingProfile, listProfiles, latestProfile } from '../controllers/profiles.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });
router.use(authMiddleware);
router.post('/upload', upload.single('profile'), uploadProfile);
router.post('/onboarding', onboardingProfile);
router.get('/', listProfiles);
router.get('/latest', latestProfile);
export default router;

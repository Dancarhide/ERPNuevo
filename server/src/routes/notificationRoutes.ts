import { Router } from 'express';
import * as notificationController from '../Controllers/notificationController';

const router = Router();

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.put('/:id/read', notificationController.markAsRead);
router.post('/generate-alerts', notificationController.generateHRAlerts);

export default router;

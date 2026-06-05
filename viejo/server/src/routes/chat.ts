import { Router } from 'express';
import { getContacts, getConversation, sendMessage } from '../Controllers/chatController';

const router = Router();

router.get('/contacts', getContacts);
router.get('/conversations/:id', getConversation);
router.post('/messages', sendMessage);

export default router;

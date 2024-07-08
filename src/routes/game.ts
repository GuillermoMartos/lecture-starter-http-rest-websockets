import path from 'node:path';
import { Router } from 'express';

import { HTML_FILES_PATH } from '../config.js';
import { activeRooms } from '../socket/activeRooms.js';

const router = Router();

router.get('/', (req, res) => {
    const page = path.join(HTML_FILES_PATH, 'game.html');
    res.sendFile(page);
});

router.get('/texts/:id', (req, res) => {
    const { id: roomId } = req.params;
    const textChallenge = activeRooms.getOrAssignTextChallenge(roomId);
    res.send(textChallenge);
});

export default router;

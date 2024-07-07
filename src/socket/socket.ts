import { Server } from 'socket.io';
import game from './game.js';

export default (io: Server) => {
    game(io.of('/game'));
};

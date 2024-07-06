import { Server } from 'socket.io';
import * as config from './config.js';
import { activeUsers } from './activeUsers.js';

export default (io: Server) => {
    io.on('connection', socket => {
        const username: string = socket.handshake.query.username as string;
        if (activeUsers.hasUser(username)) {
            socket.emit('invalid_checked_user', username);
            socket.disconnect();
        } else {
            activeUsers.addUser(username);
            console.log('Connected user:', username, socket.id);
            socket.broadcast.emit('user_joined', {
                new_user: username,
                activeUsers: activeUsers.getUsers().size
            });
        }

        socket.on('disconnect', reason => {
            activeUsers.removeUser(username);
            console.log(`Disconnected user ${username}. Reason: ${reason}`);
        });
    });
};

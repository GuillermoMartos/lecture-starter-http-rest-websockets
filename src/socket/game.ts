import { Namespace } from 'socket.io';
import { activeUsers } from './activeUsers.js';
import { activeRooms } from './activeRooms.js';
import { SOCKET_EVENTS } from './constants.js';

export default (namespace: Namespace) => {
    namespace.on(SOCKET_EVENTS.CONNECTION, socket => {
        const username: string = socket.handshake.query.username as string;

        if (activeUsers.hasUser(username)) {
            socket.emit(SOCKET_EVENTS.INVALID_CHECKED_USER, username);
            socket.disconnect();
        } else {
            activeUsers.addUser(username);
            console.log('Connected user:', username, socket.id);
            socket.broadcast.emit(SOCKET_EVENTS.USER_JOINED, {
                new_user: username,
                activeUsers: activeUsers.getUsers().size
            });
        }

        socket.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());

        socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ new_room }) => {
            if (activeRooms.hasRoom(new_room)) {
                socket.emit(SOCKET_EVENTS.INVALID_CHECKED_ROOM_NAME, {
                    message: `Room name ${new_room} already in use. Choose another.`,
                    activeRooms: activeRooms.getActiveRooms()
                });
            } else {
                activeRooms.addRoom(new_room);
                activeRooms.addUserToRoom(new_room, username);
                socket.rooms.add(new_room);
                socket.join(new_room);
                socket.broadcast.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
            }
        });

        socket.on(SOCKET_EVENTS.JOIN_ROOM, roomName => {
            if (!activeRooms.hasRoom(roomName)) {
                // just in case it disconnect while joining
                socket.emit(SOCKET_EVENTS.INVALID_CHECKED_ROOM_NAME, {
                    message: `Room name ${roomName} not available. Choose another.`,
                    activeRooms: activeRooms.getActiveRooms()
                });
                return;
            }
            activeRooms.addUserToRoom(roomName, username);
            socket.join(roomName);
            socket.broadcast.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
        });

        socket.on(SOCKET_EVENTS.LEAVE_ROOM, roomName => {
            socket.leave(roomName);
            activeRooms.removeUserFromRoom(roomName, username);
            //this will also be necesary info for the self socket user
            namespace.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
        });

        socket.on(SOCKET_EVENTS.DISCONNECT, reason => {
            const userActiveRoom = activeRooms.getRoomByUser(username);
            if (userActiveRoom) {
                const isemptyRoomSpace = activeRooms.removeUserFromRoom(userActiveRoom, username);
                if (isemptyRoomSpace) {
                    socket.rooms.delete(userActiveRoom);
                }
            }
            activeUsers.removeUser(username);
            console.log(`Disconnected user ${username}. Reason: ${reason}`);
            namespace.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
        });
    });
};

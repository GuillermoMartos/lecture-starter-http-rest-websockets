import { Namespace } from 'socket.io';
import { activeUsers } from './activeUsers.js';
import { Update_User_WS_Request, activeRooms } from './activeRooms.js';
import { SOCKET_EVENTS } from './constants.js';
import * as config from './config.js';
import { castUserRoomToResponseJSON } from './helpers.js';

export default (namespace: Namespace) => {
    namespace.on(SOCKET_EVENTS.CONNECTION, socket => {
        const username: string = socket.handshake.query.username as string;

        if (activeUsers.hasUser(username)) {
            socket.emit(SOCKET_EVENTS.INVALID_CHECKED_USER, username);
            socket.disconnect();
        } else {
            activeUsers.addUser(username);
            console.log('Connected user:', username, socket.id);
            // message for rest of users
            socket.broadcast.emit(SOCKET_EVENTS.USER_JOINED, {
                new_user: username,
                activeUsers: activeUsers.getUsers().size
            });
            // message for just joined self user
            socket.emit(SOCKET_EVENTS.USER_JOINED, {
                new_user: 'you',
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

            if (activeRooms.getRoomUserCounter(roomName) <= config.MAXIMUM_USERS_FOR_ONE_ROOM) {
                socket.join(roomName);
                const usersRoomInfo = activeRooms.getRoomUsers(roomName);
                const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(roomName));
                namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
                namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);

                socket.broadcast.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
            } else {
                socket.emit(SOCKET_EVENTS.INVALID_CHECKED_ROOM_NAME, {
                    message: `Room ${roomName} is full. Choose another.`,
                    activeRooms: activeRooms.getActiveRooms()
                });
            }
        });

        socket.on(SOCKET_EVENTS.UPDATE_USER_ROOM_INFO, (requestUserData: Update_User_WS_Request) => {
            const { roomName, username, update } = requestUserData;
            activeRooms.updateUserInRoom(roomName, username, update);
            activeRooms.checkRoomWinner(roomName);
            const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(roomName));
            const usersRoomInfo = activeRooms.getRoomUsers(roomName);
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);
            socket.broadcast.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
        });

        socket.on(SOCKET_EVENTS.RESET_ROOM_INFO, roomName => {
            activeRooms.resetRoomInfo(roomName);
            const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(roomName));
            const usersRoomInfo = activeRooms.getRoomUsers(roomName);
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);
        });

        socket.on(SOCKET_EVENTS.LEAVE_ROOM, roomName => {
            socket.leave(roomName);
            const isemptyRoomSpace = activeRooms.removeUserFromRoom(roomName, username);
            const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(roomName));
            const usersRoomInfo = activeRooms.getRoomUsers(roomName);
            namespace.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
            if (isemptyRoomSpace) {
                socket.rooms.delete(isemptyRoomSpace);
                return;
            }
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
            namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);
        });

        socket.on(SOCKET_EVENTS.DISCONNECT, reason => {
            const userActiveRoom = activeRooms.getRoomByUser(username);
            if (userActiveRoom) {
                const isemptyRoomSpace = activeRooms.removeUserFromRoom(userActiveRoom, username);
                if (!isemptyRoomSpace) {
                    const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(userActiveRoom));
                    namespace.to(userActiveRoom).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);
                    const usersRoomInfo = activeRooms.getRoomUsers(userActiveRoom);
                    namespace.to(userActiveRoom).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
                }
                if (isemptyRoomSpace) {
                    socket.rooms.delete(userActiveRoom);
                    activeUsers.removeUser(username);
                    namespace.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
                    return;
                }
            }
            activeUsers.removeUser(username);
            console.log(`Disconnected user ${username}. Reason: ${reason}`);
            namespace.emit(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms.getActiveRooms());
        });
    });
};

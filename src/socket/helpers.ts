import { Room_Info, User_Room_Info, activeRooms } from './activeRooms.js';
import { SOCKET_EVENTS } from './constants.js';
import { Namespace } from 'socket.io';

interface RoomInfoResponseJSON {
    userCount: number;
    isRoomFull: boolean;
    isReady: boolean;
    users: [string, User_Room_Info][];
}

export function castUserRoomToResponseJSON(roomInfo: Room_Info): RoomInfoResponseJSON {
    const roomInfoCopy = roomInfo;
    return {
        ...roomInfoCopy,
        users: Array.from(roomInfoCopy.users.entries())
    };
}

export function updateRoomAndRoomUsersInfo(roomName: string, namespace: Namespace) {
    const roomInfo = castUserRoomToResponseJSON(activeRooms.checkRoomReadyToPlay(roomName));
    const usersRoomInfo = activeRooms.getRoomUsers(roomName);
    namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_USER_INFO, usersRoomInfo);
    namespace.to(roomName).emit(SOCKET_EVENTS.MY_ROOM_INFO, roomInfo);
}

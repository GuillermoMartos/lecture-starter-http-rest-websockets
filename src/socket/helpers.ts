import { Room_Info, User_Room_Info } from './activeRooms.js';

interface RoomInfoResponseJSON {
    userCount: number;
    isRoomFull: boolean;
    isPlaying: boolean;
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

export interface Update_User_WS_Request {
    roomName: string;
    username: string;
    update: User_Room_Info;
}

interface User_Room_Info {
    ready: boolean;
    progress: number;
}

interface Room_Info {
    users: Map<string, User_Room_Info>;
    userCount: number;
    isRoomFull: boolean;
    isPlaying: boolean;
}

class ActiveRooms {
    private static instance: ActiveRooms;
    private rooms: { [key: string]: { roomInfo: Room_Info } };

    private constructor() {
        this.rooms = {};
    }

    public static getInstance(): ActiveRooms {
        if (!ActiveRooms.instance) {
            ActiveRooms.instance = new ActiveRooms();
        }
        return ActiveRooms.instance;
    }

    public addRoom(roomName: string): void {
        if (!this.rooms[roomName]) {
            this.rooms[roomName] = {
                roomInfo: {
                    users: new Map<string, User_Room_Info>(),
                    userCount: 0,
                    isPlaying: false,
                    isRoomFull: false
                }
            };
        }
    }

    public removeRoom(roomName: string): void {
        delete this.rooms[roomName];
    }

    public addUserToRoom(roomName: string, username: string): void {
        this.addRoom(roomName); // Ensure the room exists
        if (!this.rooms[roomName].roomInfo.users.has(username)) {
            this.rooms[roomName].roomInfo.users.set(username, { ready: false, progress: 0 });
            this.rooms[roomName].roomInfo.userCount++;
        }
    }

    public removeUserFromRoom(roomName: string, username: string): void | string {
        if (this.rooms[roomName] && this.rooms[roomName].roomInfo.users.has(username)) {
            this.rooms[roomName].roomInfo.users.delete(username);
            this.rooms[roomName].roomInfo.userCount--;
            if (this.rooms[roomName].roomInfo.userCount === 0) {
                console.log('Room empty, will be deleted. Room name:', roomName);
                this.removeRoom(roomName);
                return roomName;
            }
        }
    }

    public getRoomUserCounter(roomName: string): number {
        return this.rooms[roomName].roomInfo.userCount;
    }

    public getRoomUsers(roomName: string): [string, User_Room_Info][] {
        // we cast to array, because client is JS and cant handle Set
        return Array.from(this.rooms[roomName].roomInfo.users);
    }

    public getActiveRooms(): { [key: string]: number } {
        const activeRooms: { [key: string]: number } = {};
        for (const roomName in this.rooms) {
            activeRooms[roomName] = this.rooms[roomName].roomInfo.userCount;
        }
        return activeRooms;
    }

    public hasRoom(roomName: string): boolean {
        return !!this.rooms[roomName];
    }

    public getRoomByUser(username: string): string | null {
        for (const roomName in this.rooms) {
            if (this.rooms[roomName].roomInfo.users.has(username)) {
                return roomName;
            }
        }
        return null;
    }

    public updateUserInRoom(roomName: string, username: string, update: User_Room_Info): void {
        if (this.rooms[roomName] && this.rooms[roomName].roomInfo.users.has(username)) {
            this.rooms[roomName].roomInfo.users.set(username, update);
        }
    }
}

export const activeRooms = ActiveRooms.getInstance();

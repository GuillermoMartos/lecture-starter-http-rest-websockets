import textObj from '../data.js';
import { SERVER_MESSAGGES } from './constants.js';
const TEXTS_LENGTH = textObj.texts.length;

export interface Update_User_WS_Request {
    roomName: string;
    username: string;
    update: Partial<User_Room_Info>;
}

export interface User_Room_Info {
    ready: boolean;
    progress: number;
    timeFinished: number;
}

export interface Room_Info {
    roomName: string;
    users: Map<string, User_Room_Info>;
    userCount: number;
    isRoomFull: boolean;
    isReady: boolean;
    isPlaying: boolean;
    textChallenge: null | string;
    isGameDone: boolean;
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
                    isRoomFull: false,
                    isReady: false,
                    textChallenge: null,
                    roomName,
                    isGameDone: false
                }
            };
        }
    }

    public removeRoom(roomName: string): void {
        delete this.rooms[roomName];
    }

    public addUserToRoom(roomName: string, username: string): void {
        this.addRoom(roomName);
        if (!this.rooms[roomName].roomInfo.users.has(username)) {
            this.rooms[roomName].roomInfo.users.set(username, { ready: false, progress: 0, timeFinished: 0 });
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

    public updateUserInRoom(roomName: string, username: string, update: Partial<User_Room_Info>): void {
        if (this.rooms[roomName] && this.rooms[roomName].roomInfo.users.has(username)) {
            const currentUserInfo = this.rooms[roomName].roomInfo.users.get(username);

            if (currentUserInfo) {
                const updatedUserInfo: User_Room_Info = {
                    ...currentUserInfo,
                    ...update
                };
                this.rooms[roomName].roomInfo.users.set(username, updatedUserInfo);
            }
        }
    }

    public checkRoomReadyToPlay(roomName: string): Room_Info {
        const users = this.rooms[roomName].roomInfo.users;
        const readyUsersCount = Array.from(users.values()).filter(user => user.ready).length;
        const userCount = this.rooms[roomName].roomInfo.userCount;

        if (userCount === 3) {
            this.rooms[roomName].roomInfo.isRoomFull = true;
        } else {
            this.rooms[roomName].roomInfo.isRoomFull = false;
        }

        if (readyUsersCount === 3 || (readyUsersCount === 2 && userCount === 2)) {
            this.rooms[roomName].roomInfo.isReady = true;
        } else {
            this.rooms[roomName].roomInfo.isReady = false;
        }

        return this.rooms[roomName].roomInfo;
    }

    public getOrAssignTextChallenge(roomName: string): string {
        if (!this.rooms[roomName]) {
            return `${SERVER_MESSAGGES.UNABLE_TO_FIND_ROOM} Room searched: ${roomName}`;
        }
        const isTextChallengeAssigned = this.rooms[roomName].roomInfo.textChallenge;
        if (isTextChallengeAssigned) {
            return isTextChallengeAssigned;
        } else {
            const randomText = textObj.texts[Math.floor(Math.random() * TEXTS_LENGTH)];
            this.rooms[roomName].roomInfo.textChallenge = randomText;
            return randomText;
        }
    }

    public checkRoomWinner(roomName: string): void {
        if (this.rooms[roomName]) {
            const users = this.rooms[roomName].roomInfo.users;
            const allUsersHaveFullProgress = Array.from(users.values()).every(userInfo => userInfo.progress === 100);
            if (allUsersHaveFullProgress) {
                this.rooms[roomName].roomInfo.isGameDone = true;
            }
        }
    }

    public resetRoomInfo(roomName: string): void {
        if (this.rooms[roomName]) {
            const users = this.rooms[roomName].roomInfo.users;

            users.forEach((userInfo, username) => {
                users.set(username, {
                    ready: false,
                    progress: 0,
                    timeFinished: 0
                });
            });

            const previousRoomInfo = this.rooms[roomName].roomInfo;
            this.rooms[roomName].roomInfo = {
                ...previousRoomInfo,
                isPlaying: false,
                isRoomFull: false,
                isReady: false,
                textChallenge: null,
                roomName,
                isGameDone: false
            };
        }
    }
}

export const activeRooms = ActiveRooms.getInstance();

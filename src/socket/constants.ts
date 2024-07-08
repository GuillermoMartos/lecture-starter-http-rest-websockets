export const enum SOCKET_EVENTS {
    CREATE_ROOM = 'create_room',
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',
    INVALID_CHECKED_USER = 'invalid_checked_user',
    USER_JOINED = 'user_joined',
    INVALID_CHECKED_ROOM_NAME = 'invalid_checked_room_name',
    JOIN_ROOM = 'join_room',
    LEAVE_ROOM = 'leave_room',
    ACTIVE_ROOMS_INFO = 'active_rooms_info',
    MY_ROOM_INFO = 'my_room_info',
    MY_ROOM_USER_INFO = 'my_room_user_info',
    UPDATE_USER_ROOM_INFO = 'update_user_room_info'
}

export const SERVER_MESSAGGES = {
    UNABLE_TO_FIND_ROOM: `Unable to find room selected. Please try again.`
};

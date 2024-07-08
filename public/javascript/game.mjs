import { showInputModal, showMessageModal } from './views/modal.mjs';
import { SOCKET_EVENTS } from './constants/constants.mjs';
import { appendRoomElement, hideRoomJoined, showRoomJoined } from './views/room.mjs';
import { appendUserElement, changeReadyStatus, removeUserElement, setProgress } from './views/user.mjs';

const username = sessionStorage.getItem('username');
if (!username) {
    window.location.replace('/signin');
}
document.getElementById('username-message').innerText = `${username} 🟢 online`;
let activeRoomId = null;
const setActiveRoomId = roomId => {
    activeRoomId = roomId;
};
const socket = io('http://localhost:3001/game', { query: { username } });
const createRoomButton = document.getElementById('add-room-btn');
const gameJoinedRoomName = document.getElementById('room-name');
const roomGameParentElement = document.getElementById('game-page');
const roomsElementParent = document.getElementById('rooms-page');
const quitRoomBtn = document.getElementById('quit-room-btn');
const readyRoomBtn = document.getElementById('ready-btn');
const usersLoggedWrapper = document.getElementById('users-logged-info');

function getRoomName() {
    return quitRoomBtn.parentElement.querySelector('#room-name').innerText;
}

function onJoinLogic(element) {
    const roomName = element.target.getAttribute('data-room-name');
    if (activeRoomId === roomName) {
        return;
    }
    setActiveRoomId(roomName);
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
    gameJoinedRoomName.innerText = roomName;
    showRoomJoined(roomGameParentElement, roomsElementParent);
}

function backToRoomsDisplayer() {
    const roomName = getRoomName();
    hideRoomJoined(roomGameParentElement, roomsElementParent);
    setActiveRoomId(null);
    removeUserElement(username);
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomName);
}

function createNewRoom() {
    showInputModal({
        title: 'choose name',
        onChange: changing => {
            sessionStorage.setItem('my_new_room', changing);
        },
        onSubmit: () => {
            socket.emit(SOCKET_EVENTS.CREATE_ROOM, { new_room: sessionStorage.getItem('my_new_room') });
            const roomElemetCreated = appendRoomElement({
                name: sessionStorage.getItem('my_new_room'),
                numberOfUsers: 1,
                onJoin: element => {
                    onJoinLogic(element);
                }
            });
            sessionStorage.removeItem('my_new_room');
            roomElemetCreated.querySelector('button').click();
            appendUserElement({ username: username, ready: false, isCurrentUser: true });
        }
    });
}

function refreshDOMActiveRooms(activeRooms) {
    const roomsContainer = document.querySelector('#rooms-wrapper');
    roomsContainer.innerHTML = '';
    for (const room in activeRooms) {
        appendRoomElement({
            name: room,
            numberOfUsers: activeRooms[room],
            onJoin: element => {
                onJoinLogic(element);
            }
        });
    }
}

const roomUserDataMapper = roomUsersData => {
    document.querySelector('#users-wrapper').innerHTML = '';
    roomUsersData.map(el => {
        appendUserElement({ username: el[0], ready: el[1].ready, isCurrentUser: el[0] === username });
        setProgress({ username: el[0], progress: el[1].progress });
    });
};

function setPlayerReady() {
    const isPlayerReady =
        document.querySelector(`.ready-status[data-username='${username}']`).getAttribute('data-ready') === 'false';
    const roomName = getRoomName();
    changeReadyStatus({ username: username, ready: isPlayerReady });
    socket.emit(SOCKET_EVENTS.UPDATE_USER_ROOM_INFO, {
        roomName,
        username: username,
        update: { progress: 0, ready: isPlayerReady }
    });
}

createRoomButton.addEventListener('click', createNewRoom);
quitRoomBtn.addEventListener('click', backToRoomsDisplayer);
readyRoomBtn.addEventListener('click', setPlayerReady);

socket.on(SOCKET_EVENTS.INVALID_CHECKED_USER, bad_user => {
    showMessageModal({
        message: `${bad_user} username in use, try another`,
        onClose: () => {
            sessionStorage.removeItem('username', bad_user);
            window.location.replace('/signin');
        }
    });
});

socket.on(SOCKET_EVENTS.USER_JOINED, data => {
    const { new_user, activeUsers } = data;
    showMessageModal({
        message: `${new_user} has joined. ${activeUsers} users online now.`,
        placeModalInOtherElement: usersLoggedWrapper
    });
    console.log(`${new_user} has joined. ${activeUsers} users online now.`);
});

socket.on(SOCKET_EVENTS.INVALID_CHECKED_ROOM_NAME, ({ message, activeRooms }) => {
    showMessageModal({ message });
    backToRoomsDisplayer();
    refreshDOMActiveRooms(activeRooms);
});

socket.on(SOCKET_EVENTS.ACTIVE_ROOMS_INFO, activeRooms => {
    refreshDOMActiveRooms(activeRooms);
});

socket.on(SOCKET_EVENTS.MY_ROOM_INFO, roomUsersData => {
    roomUserDataMapper(roomUsersData);
});

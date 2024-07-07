import { showInputModal, showMessageModal } from './views/modal.mjs';
import { SOCKET_EVENTS } from './constants/constants.mjs';
import { appendRoomElement, hideRoomJoined, showRoomJoined } from './views/room.mjs';

const username = sessionStorage.getItem('username');
if (!username) {
    window.location.replace('/signin');
}
let activeRoomId = null;
const setActiveRoomId = roomId => {
    activeRoomId = roomId;
};
const socket = io('http://localhost:3001/game', { query: { username } });
const createRoomButton = document.getElementById('add-room-btn');
const gameJoinedRoomName = document.getElementById('room-name');
const allNotDisplayedRoomElements = document.querySelectorAll('.display-none');
const roomsElementParent = document.getElementById('rooms-page');
const quitRoomBtn = document.getElementById('quit-room-btn');

function onJoinLogic(element) {
    const roomName = element.target.getAttribute('data-room-name');
    if (activeRoomId === roomName) {
        return;
    }
    setActiveRoomId(roomName);
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
    gameJoinedRoomName.innerText = roomName;
    showRoomJoined(allNotDisplayedRoomElements, roomsElementParent);
}

function backToRoomsDisplayer() {
    const roomName = quitRoomBtn.parentElement.querySelector('#room-name').innerText;
    hideRoomJoined(allNotDisplayedRoomElements, roomsElementParent);
    setActiveRoomId(null);
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

createRoomButton.addEventListener('click', createNewRoom);
quitRoomBtn.addEventListener('click', backToRoomsDisplayer);

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
    //use this in temporal msg?
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

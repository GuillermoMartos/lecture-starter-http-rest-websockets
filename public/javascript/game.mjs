import { showInputModal, showMessageModal } from './views/modal.mjs';
import { SOCKET_EVENTS, SECONDS_TIMER_BEFORE_START_GAME, SECONDS_FOR_GAME } from './constants/constants.mjs';
import { appendRoomElement, hideRoomJoined, showRoomJoined } from './views/room.mjs';
import { appendUserElement, changeReadyStatus, removeUserElement, setProgress } from './views/user.mjs';
import { addClass, removeClass } from './helpers/dom-helper.mjs';
import { fetchRandomText } from './services/textService.js';

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
const roomChallengeTimer = document.getElementById('timer');
const roomGetReadyTimer = document.getElementById('game-timer');
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

async function roomLogicHandler(roomData) {
    if (roomData.isReady) {
        const textContainer = document.getElementById('text-container');
        const fetchTextResponse = await fetchRandomText(roomData.roomName);
        textContainer.innerText = fetchTextResponse;
        const getReadyTimerSeconds = document.getElementById('game-timer-seconds');
        addClass(readyRoomBtn, 'display-none');
        addClass(quitRoomBtn, 'display-none');
        removeClass(roomGetReadyTimer, 'display-none');
        let decreaserGetReadyTimer = SECONDS_TIMER_BEFORE_START_GAME;
        const getReadyInterval = setInterval(() => {
            if (decreaserGetReadyTimer > 0) {
                getReadyTimerSeconds.innerText = decreaserGetReadyTimer;
                decreaserGetReadyTimer--;
            } else {
                addClass(roomGetReadyTimer, 'display-none');
                removeClass(textContainer, 'display-none');
                removeClass(roomChallengeTimer, 'display-none');
                clearInterval(getReadyInterval);
                let decreaserChallengeTime = SECONDS_FOR_GAME;
                const challengeInterval = setInterval(() => {
                    if (decreaserChallengeTime > 0) {
                        roomChallengeTimer.innerText = `Seconds left: ${decreaserChallengeTime}`;
                        decreaserChallengeTime--;
                    } else {
                        clearInterval(challengeInterval);
                    }
                }, 1000);
            }
        }, 1000);
    }
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

socket.on(SOCKET_EVENTS.MY_ROOM_USER_INFO, roomUsersData => {
    roomUserDataMapper(roomUsersData);
});

socket.on(SOCKET_EVENTS.MY_ROOM_INFO, roomData => {
    roomLogicHandler(roomData);
});

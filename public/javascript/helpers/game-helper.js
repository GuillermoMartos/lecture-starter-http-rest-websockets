import { SECONDS_FOR_GAME, SECONDS_TIMER_BEFORE_START_GAME, SOCKET_EVENTS } from '../constants/constants.mjs';
import { socket, updateUserProgress } from '../game.mjs';
import { fetchRandomText } from '../services/textService.js';
import { showMessageModal, showResultsModal } from '../views/modal.mjs';
import { addClass, createElement, removeClass } from './dom-helper.mjs';

const roomChallengeTimer = document.getElementById('timer');
const roomGetReadyTimer = document.getElementById('game-timer');
const quitRoomBtn = document.getElementById('quit-room-btn');
const readyRoomBtn = document.getElementById('ready-btn');
const textContainer = document.getElementById('text-container');
const DISPLAY_NONE_CLASS = 'display-none';

function implantHiddenLetterElements(textContainer, textChallenge) {
    for (let index = 0; index < textChallenge.length; index++) {
        const hiddenLetterElement = createElement({
            tagName: 'p',
            className: 'letter-challenge',
            attributes: { 'letter-position': index }
        });
        hiddenLetterElement.innerText = textChallenge[index];
        textContainer.appendChild(hiddenLetterElement);
    }
}

function startChallenge(textChallenge, roomName) {
    implantHiddenLetterElements(textContainer, textChallenge);
    let decreaserChallengeTime = SECONDS_FOR_GAME;
    let currentCharIndex = 0;
    const challengeInterval = setInterval(() => {
        if (decreaserChallengeTime > 0) {
            roomChallengeTimer.innerText = `Seconds left: ${decreaserChallengeTime}`;
            decreaserChallengeTime--;
        } else {
            addClass(textContainer, DISPLAY_NONE_CLASS);
            clearInterval(challengeInterval);
            document.removeEventListener('keydown', keyStrokesListener);
            showMessageModal({
                message: 'Time is out. I guess you all lose 💁‍♀️',
                onClose: () => {
                    window.location.replace('/signin');
                }
            });
        }
    }, 1000);

    function keyStrokesListener(event) {
        const keyPressed = event.key;
        const expectedChar = textChallenge[currentCharIndex];
        const currentLetterElement = document.querySelector(`[letter-position="${currentCharIndex}"]`);
        const nextLetterElement = document.querySelector(`[letter-position="${currentCharIndex + 1}"]`);
        addClass(currentLetterElement, 'underline-letter');

        if (keyPressed === expectedChar) {
            const progress = ((currentCharIndex / textChallenge.length) * 100).toFixed(0);
            updateUserProgress(progress, roomName, decreaserChallengeTime);
            removeClass(currentLetterElement, 'underline-letter');
            addClass(currentLetterElement, 'finished');
            if (currentCharIndex + 1 === textChallenge.length) {
                document.removeEventListener('keydown', keyStrokesListener);
                const finalProgress = 100;
                clearInterval(challengeInterval);
                updateUserProgress(finalProgress, roomName, decreaserChallengeTime);
            }
            addClass(nextLetterElement, 'underline-letter');
            currentCharIndex++;
        }
    }
    document.addEventListener('keydown', keyStrokesListener);
}

async function showGetingReadyInfo(roomName) {
    const fetchTextResponse = await fetchRandomText(roomName);
    textContainer.innerText = '';
    const getReadyTimerSeconds = document.getElementById('game-timer-seconds');
    addClass(readyRoomBtn, DISPLAY_NONE_CLASS);
    addClass(quitRoomBtn, DISPLAY_NONE_CLASS);
    removeClass(roomGetReadyTimer, DISPLAY_NONE_CLASS);
    let decreaserGetReadyTimer = SECONDS_TIMER_BEFORE_START_GAME;
    const getReadyInterval = setInterval(() => {
        if (decreaserGetReadyTimer > 0) {
            getReadyTimerSeconds.innerText = decreaserGetReadyTimer;
            decreaserGetReadyTimer--;
        } else {
            addClass(roomGetReadyTimer, DISPLAY_NONE_CLASS);
            removeClass(textContainer, DISPLAY_NONE_CLASS);
            removeClass(roomChallengeTimer, DISPLAY_NONE_CLASS);
            clearInterval(getReadyInterval);
            startChallenge(fetchTextResponse, roomName);
        }
    }, 1000);
}

function sortPlayerResultsByTimeFinished(roomData) {
    const sortedUsersByTimeFinished = roomData.users.sort((a, b) => b[1].timeFinished - a[1].timeFinished);
    const getOnlySortedUsernames = sortedUsersByTimeFinished.map(user => user[0]);
    return getOnlySortedUsernames;
}

export async function handleGameStart(roomData) {
    showGetingReadyInfo(roomData.roomName);
}

export function handleGameFinish(roomData) {
    addClass(roomChallengeTimer, DISPLAY_NONE_CLASS);
    addClass(textContainer, DISPLAY_NONE_CLASS);
    textContainer.innerHTML = '';
    const sortedUsersPosition = sortPlayerResultsByTimeFinished(roomData);
    showResultsModal({
        usersSortedArray: sortedUsersPosition
    });
    removeClass(quitRoomBtn, DISPLAY_NONE_CLASS);
    readyRoomBtn.innerText = 'READY';
    removeClass(readyRoomBtn, DISPLAY_NONE_CLASS);
}

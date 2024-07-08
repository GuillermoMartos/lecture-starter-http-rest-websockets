import { SECONDS_FOR_GAME, SECONDS_TIMER_BEFORE_START_GAME, SOCKET_EVENTS } from '../constants/constants.mjs';
import { socket, updateUserProgress } from '../game.mjs';
import { fetchRandomText } from '../services/textService.js';
import { addClass, createElement, removeClass } from './dom-helper.mjs';

const roomChallengeTimer = document.getElementById('timer');
const roomGetReadyTimer = document.getElementById('game-timer');
const quitRoomBtn = document.getElementById('quit-room-btn');
const readyRoomBtn = document.getElementById('ready-btn');

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

function startChallenge(textContainer, textChallenge, roomName) {
    implantHiddenLetterElements(textContainer, textChallenge);
    let decreaserChallengeTime = SECONDS_FOR_GAME;
    let currentCharIndex = 0;
    const challengeInterval = setInterval(() => {
        if (decreaserChallengeTime > 0) {
            roomChallengeTimer.innerText = `Seconds left: ${decreaserChallengeTime}`;
            decreaserChallengeTime--;
        } else {
            addClass(textContainer, 'display-none');
            clearInterval(challengeInterval);
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
            updateUserProgress(progress, roomName);
            removeClass(currentLetterElement, 'underline-letter');
            addClass(currentLetterElement, 'finished');
            if (currentCharIndex + 1 === textChallenge.length) {
                document.removeEventListener('keydown', keyStrokesListener);
                const finalProgress = 100;
                updateUserProgress(finalProgress, roomName);
            }
            addClass(nextLetterElement, 'underline-letter');
            currentCharIndex++;
        }
    }
    document.addEventListener('keydown', keyStrokesListener);
}

async function showGetingReadyInfo(roomName) {
    const textContainer = document.getElementById('text-container');
    const fetchTextResponse = await fetchRandomText(roomName);
    textContainer.innerText = '';
    const getReadyTimerSeconds = document.getElementById('game-timer-seconds');
    addClass(readyRoomBtn, 'display-none');
    addClass(quitRoomBtn, 'display-none');
    removeClass(roomGetReadyTimer, 'display-none');
    let decreaserGetReadyTimer = SECONDS_TIMER_BEFORE_START_GAME;
    decreaserGetReadyTimer = 1; //borrame luegooooooo!!!
    const getReadyInterval = setInterval(() => {
        if (decreaserGetReadyTimer > 0) {
            getReadyTimerSeconds.innerText = decreaserGetReadyTimer;
            decreaserGetReadyTimer--;
        } else {
            addClass(roomGetReadyTimer, 'display-none');
            removeClass(textContainer, 'display-none');
            removeClass(roomChallengeTimer, 'display-none');
            clearInterval(getReadyInterval);
            startChallenge(textContainer, fetchTextResponse, roomName);
        }
    }, 1000);
}

export async function handleGameStart(roomData) {
    showGetingReadyInfo(roomData.roomName);
}

import { useDeploySolution } from '../constants/constants.mjs';

export const fetchRandomText = async roomID => {
    const url = useDeploySolution
        ? `https://lecture-starter-http-rest-websockets-6z7d.onrender.com/game/texts/${roomID}`
        : `http://localhost:3001/game/texts/${roomID}`;

    const response = await fetch(url, {
        headers: { 'Accept': 'text/plain' }
    });
    const data = await response.text();
    return data;
};

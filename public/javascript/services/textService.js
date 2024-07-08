export const fetchRandomText = async roomID => {
    const response = await fetch(`http://localhost:3001/game/texts/${roomID}`, {
        headers: { 'Accept': 'text/plain' }
    });
    const data = await response.text();
    return data;
};

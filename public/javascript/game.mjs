import { showMessageModal } from './views/modal.mjs';

const username = sessionStorage.getItem('username');

if (!username) {
    window.location.replace('/signin');
}

const socket = io('http://localhost:3001', { query: { username } });

socket.on('invalid_checked_user', bad_user => {
    showMessageModal({
        message: `${bad_user} username in use, try another`,
        onClose: () => {
            sessionStorage.removeItem('username', bad_user);
            window.location.replace('/signin');
        }
    });
});

socket.on('user_joined', data => {
    const { new_user, activeUsers } = data;
    console.log(`${new_user} has joined. ${activeUsers} users online now.`);
});

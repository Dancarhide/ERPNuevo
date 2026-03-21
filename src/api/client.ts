import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const client = axios.create({
    baseURL: `http://${host}:4000/api`,
});

client.interceptors.request.use((config) => {
    const user = localStorage.getItem('user');
    if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser.token) {
            config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
    }
    return config;
});

export default client;

import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const client = axios.create({
    baseURL: `http://${host}:4000/api`,
});

client.interceptors.request.use((config) => {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        const token = parsedUser.token || parsedUser?.user?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptor para manejar errores de autenticación globalmente (como tokens expirados)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const message = error.response.data?.message || "";
            // Si el mensaje indica que el token expiró o simplemente no está autorizado
            if (message.toLowerCase().includes("expirado") || message.toLowerCase().includes("expired") || error.response?.status === 401) {
                console.warn("Sesión expirada o no autorizada. Redirigiendo al login...");
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                
                // Solo redirigir si no estamos ya en el login para evitar bucles
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default client;

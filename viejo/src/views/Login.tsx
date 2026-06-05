import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../assets/Logo.png';
import './styles/Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Estados para el cambio forzado de contraseña
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tempUserData, setTempUserData] = useState<any>(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await client.post('/auth/login', { email, password });
            const userData = response.data;

            if (userData.requiresPasswordChange) {
                setTempUserData(userData);
                setIsChangingPassword(true);
            } else {
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/home');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/auth/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempUserData.token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (!res.ok) {
                throw new Error('Error al cambiar la contraseña');
            }

            // Si es exitoso, actualizar el flag de tempUserData (por seguridad)
            // y guardar sesión normalmente para dejarlo pasar.
            const finalUserData = { ...tempUserData, requiresPasswordChange: false };
            localStorage.setItem('user', JSON.stringify(finalUserData));
            navigate('/home');
        } catch (err: any) {
            console.error('Error changing password:', err);
            setError('Ocurrió un error al guardar la nueva contraseña.');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-wrapper">
            <div className="login-left">
                <div className="login-form-container">
                    <img src={logo} alt="Company Logo" className="login-logo" />
                    
                    {!isChangingPassword ? (
                        <>
                            <h2>Bienvenido de nuevo</h2>
                            <p className="login-subtitle">Inicie sesión en su cuenta empresarial</p>
                            
                            <form onSubmit={handleLogin} className="login-form">
                                <div className="input-group">
                                    <label htmlFor="email">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ejemplo@empresa.com"
                                        required
                                    />
                                </div>
                                
                                <div className="input-group">
                                    <label htmlFor="password">Contraseña</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="password-toggle-btn" 
                                            onClick={togglePasswordVisibility}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="error-message">{error}</div>}

                                <div className="form-actions">
                                    <a href="#" className="forgot-password">¿Olvidó su contraseña?</a>
                                </div>

                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2>Actualizar Contraseña</h2>
                            <p className="login-subtitle">Por tu seguridad, debes cambiar la contraseña predeterminada antes de continuar.</p>
                            
                            <form onSubmit={handleChangePassword} className="login-form">
                                <div className="input-group">
                                    <label htmlFor="newPassword">Nueva Contraseña</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Ingresa tu nueva contraseña"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            className="password-toggle-btn" 
                                            onClick={togglePasswordVisibility}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Vuelve a ingresar la contraseña"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && <div className="error-message">{error}</div>}

                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar y Continuar'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
            
            <div className="login-right">
                {/* Visual background applied via CSS */}
            </div>
        </div>
    );
};

export default Login;

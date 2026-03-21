import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../assets/Logo.jpeg';
import './styles/Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/home');
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Credenciales inválidas o error de conexión.');
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
                </div>
            </div>
            
            <div className="login-right">
                {/* Visual background applied via CSS */}
            </div>
        </div>
    );
};

export default Login;

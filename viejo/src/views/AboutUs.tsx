import React from 'react';
import { FaRocket, FaEye, FaHandshake, FaChartLine, FaUsers, FaShieldAlt } from 'react-icons/fa';
import { useSysConfig } from '../contexts/SysConfigContext';
import './styles/AboutUs.css';

const AboutUs: React.FC = () => {
    const { config } = useSysConfig();
    return (
        <div className="about-us-container">
            <header className="about-header">
                <div className="header-content">
                    <span className="subtitle">CORPORATE PROFILE</span>
                    <h1>Institución y Estrategia</h1>
                    <p>Liderando la transformación digital en la gestión de capital humano con soluciones integrales de alta fidelidad.</p>
                </div>
            </header>

            <div className="enterprise-layout">
                <section className="about-intro card-style">
                    <div className="intro-grid">
                        <div className="intro-text">
                            <h2>Visión Institucional</h2>
                            <p>
                                Nuestra organización se fundamenta en la convergencia de la eficiencia operativa y el bienestar humano. 
                                Desarrollamos tecnología de vanguardia para centralizar, analizar y optimizar cada punto de contacto en la estructura corporativa, 
                                garantizando una gestión transparente y escalable.
                            </p>
                        </div>
                        <div className="intro-stats">
                            <div className="stat-box">
                                <span className="stat-num">100%</span>
                                <span className="stat-label">Digital</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-num">Sec</span>
                                <span className="stat-label">Grado Militar</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mission-vision-grid">
                    <div className="mission-card card-style">
                        <div className="card-icon"><FaRocket /></div>
                        <h2>Misión Corporativa</h2>
                        <p>
                            Facilitar la excelencia administrativa a través de sistemas inteligentes que permitan a la alta dirección enfocarse en la estrategia y la innovación disruptiva.
                        </p>
                    </div>
                    <div className="vision-card card-style">
                        <div className="card-icon"><FaEye /></div>
                        <h2>Proyección Futura</h2>
                        <p>
                            Consolidarnos como el estándar industrial en ERPs de recursos humanos, redefiniendo la interacción laboral mediante analítica predictiva y automatización de procesos.
                        </p>
                    </div>
                </div>

                <section className="values-section">
                    <div className="section-header">
                        <h2>Pilares de Nuestra Cultura</h2>
                    </div>
                    <div className="values-grid">
                        <div className="value-item card-style">
                            <FaHandshake className="value-icon" />
                            <h3>Integridad</h3>
                            <p>Ética inquebrantable en el manejo de activos críticos.</p>
                        </div>
                        <div className="value-item card-style">
                            <FaChartLine className="value-icon" />
                            <h3>Rendimiento</h3>
                            <p>Búsqueda incesante de la eficiencia máxima.</p>
                        </div>
                        <div className="value-item card-style">
                            <FaUsers className="value-icon" />
                            <h3>Capital Humano</h3>
                            <p>El individuo como centro de la innovación.</p>
                        </div>
                        <div className="value-item card-style">
                            <FaShieldAlt className="value-icon" />
                            <h3>Confidencialidad</h3>
                            <p>Protocolos estrictos de seguridad de la información.</p>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="about-footer">
                <p>{config.about_footer_text}</p>
                <span className="version-tag">{config.about_footer_version}</span>
            </footer>
        </div>
    );
};


export default AboutUs;

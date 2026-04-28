import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SysConfig {
    company_name:         string;
    accent_color:         string;
    maintenance_mode:     string;
    clima_active:         string;
    about_footer_text:    string;
    about_footer_version: string;
}

interface SysConfigCtx {
    config:    SysConfig;
    loading:   boolean;
    refresh:   () => void;
    setConfig: (patch: Partial<SysConfig>) => void;
}

// ─── Valores por defecto ───────────────────────────────────────────────────────

const DEFAULTS: SysConfig = {
    company_name:         'ERP Sistema',
    accent_color:         '#A7313A',
    maintenance_mode:     'false',
    clima_active:         'true',
    about_footer_text:    'FERRO CORPORATE SYSTEM | DEPARTAMENTO DE ESTRATEGIA DIGITAL',
    about_footer_version: 'Build v2.1.0-2026',
};

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SysConfigContext = createContext<SysConfigCtx>({
    config:    DEFAULTS,
    loading:   true,
    refresh:   () => {},
    setConfig: () => {},
});

// ─── Aplicar variables CSS al :root ───────────────────────────────────────────

function applyToDOM(config: SysConfig) {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', config.accent_color);

    // Generar hover como 90% del color base (oscurecer un poco)
    // Para hex simples, convertimos brevemente:
    root.style.setProperty('--color-accent-hover', shadeHex(config.accent_color, -15));

    // Nombre en el <title> del documento
    document.title = config.company_name || 'ERP';
}

/** Aclarar/oscurecer un hex (#RRGGBB) en N unidades por canal */
function shadeHex(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const r = Math.min(255, Math.max(0, parseInt(clean.slice(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(clean.slice(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(clean.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const SysConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<SysConfig>(DEFAULTS);
    const [loading, setLoading]    = useState(true);

    const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

    const refresh = useCallback(async () => {
        try {
            const token = (() => {
                const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return parsed?.token ?? parsed?.user?.token ?? null;
            })();

            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BASE}/admin/config/system`, { headers });
            if (!res.ok) return;
            const data = await res.json();

            const merged: SysConfig = { ...DEFAULTS, ...data };
            setConfigState(merged);
            applyToDOM(merged);
        } catch {
            // Si el usuario no está autenticado aún, usa los defaults y aplica
            applyToDOM(DEFAULTS);
        } finally {
            setLoading(false);
        }
    }, [BASE]);

    const setConfig = (patch: Partial<SysConfig>) => {
        setConfigState(prev => {
            const next = { ...prev, ...patch };
            applyToDOM(next);
            return next;
        });
    };

    // Cargar al montar
    useEffect(() => { refresh(); }, [refresh]);

    return (
        <SysConfigContext.Provider value={{ config, loading, refresh, setConfig }}>
            {children}
        </SysConfigContext.Provider>
    );
};

// ─── Hook de acceso ───────────────────────────────────────────────────────────

export const useSysConfig = () => useContext(SysConfigContext);

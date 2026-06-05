// Utilidades de permisos para el frontend ERP

/**
 * Obtiene el objeto de usuario del storage (localStorage o sessionStorage).
 * El objeto de usuario puede venir en dos formatos dependiendo de cómo se guardó.
 */
function getCurrentUser(): Record<string, unknown> | null {
    try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Soportar ambos formatos: { user: {...} } y { ...directamente }
        return parsed?.user || parsed || null;
    } catch {
        return null;
    }
}

/**
 * Verifica si el usuario actual tiene un permiso específico.
 * Los permisos son slugs (ej: 'employees.view', 'payroll.create') obtenidos
 * del endpoint GET /api/admin/config/mis-permisos y guardados en el objeto user.
 *
 * @param permission - Slug del permiso a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export const hasPermission = (permission: string): boolean => {
    const user = getCurrentUser();
    if (!user) return false;

    // Si el usuario tiene rol Admin, tiene acceso total
    if (user.rol === 'Admin') return true;

    // Verificar contra el array de permisos guardado en el objeto user
    const permissions = user.permissions as string[] | undefined;
    if (!Array.isArray(permissions)) return false;

    return permissions.includes(permission);
};

/**
 * Obtiene el rol del usuario actual.
 */
export const getUserRole = (): string | null => {
    const user = getCurrentUser();
    return user ? (user.rol as string) ?? null : null;
};

/**
 * Constantes de permisos del sistema.
 * Usar estas constantes en lugar de strings hardcodeados en la UI.
 */
export const PERMISSIONS = {
    // Empleados
    EMPLOYEES_VIEW: 'employees.view',
    EMPLOYEES_CREATE: 'employees.create',
    EMPLOYEES_EDIT: 'employees.edit',
    EMPLOYEES_DELETE: 'employees.delete',

    // Nómina
    PAYROLL_VIEW: 'payroll.view',
    PAYROLL_CREATE: 'payroll.create',
    PAYROLL_STAMP: 'payroll.stamp',
    PAYROLL_HISTORY: 'payroll.history',

    // Vacaciones
    VACATIONS_VIEW: 'vacations.view',
    VACATIONS_APPROVE: 'vacations.approve',

    // Roles
    ROLES_MANAGE: 'roles.manage',

    // Configuración
    ADMIN_CONFIG: 'admin.config',

    // Reclutamiento
    RECRUITMENT_VIEW: 'recruitment.view',
    RECRUITMENT_MANAGE: 'recruitment.manage',

    // Incidencias
    INCIDENTS_VIEW: 'incidents.view',
    INCIDENTS_MANAGE: 'incidents.manage',

    // Encuestas
    SURVEYS_ADMIN: 'surveys.admin',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];


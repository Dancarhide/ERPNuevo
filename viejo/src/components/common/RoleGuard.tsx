import React, { type ReactNode } from 'react';

interface RoleGuardProps {
    allowedRoles: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback = null }) => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const currentRole = userData?.rol || 'Empleado Normal';

    if (allowedRoles.includes('ALL')) return <>{children}</>;
    
    const isAllowed = allowedRoles.includes(currentRole);

    if (isAllowed) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default RoleGuard;

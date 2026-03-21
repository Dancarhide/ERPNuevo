// Basic permissions utility
export const hasPermission = (_permission: string) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    try {
        JSON.parse(userStr);
        // Implement actual permission logic here if needed. 
        // For now, return true (or check user.rol) to match previous behavior
        // and unblock the UI.
        return true;
    } catch {
        return false;
    }
};

export const PERMISSIONS = {
    // Add permissions as needed
};

import { test, expect } from '@playwright/test';

test.describe('Autenticación y Login', () => {
  test('El usuario puede iniciar sesión correctamente y es redirigido al dashboard', async ({
    page,
  }) => {
    // 1. Ir a la página de login
    await page.goto('/login');

    // 2. Verificar que estamos en la página correcta
    await expect(page).toHaveTitle(/ERP/i);
    await expect(page.locator('h2').first()).toContainText(/Bienvenido de nuevo/i);

    // 3. Llenar el formulario con credenciales de prueba
    // Nota: El backend tiene seeders, asumimos que existe el usuario superadmin@erpnuevo.com (o admin)
    // El seeder crea: admin@empresa.com / admin123
    await page.fill('input[type="email"]', 'admin@empresa.com');
    await page.fill('input[type="password"]', 'admin123');

    // 4. Hacer clic en el botón de login
    await page.click('button[type="submit"]');

    // 5. Esperar la redirección y verificar la URL
    await page.waitForURL('/dashboard');

    // 6. Verificar que aparece un elemento del dashboard (ej. Sidebar o título)
    await expect(page.locator('h1').first()).toContainText(/Bienvenido de vuelta/i);
  });
});

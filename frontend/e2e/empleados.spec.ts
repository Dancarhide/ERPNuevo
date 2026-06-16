import { test, expect } from '@playwright/test';

test('Flujo de empleados', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@erpnuevo.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');

  await page.goto('http://localhost:3000/dashboard/empleados');
  await expect(page.locator('h1').first()).toContainText(/Empleados/i);
});

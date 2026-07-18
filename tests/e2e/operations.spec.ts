import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CrowdMind AI E2E Operations Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to app landing page
    await page.goto('/');
  });

  test('should display platform brand header and sign-in button', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toContainText('CrowdMind AI');
    
    // Check main call-to-action button to enter
    const ctaButton = page.locator('a:has-text("Enter Command Console")');
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to login page and check credentials container layout', async ({ page }) => {
    await page.click('a:has-text("Enter Command Console")');
    await expect(page).toHaveURL(/.*login/);
    
    const heading = page.locator('h2');
    await expect(heading).toContainText('Sign In');
    
    // Check form input fields are rendered
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should pass automated WCAG 2.2 AA accessibility scan audits on landing page', async ({ page }) => {
    // Audit the landing page layouts using Axe builder engine
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

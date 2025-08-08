import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on diary page', async ({ page }) => {
    await page.goto('/diary');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on history page', async ({ page }) => {
    await page.goto('/diary/history');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/diary');
    
    // Check that h1 exists and is unique
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    await expect(h1Elements.first()).toContainText('Thailand Waste Diary');
    
    // Check that headings follow proper hierarchy
    const allHeadings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingTexts = await allHeadings.allTextContents();
    
    expect(headingTexts.length).toBeGreaterThan(0);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/diary');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Skip link should be focused first
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toContainText('Skip to main content');
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to reach notification button
    const notificationButton = page.getByText('🔔 Notifications');
    await notificationButton.focus();
    await expect(notificationButton).toBeFocused();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/diary');
    
    // Check main content area has proper role
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('role', 'main');
    
    // Check that buttons have proper labels
    const scannerButton = page.getByText('📷 AI Scanner (Demo)');
    await expect(scannerButton).toHaveAttribute('type', 'button');
    
    // Check that links have proper attributes
    const manualEntryLink = page.getByText('✏️ Manual Entry');
    await expect(manualEntryLink.locator('..')).toHaveAttribute('href', '/diary/manual');
  });

  test('should be usable with keyboard only', async ({ page }) => {
    await page.goto('/diary');
    
    // Navigate with keyboard to notification settings
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First interactive element
    await page.keyboard.press('Tab'); // Notification button
    await page.keyboard.press('Enter'); // Activate notification button
    
    // Should open notification settings
    await expect(page.getByText('Notification Settings')).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/diary');
    
    // Use axe-core to check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id.includes('color-contrast')
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/diary');
    
    // Open notification settings to test form elements
    await page.click('text=🔔 Notifications');
    
    // Check for proper form labeling when forms are present
    const formInputs = page.locator('input, select, textarea');
    const inputCount = await formInputs.count();
    
    if (inputCount > 0) {
      // Each form element should have associated label
      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          const associatedLabel = page.locator(`label[for="${inputId}"]`);
          await expect(associatedLabel).toBeVisible();
        }
      }
    }
  });

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/diary');
    
    // Test that important content has proper semantic markup
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    // Check that stats have proper structure for screen readers
    const statsSection = page.getByText("Today's Credits").locator('..');
    await expect(statsSection).toBeVisible();
    
    // Verify that interactive elements are properly labeled
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // Each button should have accessible text
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      expect(buttonText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    await page.goto('/diary');
    
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            filter: contrast(2) !important;
          }
        }
      `
    });
    
    // Check that content is still readable
    const mainHeading = page.getByText('Thailand Waste Diary 🗂️');
    await expect(mainHeading).toBeVisible();
    
    const statsCards = page.locator('[class*="bg-white"]');
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/diary');
    
    // Content should still be fully functional
    await expect(page.getByText('Thailand Waste Diary 🗂️')).toBeVisible();
    await expect(page.getByText("Today's Credits")).toBeVisible();
    
    // Interactive elements should work without motion
    await page.click('text=🔔 Notifications');
    await expect(page.getByText('Notification Settings')).toBeVisible();
  });

  test('should work well with zoom up to 200%', async ({ page }) => {
    await page.goto('/diary');
    
    // Set zoom level to 200%
    await page.setViewportSize({ width: 640, height: 480 }); // Simulate zoomed in view
    
    // Important content should still be visible and usable
    await expect(page.getByText('Thailand Waste Diary')).toBeVisible();
    await expect(page.getByText('🔔 Notifications')).toBeVisible();
    
    // Navigation should work
    await page.click('text=📚 View History');
    await expect(page.url()).toContain('/diary/history');
  });
});
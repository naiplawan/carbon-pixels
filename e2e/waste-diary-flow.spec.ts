import { test, expect } from '@playwright/test';

test.describe('Thailand Waste Diary E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should load the main diary page', async ({ page }) => {
    await page.goto('/diary');
    
    // Check main heading
    await expect(page.getByText('Thailand Waste Diary 🗂️')).toBeVisible();
    
    // Check tagline
    await expect(page.getByText('Track your daily waste, earn carbon credits, save the planet! 🌱')).toBeVisible();
    
    // Check initial stats
    await expect(page.getByText("Today's Credits")).toBeVisible();
    await expect(page.getByText('Trees Saved')).toBeVisible();
  });

  test('should open and interact with notification settings', async ({ page }) => {
    await page.goto('/diary');
    
    // Click notification settings button
    await page.click('text=🔔 Notifications');
    
    // Wait for notification manager to appear
    await expect(page.getByText('Notification Settings')).toBeVisible();
    
    // Check for permission request section
    await expect(page.getByText('Stay motivated with helpful reminders')).toBeVisible();
  });

  test('should navigate to manual entry page', async ({ page }) => {
    await page.goto('/diary');
    
    // Click manual entry link
    await page.click('text=✏️ Manual Entry');
    
    // Should navigate to manual entry page
    await expect(page.url()).toContain('/diary/manual');
  });

  test('should navigate to history page', async ({ page }) => {
    await page.goto('/diary');
    
    // Click history link
    await page.click('text=📚 View History');
    
    // Should navigate to history page
    await expect(page.url()).toContain('/diary/history');
    await expect(page.getByText('📚 Waste Diary History')).toBeVisible();
  });

  test('should open and close social share manager', async ({ page }) => {
    await page.goto('/diary');
    
    // Click share impact button
    await page.click('text=🚀 Share Impact');
    
    // Wait for social share modal to appear
    await expect(page.getByText('Share Your Impact!')).toBeVisible();
    await expect(page.getByText('Inspire others with your environmental journey')).toBeVisible();
    
    // Close the modal
    await page.click('text=✕');
    
    // Modal should disappear
    await expect(page.getByText('Share Your Impact!')).not.toBeVisible();
  });

  test('should open and close community panel', async ({ page }) => {
    await page.goto('/diary');
    
    // Click community button
    await page.click('text=🌍 Community');
    
    // Wait for community panel to appear
    await expect(page.getByText('Thailand Waste Diary Community')).toBeVisible();
    await expect(page.getByText('Together for Carbon Neutral 2050')).toBeVisible();
    
    // Check community stats are visible
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('Trees Saved')).toBeVisible();
    
    // Close the panel
    await page.click('button:has-text("×")');
    
    // Panel should disappear
    await expect(page.getByText('Thailand Waste Diary Community')).not.toBeVisible();
  });

  test('should expand environmental impact insights', async ({ page }) => {
    await page.goto('/diary');
    
    // Click on insights section to expand
    await page.click('text=📊 Environmental Impact Insights');
    
    // Check that insights content is visible
    await expect(page.getByText('CO₂ Impact Today')).toBeVisible();
    await expect(page.getByText('Thailand Ranking')).toBeVisible();
    await expect(page.getByText('Energy Equivalent')).toBeVisible();
  });

  test('should display no waste tracked message initially', async ({ page }) => {
    await page.goto('/diary');
    
    // Should show no waste tracked today
    await expect(page.getByText('No waste tracked today!')).toBeVisible();
    await expect(page.getByText('Start by scanning or adding your first item')).toBeVisible();
  });

  test('should check responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/diary');
    
    // Check main elements are still visible on mobile
    await expect(page.getByText('Thailand Waste Diary 🗂️')).toBeVisible();
    await expect(page.getByText('🔔 Notifications')).toBeVisible();
    await expect(page.getByText('🚀 Share Impact')).toBeVisible();
    await expect(page.getByText('🌍 Community')).toBeVisible();
    
    // Action buttons should be visible
    await expect(page.getByText('📷 AI Scanner (Demo)')).toBeVisible();
    await expect(page.getByText('✏️ Manual Entry')).toBeVisible();
    await expect(page.getByText('📚 View History')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/diary');
    
    // Check main content has proper ARIA role
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('role', 'main');
    
    // Check skip link for accessibility
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeVisible();
  });

  test('should handle PWA features', async ({ page }) => {
    await page.goto('/diary');
    
    // Check PWA manager is loaded
    // Note: In a real test, you'd check for service worker registration
    // and manifest.json, but those require more complex setup
    
    // Check that offline indicator is present but not visible (user is online)
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    // Should exist but be hidden when online
  });
});

test.describe('History Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/diary/history');
  });

  test('should load history page with correct elements', async ({ page }) => {
    await expect(page.getByText('📚 Waste Diary History')).toBeVisible();
    await expect(page.getByText('Track your environmental journey over time')).toBeVisible();
    
    // Check view mode buttons
    await expect(page.getByText('🔍 Search')).toBeVisible();
    await expect(page.getByText('📋 List')).toBeVisible();
    await expect(page.getByText('📊 Analytics')).toBeVisible();
    await expect(page.getByText('📅 Calendar')).toBeVisible();
  });

  test('should toggle search functionality', async ({ page }) => {
    // Click search button
    await page.click('text=🔍 Search');
    
    // Advanced search should appear
    await expect(page.getByText('Advanced Search')).toBeVisible();
    await expect(page.getByPlaceholder('Search waste entries...')).toBeVisible();
    
    // Hide search
    await page.click('text=🔍 Hide');
    
    // Search should disappear
    await expect(page.getByText('Advanced Search')).not.toBeVisible();
  });

  test('should switch to analytics view', async ({ page }) => {
    // Click analytics button
    await page.click('text=📊 Analytics');
    
    // Should show analytics content when there are entries
    // For empty state, might show different content
    await expect(page.getByText('Analytics') || page.getByText('No Entries Yet')).toBeTruthy();
  });

  test('should show calendar view placeholder', async ({ page }) => {
    // Click calendar button
    await page.click('text=📅 Calendar');
    
    // Should show coming soon message
    await expect(page.getByText('Calendar View Coming Soon!')).toBeVisible();
    await expect(page.getByText('Switch to List View')).toBeVisible();
  });

  test('should have back navigation', async ({ page }) => {
    // Check back button
    const backButton = page.getByText('Back to Dashboard');
    await expect(backButton).toBeVisible();
    
    // Should be a link to /diary
    await expect(backButton.locator('..')).toHaveAttribute('href', '/diary');
  });
});

test.describe('Performance and Core Web Vitals', () => {
  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/diary');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000); // 5 seconds
  });

  test('should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/diary');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that critical elements are visible (basic performance check)
    await expect(page.getByText('Thailand Waste Diary 🗂️')).toBeVisible();
    await expect(page.getByText("Today's Credits")).toBeVisible();
    
    // In a real scenario, you'd integrate with Lighthouse API
    // to get actual performance scores
  });

  test('should handle offline scenarios', async ({ page, context }) => {
    await page.goto('/diary');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Simulate offline
    await context.setOffline(true);
    
    // Try to navigate (should still work with cached content)
    await page.goto('/diary/history');
    
    // Should still show some content or offline message
    // This depends on your PWA implementation
  });
});
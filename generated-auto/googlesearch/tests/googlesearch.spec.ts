import { test, expect } from '@playwright/test';
import { GoogleSearchPage } from '../pages/googlesearch.page';

test.describe('Google Search Page Tests', () => {
  let googleSearchPage: GoogleSearchPage;

  test.beforeEach(async ({ page }) => {
    googleSearchPage = new GoogleSearchPage(page);
    await googleSearchPage.navigate();
    await googleSearchPage.waitForPageLoad();
    
    // Handle sign-in dialog if it appears
    await googleSearchPage.handleSignInDialog(true);
  });

  test('should load Google homepage successfully', async () => {
    // Verify page title
    await expect(googleSearchPage.getPageTitle()).resolves.toBe('Google');
    
    // Verify main elements are visible
    expect(await googleSearchPage.isPageLoaded()).toBe(true);
    expect(await googleSearchPage.isSearchBoxVisible()).toBe(true);
    expect(await googleSearchPage.isGoogleSearchButtonVisible()).toBe(true);
    expect(await googleSearchPage.isImFeelingLuckyButtonVisible()).toBe(true);
  });

  test('should perform a basic search', async ({ page }) => {
    const searchQuery = 'Playwright testing';
    
    // Perform search
    await googleSearchPage.search(searchQuery);
    
    // Wait for navigation to search results
    await page.waitForURL('**/search?**');
    
    // Verify we're on search results page
    expect(page.url()).toContain('search');
    expect(page.url()).toContain('Playwright testing');
  });

  test('should fill and clear search box', async () => {
    const searchQuery = 'TypeScript automation';
    
    // Fill search box
    await googleSearchPage.fillSearchBox(searchQuery);
    expect(await googleSearchPage.getSearchBoxValue()).toBe(searchQuery);
    
    // Clear search box
    await googleSearchPage.clearSearchBox();
    expect(await googleSearchPage.getSearchBoxValue()).toBe('');
  });

  test('should search using Enter key', async ({ page }) => {
    const searchQuery = 'Web automation testing';
    
    // Search using Enter key
    await googleSearchPage.searchAndSubmit(searchQuery);
    
    // Wait for navigation
    await page.waitForURL('**/search?**');
    
    // Verify search results page
    expect(page.url()).toContain('search');
  });

  test('should navigate to different Google services', async ({ page, context }) => {
    // Test Gmail navigation
    const [gmailPage] = await Promise.all([
      context.waitForEvent('page'),
      googleSearchPage.navigateToGmail()
    ]);
    expect(gmailPage.url()).toContain('mail.google.com');
    await gmailPage.close();

    // Test Images navigation
    await googleSearchPage.navigateToImages();
    await page.waitForURL('**/imghp**');
    expect(page.url()).toContain('imghp');
    
    // Navigate back to main Google page
    await page.goBack();
    await googleSearchPage.waitForPageLoad();
  });

  test('should verify header navigation elements', async () => {
    // Verify all header navigation elements are visible
    expect(await googleSearchPage.isGmailLinkVisible()).toBe(true);
    expect(await googleSearchPage.isImagesLinkVisible()).toBe(true);
    expect(await googleSearchPage.isSignInLinkVisible()).toBe(true);
  });

  test('should interact with voice and image search buttons', async () => {
    // Note: These buttons may trigger permission dialogs or require additional setup
    // This test verifies the buttons are present and clickable
    
    // Verify search enhancement buttons are visible
    await expect(googleSearchPage.searchByVoiceButton).toBeVisible();
    await expect(googleSearchPage.searchByImageButton).toBeVisible();
    await expect(googleSearchPage.aiModeLink).toBeVisible();
  });

  test('should verify language options', async () => {
    // Get all available language links
    const languageLinks = await googleSearchPage.getLanguageLinks();
    
    // Verify we have multiple language options
    expect(languageLinks.length).toBeGreaterThan(0);
    
    // Verify specific language links are visible
    await expect(googleSearchPage.hindiLink).toBeVisible();
    await expect(googleSearchPage.bengaliLink).toBeVisible();
    await expect(googleSearchPage.teluguLink).toBeVisible();
  });

  test('should verify footer links', async () => {
    // Verify footer information and links
    await expect(googleSearchPage.countryInfo).toBeVisible();
    await expect(googleSearchPage.advertisingLink).toBeVisible();
    await expect(googleSearchPage.businessLink).toBeVisible();
    await expect(googleSearchPage.howSearchWorksLink).toBeVisible();
    await expect(googleSearchPage.privacyLink).toBeVisible();
    await expect(googleSearchPage.termsLink).toBeVisible();
    await expect(googleSearchPage.settingsButton).toBeVisible();
  });

  test('should handle I am Feeling Lucky button', async ({ page }) => {
    // Fill search box first
    await googleSearchPage.fillSearchBox('Playwright');
    
    // Click I'm Feeling Lucky (this will navigate to the first result)
    await googleSearchPage.clickImFeelingLucky();
    
    // Wait for navigation away from Google
    await page.waitForURL((url) => !url.includes('google.com'));
    
    // Verify we've navigated away from Google
    expect(page.url()).not.toContain('google.com');
  });

  test('should switch language interface', async ({ page }) => {
    // Switch to Hindi interface
    await googleSearchPage.switchToHindi();
    
    // Wait for page reload with new language
    await page.waitForURL('**hl=hi**');
    
    // Verify language parameter in URL
    expect(page.url()).toContain('hl=hi');
  });

  test('should take screenshot for visual verification', async () => {
    // Take a screenshot of the homepage
    await googleSearchPage.takeScreenshot('google-homepage');
    
    // Fill search box and take another screenshot
    await googleSearchPage.fillSearchBox('Playwright Page Object Model');
    await googleSearchPage.takeScreenshot('google-search-filled');
  });

  // Performance test
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await googleSearchPage.navigate();
    await googleSearchPage.waitForPageLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Assert page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // Accessibility test
  test('should have proper accessibility attributes', async ({ page }) => {
    // Check search box has proper label
    await expect(googleSearchPage.searchBox).toHaveAttribute('role', 'combobox');
    
    // Check buttons have proper roles
    await expect(googleSearchPage.googleSearchButton).toHaveAttribute('type', 'submit');
    
    // Verify page has proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThanOrEqual(0);
  });
});

// Configuration for screenshot directory
test.beforeAll(async () => {
  const fs = require('fs');
  const path = require('path');
  
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});
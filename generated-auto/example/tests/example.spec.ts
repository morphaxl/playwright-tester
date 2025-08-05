import { test, expect } from '@playwright/test';
import { ExamplePage } from '../pages/example.page';

test.describe('Example.com Homepage Tests', () => {
  let examplePage: ExamplePage;

  test.beforeEach(async ({ page }) => {
    examplePage = new ExamplePage(page);
    await examplePage.navigate();
  });

  test('should display the correct page title', async () => {
    await examplePage.assertPageTitle();
  });

  test('should display the main heading', async () => {
    await examplePage.assertHeadingText();
    expect(await examplePage.isHeadingVisible()).toBe(true);
  });

  test('should display the description paragraph', async () => {
    expect(await examplePage.isDescriptionVisible()).toBe(true);
    await examplePage.assertDescriptionContains('This domain is for use in illustrative examples');
  });

  test('should display the more information link', async () => {
    await examplePage.assertMoreInfoLinkExists();
    await examplePage.assertMoreInfoLinkHref();
    expect(await examplePage.getMoreInfoLinkText()).toBe('More information...');
  });

  test('should navigate to IANA website when clicking more info link', async ({ page, context }) => {
    // Create a promise that resolves when a new page is opened
    const pagePromise = context.waitForEvent('page');
    
    await examplePage.clickMoreInfoLink();
    
    // Wait for the new page to open
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    
    // Verify the new page URL
    expect(newPage.url()).toContain('iana.org');
  });

  test('should have all expected elements visible', async () => {
    // Test all elements are visible
    expect(await examplePage.isHeadingVisible()).toBe(true);
    expect(await examplePage.isDescriptionVisible()).toBe(true);
    expect(await examplePage.isMoreInfoLinkVisible()).toBe(true);
  });

  test('should have correct text content', async () => {
    // Verify text content
    const headingText = await examplePage.getHeadingText();
    const descriptionText = await examplePage.getDescriptionText();
    const linkText = await examplePage.getMoreInfoLinkText();

    expect(headingText).toBe('Example Domain');
    expect(descriptionText).toContain('This domain is for use in illustrative examples');
    expect(linkText).toBe('More information...');
  });
});
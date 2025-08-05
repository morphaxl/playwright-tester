import { Page, Locator, expect } from '@playwright/test';

export class GoogleSearchPage {
  readonly page: Page;
  
  // Header Navigation Elements
  readonly aboutLink: Locator;
  readonly storeLink: Locator;
  readonly gmailLink: Locator;
  readonly imagesLink: Locator;
  readonly googleAppsButton: Locator;
  readonly signInLink: Locator;
  
  // Google Logo
  readonly googleLogo: Locator;
  
  // Search Elements
  readonly searchBox: Locator;
  readonly searchByVoiceButton: Locator;
  readonly searchByImageButton: Locator;
  readonly aiModeLink: Locator;
  readonly googleSearchButton: Locator;
  readonly imFeelingLuckyButton: Locator;
  
  // Language Links
  readonly languageLinks: Locator;
  readonly hindiLink: Locator;
  readonly bengaliLink: Locator;
  readonly teluguLink: Locator;
  readonly marathiLink: Locator;
  readonly tamilLink: Locator;
  readonly gujaratiLink: Locator;
  readonly kannadaLink: Locator;
  readonly malayalamLink: Locator;
  readonly punjabiLink: Locator;
  
  // Footer Elements
  readonly countryInfo: Locator;
  readonly advertisingLink: Locator;
  readonly businessLink: Locator;
  readonly howSearchWorksLink: Locator;
  readonly privacyLink: Locator;
  readonly termsLink: Locator;
  readonly settingsButton: Locator;
  
  // Sign-in Dialog Elements
  readonly signInDialog: Locator;
  readonly staySignedOutButton: Locator;
  readonly signInDialogButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header Navigation
    this.aboutLink = page.getByRole('link', { name: 'About' });
    this.storeLink = page.getByRole('link', { name: 'Store' });
    this.gmailLink = page.getByRole('link', { name: 'Gmail' });
    this.imagesLink = page.getByRole('link', { name: 'Search for Images' });
    this.googleAppsButton = page.getByRole('button', { name: 'Google apps' });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
    
    // Google Logo
    this.googleLogo = page.locator('img[alt="Google"]').first();
    
    // Search Elements
    this.searchBox = page.getByRole('combobox', { name: 'Search' });
    this.searchByVoiceButton = page.getByRole('button', { name: 'Search by voice' });
    this.searchByImageButton = page.getByRole('button', { name: 'Search by image' });
    this.aiModeLink = page.getByRole('link', { name: 'AI Mode' });
    this.googleSearchButton = page.getByRole('button', { name: 'Google Search' });
    this.imFeelingLuckyButton = page.getByRole('button', { name: "I'm Feeling Lucky" });
    
    // Language Links
    this.languageLinks = page.locator('a[href*="setprefs"]');
    this.hindiLink = page.getByRole('link', { name: 'हिन्दी' });
    this.bengaliLink = page.getByRole('link', { name: 'বাংলা' });
    this.teluguLink = page.getByRole('link', { name: 'తెలుగు' });
    this.marathiLink = page.getByRole('link', { name: 'मराठी' });
    this.tamilLink = page.getByRole('link', { name: 'தமிழ்' });
    this.gujaratiLink = page.getByRole('link', { name: 'ગુજરાતી' });
    this.kannadaLink = page.getByRole('link', { name: 'ಕನ್ನಡ' });
    this.malayalamLink = page.getByRole('link', { name: 'മലയാളം' });
    this.punjabiLink = page.getByRole('link', { name: 'ਪੰਜਾਬੀ' });
    
    // Footer Elements
    this.countryInfo = page.locator('div:has-text("India")').first();
    this.advertisingLink = page.getByRole('link', { name: 'Advertising' });
    this.businessLink = page.getByRole('link', { name: 'Business' });
    this.howSearchWorksLink = page.getByRole('link', { name: 'How Search works' });
    this.privacyLink = page.getByRole('link', { name: 'Privacy' });
    this.termsLink = page.getByRole('link', { name: 'Terms' });
    this.settingsButton = page.getByRole('button', { name: 'Settings' });
    
    // Sign-in Dialog
    this.signInDialog = page.getByRole('dialog', { name: 'Sign in to Google' });
    this.staySignedOutButton = page.getByRole('button', { name: 'Stay signed out' });
    this.signInDialogButton = page.getByRole('button', { name: 'Sign in' });
  }

  // Navigation Methods
  async navigate(): Promise<void> {
    await this.page.goto('https://www.google.com');
  }

  async navigateToAbout(): Promise<void> {
    await this.aboutLink.click();
  }

  async navigateToStore(): Promise<void> {
    await this.storeLink.click();
  }

  async navigateToGmail(): Promise<void> {
    await this.gmailLink.click();
  }

  async navigateToImages(): Promise<void> {
    await this.imagesLink.click();
  }

  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  // Search Methods
  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.googleSearchButton.click();
  }

  async searchAndSubmit(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.searchBox.press('Enter');
  }

  async fillSearchBox(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  async clearSearchBox(): Promise<void> {
    await this.searchBox.clear();
  }

  async clickImFeelingLucky(): Promise<void> {
    await this.imFeelingLuckyButton.click();
  }

  async clickSearchByVoice(): Promise<void> {
    await this.searchByVoiceButton.click();
  }

  async clickSearchByImage(): Promise<void> {
    await this.searchByImageButton.click();
  }

  async clickAIMode(): Promise<void> {
    await this.aiModeLink.click();
  }

  // Language Methods
  async switchToHindi(): Promise<void> {
    await this.hindiLink.click();
  }

  async switchToBengali(): Promise<void> {
    await this.bengaliLink.click();
  }

  async switchToTelugu(): Promise<void> {
    await this.teluguLink.click();
  }

  // Dialog Methods
  async handleSignInDialog(staySignedOut: boolean = true): Promise<void> {
    if (await this.signInDialog.isVisible()) {
      if (staySignedOut) {
        await this.staySignedOutButton.click();
      } else {
        await this.signInDialogButton.click();
      }
    }
  }

  // Assertion Methods
  async isPageLoaded(): Promise<boolean> {
    return await this.googleLogo.isVisible() && await this.searchBox.isVisible();
  }

  async isSearchBoxVisible(): Promise<boolean> {
    return await this.searchBox.isVisible();
  }

  async isSearchBoxFocused(): Promise<boolean> {
    return await this.searchBox.isFocused();
  }

  async getSearchBoxValue(): Promise<string> {
    return await this.searchBox.inputValue();
  }

  async isGoogleSearchButtonVisible(): Promise<boolean> {
    return await this.googleSearchButton.isVisible();
  }

  async isImFeelingLuckyButtonVisible(): Promise<boolean> {
    return await this.imFeelingLuckyButton.isVisible();
  }

  async isSignInLinkVisible(): Promise<boolean> {
    return await this.signInLink.isVisible();
  }

  async isGmailLinkVisible(): Promise<boolean> {
    return await this.gmailLink.isVisible();
  }

  async isImagesLinkVisible(): Promise<boolean> {
    return await this.imagesLink.isVisible();
  }

  async isSignInDialogVisible(): Promise<boolean> {
    return await this.signInDialog.isVisible();
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  // Wait Methods
  async waitForPageLoad(): Promise<void> {
    await expect(this.googleLogo).toBeVisible();
    await expect(this.searchBox).toBeVisible();
    await expect(this.googleSearchButton).toBeVisible();
  }

  async waitForSearchSuggestions(): Promise<void> {
    await this.page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  }

  // Utility Methods
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async getLanguageLinks(): Promise<string[]> {
    const links = await this.languageLinks.allTextContents();
    return links;
  }
}
import { Page, Locator, expect } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly descriptionParagraph: Locator;
  readonly moreInfoLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.descriptionParagraph = page.locator('p').first();
    this.moreInfoLink = page.locator('a[href*="iana.org"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('https://www.example.com');
  }

  async clickMoreInfoLink(): Promise<void> {
    await this.moreInfoLink.click();
  }

  async isHeadingVisible(): Promise<boolean> {
    return await this.heading.isVisible();
  }

  async getHeadingText(): Promise<string> {
    return await this.heading.textContent() || '';
  }

  async isDescriptionVisible(): Promise<boolean> {
    return await this.descriptionParagraph.isVisible();
  }

  async getDescriptionText(): Promise<string> {
    return await this.descriptionParagraph.textContent() || '';
  }

  async isMoreInfoLinkVisible(): Promise<boolean> {
    return await this.moreInfoLink.isVisible();
  }

  async getMoreInfoLinkText(): Promise<string> {
    return await this.moreInfoLink.textContent() || '';
  }

  async assertPageTitle(): Promise<void> {
    await expect(this.page).toHaveTitle('Example Domain');
  }

  async assertHeadingText(expectedText: string = 'Example Domain'): Promise<void> {
    await expect(this.heading).toHaveText(expectedText);
  }

  async assertDescriptionContains(expectedText: string): Promise<void> {
    await expect(this.descriptionParagraph).toContainText(expectedText);
  }

  async assertMoreInfoLinkExists(): Promise<void> {
    await expect(this.moreInfoLink).toBeVisible();
  }

  async assertMoreInfoLinkHref(): Promise<void> {
    await expect(this.moreInfoLink).toHaveAttribute('href', 'https://www.iana.org/domains/example');
  }
}
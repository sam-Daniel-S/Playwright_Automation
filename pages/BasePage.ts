import { Page, Locator, expect } from '@playwright/test';
import { SelectorAssistant } from '../lib/ai/selectorAssistant';

/**
 * Base page class with common utilities and error handling
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseTimeout = 30000;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Enhanced locator with fallback strategies and AI assistance
   */
  protected locator(selector: string, options?: { timeout?: number }): Locator {
    const timeout = options?.timeout || this.baseTimeout;
    
    return this.page.locator(selector).first();
  }

  /**
   * Locate element by test ID with fallback strategies
   */
  protected getByTestId(testId: string): Locator {
    // Try exact match first, then partial match
    const exactLocator = this.page.locator(`[data-testid="${testId}"]`);
    return exactLocator;
  }

  /**
   * Wait for element with enhanced error handling
   */
  async waitFor(
    selector: string, 
    options: { 
      state?: 'visible' | 'hidden' | 'attached' | 'detached';
      timeout?: number;
    } = {}
  ): Promise<void> {
    const { state = 'visible', timeout = this.baseTimeout } = options;
    
    try {
      await this.locator(selector).waitFor({ state, timeout });
    } catch (error) {
      console.warn(`Wait failed for selector: ${selector}`);
      
      // Attempt AI-assisted selector suggestions on failure
      try {
        const suggestions = await SelectorAssistant.suggestSelectors(this.page, selector);
        
        if (suggestions.length > 0) {
          console.log('Trying AI-suggested alternative selectors...');
          
          for (const suggestion of suggestions.slice(0, 3)) {
            try {
              console.log(`Trying: ${suggestion.selector} (confidence: ${suggestion.confidence})`);
              await this.page.locator(suggestion.selector).first().waitFor({ state, timeout: 5000 });
              console.log(`✅ Alternative selector worked: ${suggestion.selector}`);
              return;
            } catch (e) {
              console.log(`❌ Alternative failed: ${suggestion.selector}`);
            }
          }
        }
      } catch (aiError) {
        console.warn('AI selector assistance failed:', aiError);
      }
      
      // Re-throw original error if no alternatives work
      throw error;
    }
  }

  /**
   * Click element when ready with retry logic
   */
  async clickWhenReady(
    selector: string, 
    options: { timeout?: number; force?: boolean } = {}
  ): Promise<void> {
    const { timeout = this.baseTimeout, force = false } = options;
    
    await this.waitFor(selector, { state: 'visible', timeout });
    
    const element = this.locator(selector);
    
    // Ensure element is enabled and clickable
    await expect(element).toBeEnabled({ timeout: 5000 });
    
    // Scroll element into view if needed
    await element.scrollIntoViewIfNeeded();
    
    // Click with retry logic
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await element.click({ force, timeout: 10000 });
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`Click attempt ${attempt} failed for ${selector}:`, error);
        
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(1000); // Wait before retry
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Fill input field with validation
   */
  async fillInput(
    selector: string, 
    value: string, 
    options: { 
      clear?: boolean; 
      timeout?: number;
      validate?: boolean;
    } = {}
  ): Promise<void> {
    const { clear = true, timeout = this.baseTimeout, validate = true } = options;
    
    await this.waitFor(selector, { state: 'visible', timeout });
    
    const element = this.locator(selector);
    
    // Clear existing value if requested
    if (clear) {
      await element.clear();
    }
    
    // Fill the input
    await element.fill(value);
    
    // Validate the input was filled correctly
    if (validate) {
      const actualValue = await element.inputValue();
      if (actualValue !== value) {
        console.warn(`Input validation failed. Expected: "${value}", Actual: "${actualValue}"`);
        // Try typing character by character as fallback
        await element.clear();
        await element.type(value, { delay: 50 });
      }
    }
  }

  /**
   * Select option from dropdown
   */
  async selectOption(
    dropdownSelector: string, 
    optionText: string, 
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = this.baseTimeout } = options;
    
    // Click dropdown to open
    await this.clickWhenReady(dropdownSelector, { timeout });
    
    // Wait for options to appear
    await this.page.waitForTimeout(500);
    
    // Try to find and click the option
    const optionSelectors = [
      `text="${optionText}"`,
      `text*="${optionText}"`,
      `[role="option"]:has-text("${optionText}")`,
      `.option:has-text("${optionText}")`,
      `li:has-text("${optionText}")`
    ];
    
    let clicked = false;
    for (const optionSelector of optionSelectors) {
      try {
        const option = this.page.locator(optionSelector).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        clicked = true;
        break;
      } catch (error) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      throw new Error(`Could not select option "${optionText}" from dropdown "${dropdownSelector}"`);
    }
    
    // Wait for dropdown to close
    await this.page.waitForTimeout(500);
  }

  /**
   * Get text content with fallback to different attributes
   */
  async getText(selector: string): Promise<string> {
    const element = this.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    // Try different ways to get text
    const strategies = [
      () => element.textContent(),
      () => element.innerText(),
      () => element.getAttribute('value'),
      () => element.getAttribute('placeholder')
    ];
    
    for (const strategy of strategies) {
      try {
        const text = await strategy();
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (error) {
        // Continue to next strategy
      }
    }
    
    return '';
  }

  /**
   * Check if element exists and is visible
   */
  async isVisible(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Additional buffer
  }

  /**
   * Capture screenshot for debugging
   */
  async captureScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const path = `test-results/screenshots/${filename}`;
    
    await this.page.screenshot({ 
      path, 
      fullPage: true 
    });
    
    return path;
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Navigate to URL and wait for load
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for multiple elements to be visible
   */
  async waitForElements(selectors: string[]): Promise<void> {
    const promises = selectors.map(selector => 
      this.waitFor(selector, { state: 'visible' })
    );
    
    await Promise.all(promises);
  }

  /**
   * Retry action with exponential backoff
   */
  async retry<T>(
    action: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
    } = {}
  ): Promise<T> {
    const { 
      maxAttempts = 3, 
      baseDelay = 1000, 
      maxDelay = 10000 
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.page.waitForTimeout(delay);
      }
    }

    throw lastError!;
  }
}
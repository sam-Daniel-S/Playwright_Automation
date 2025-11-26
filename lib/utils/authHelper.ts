import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication helper for handling Microsoft login
 */
export class AuthHelper {
  private static readonly AUTH_FILE = path.join(__dirname, '..', 'test-results', 'auth.json');
  private static readonly LOGIN_URL = '/login';
  
  /**
   * Perform Microsoft login and save authentication state
   */
  static async login(page: Page): Promise<void> {
    console.log('🔐 Starting Microsoft authentication process...');
    
    try {
      // Navigate to login page
      await page.goto(this.LOGIN_URL);
      await page.waitForLoadState('networkidle');
      
      console.log('📍 Navigated to login page');
      
      // Take screenshot of login page
      await page.screenshot({
        path: 'test-results/login-page.png',
        fullPage: true
      });
      
      // Check if already logged in (redirect to main app)
      if (page.url().includes('/login') === false) {
        console.log('✅ Already authenticated, skipping login');
        return;
      }
      
      // Look for Microsoft login elements
      const microsoftLoginSelectors = [
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'input[type="submit"][value*="Sign"]',
        'a:has-text("Microsoft")',
        'button:has-text("Continue")',
        '[data-testid="login-button"]',
        '.login-button',
        '#login-button'
      ];
      
      let loginClicked = false;
      
      for (const selector of microsoftLoginSelectors) {
        try {
          const element = page.locator(selector).first();
          
          if (await element.isVisible({ timeout: 5000 })) {
            console.log(`🖱️  Clicking login element: ${selector}`);
            await element.click();
            loginClicked = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!loginClicked) {
        console.log('⚠️  No login button found, checking if login form is present');
        
        // Look for email input (Microsoft login form)
        const emailSelectors = [
          'input[type="email"]',
          'input[name="loginfmt"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]'
        ];
        
        for (const emailSelector of emailSelectors) {
          if (await page.locator(emailSelector).isVisible({ timeout: 3000 })) {
            console.log('📧 Found email input, attempting automated login...');
            await this.handleAutomatedLogin(page);
            return;
          }
        }
      }
      
      // Wait for potential redirect after login button click
      if (loginClicked) {
        await page.waitForTimeout(3000);
        
        // Check if redirected to Microsoft login
        if (page.url().includes('login.microsoftonline.com') || page.url().includes('microsoft')) {
          console.log('🔄 Redirected to Microsoft login, handling authentication...');
          await this.handleManualLogin(page);
        } else {
          // Check if login was successful (redirected away from login page)
          await page.waitForTimeout(2000);
          if (!page.url().includes('/login')) {
            console.log('✅ Login successful, proceeding...');
          } else {
            console.log('⚠️  Still on login page, may need manual intervention');
            await this.handleManualLogin(page);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Login process failed:', error);
      
      // Take screenshot of failure state
      await page.screenshot({
        path: 'test-results/login-failure.png',
        fullPage: true
      });
      
      // Continue with manual login process
      await this.handleManualLogin(page);
    }
  }
  
  /**
   * Handle automated login with provided credentials
   */
  private static async handleAutomatedLogin(page: Page): Promise<void> {
    console.log('🤖 Starting automated Microsoft login...');
    
    try {
      // Microsoft credentials
      // const username = '2451487@tcs.com';
      // const password = 'BestJ@123456789';
       const username = '2853064@tcs.com';
      const password = 'Abhi@nayaa192004';
      
      // Fill email field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="loginfmt"]',
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]'
      ];
      
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const emailInput = page.locator(selector).first();
          if (await emailInput.isVisible({ timeout: 3000 })) {
            console.log('📧 Filling email field...');
            await emailInput.click();
            await emailInput.fill(username);
            emailFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!emailFilled) {
        console.log('❌ Could not find email input, falling back to manual login');
        await this.handleManualLogin(page);
        return;
      }
      
      // Click Next/Continue button
      const nextSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'input[value="Next"]',
        'button:has-text("Next")',
        'button:has-text("Continue")',
        '#idSIButton9'
      ];
      
      let nextClicked = false;
      for (const selector of nextSelectors) {
        try {
          const nextButton = page.locator(selector).first();
          if (await nextButton.isVisible({ timeout: 3000 })) {
            console.log('➡️ Clicking Next button...');
            await nextButton.click();
            nextClicked = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!nextClicked) {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        console.log('⌨️ Pressed Enter to continue...');
      }
      
      // Wait for password page
      await page.waitForTimeout(3000);
      
      // Fill password field
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="passwd"]',
        'input[name="Password"]',
        '#passwordInput'
      ];
      
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const passwordInput = page.locator(selector).first();
          if (await passwordInput.isVisible({ timeout: 5000 })) {
            console.log('🔐 Filling password field...');
            await passwordInput.click();
            await passwordInput.fill(password);
            passwordFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!passwordFilled) {
        console.log('⚠️ Password field not found, may need manual intervention');
        await this.handleManualLogin(page);
        return;
      }
      
      // Click Sign In button
      const signInSelectors = [
        'input[value="Sign in"]',
        'button:has-text("Sign in")',
        'button[type="submit"]',
        'input[type="submit"]',
        '#idSIButton9'
      ];
      
      let signInClicked = false;
      for (const selector of signInSelectors) {
        try {
          const signInButton = page.locator(selector).first();
          if (await signInButton.isVisible({ timeout: 3000 })) {
            console.log('🔑 Clicking Sign In button...');
            await signInButton.click();
            signInClicked = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!signInClicked) {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        console.log('⌨️ Pressed Enter to sign in...');
      }
      
      // Handle "Stay signed in?" prompt
      await page.waitForTimeout(3000);
      
      const staySignedInSelectors = [
        'input[value="Yes"]',
        'button:has-text("Yes")',
        '#idSIButton9'
      ];
      
      for (const selector of staySignedInSelectors) {
        try {
          const staySignedInButton = page.locator(selector).first();
          if (await staySignedInButton.isVisible({ timeout: 3000 })) {
            console.log('✅ Clicking Stay signed in...');
            await staySignedInButton.click();
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      // Wait for login completion and then navigate directly to main app
      console.log('⏳ Waiting for login completion...');
      await page.waitForTimeout(5000);
      
      // After automated login steps, navigate directly to the main application
      console.log('🔄 Navigating to main application...');
      try {
        await page.goto('/en');
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        console.log(`📍 Navigated to: ${currentUrl}`);
        
        // Check if we successfully reached the main application
        if (currentUrl.includes('/en')) {
          console.log('✅ Automated login completed successfully!');
          console.log('📍 Successfully accessed main application');
          return;
        }
        
        // If not on /en, try to check if app elements are visible
        const appElements = [
          '[data-testid="from-input"]',
          '[data-testid="to-input"]',
          'input[placeholder*="From"]',
          'input[placeholder*="To"]',
          'input[placeholder*="from"]',
          'input[placeholder*="to"]',
          '.search-form',
          '#search-form',
          'button:has-text("Search")',
          'input[type="text"]'
        ];
        
        let appElementFound = false;
        for (const selector of appElements) {
          if (await page.locator(selector).isVisible({ timeout: 3000 })) {
            console.log(`✅ Found app element: ${selector}`);
            appElementFound = true;
            break;
          }
        }
        
        if (appElementFound) {
          console.log('✅ Automated login completed successfully!');
          console.log(`📍 Final URL: ${currentUrl}`);
          return;
        }
        
      } catch (error) {
        console.log('⚠️ Direct navigation failed, falling back to manual detection...');
      }
      
      // If direct navigation didn't work, fall back to manual login
      await this.handleManualLogin(page);
      
    } catch (error) {
      console.error('❌ Automated login failed:', error);
      console.log('🔄 Falling back to manual login process...');
      await this.handleManualLogin(page);
    }
  }
  
  /**
   * Handle manual login process - pause for user intervention
   */
  private static async handleManualLogin(page: Page): Promise<void> {
    // First, do a quick check if login is already complete
    const currentUrl = page.url();
    
    // If already on main app (including /en redirect), no manual login needed
    if (currentUrl.includes('/en') ||
        (!currentUrl.includes('/login') && 
         !currentUrl.includes('login.microsoftonline.com') &&
         !currentUrl.includes('login.microsoft'))) {
      
      // If on /en path, login is complete
      if (currentUrl.includes('/en')) {
        console.log('✅ Login already completed! Redirected to /en path.');
        console.log(`📍 Current URL: ${currentUrl}`);
        return;
      }
      
      // Double check with app elements for other paths
      try {
        const appElements = [
          '[data-testid="from-input"]',
          '[data-testid="to-input"]',
          'input[placeholder*="From"]',
          'input[placeholder*="To"]',
          '.search-form'
        ];
        
        for (const selector of appElements) {
          if (await page.locator(selector).isVisible({ timeout: 3000 })) {
            console.log('✅ Login already completed! App is accessible.');
            console.log(`📍 Current URL: ${currentUrl}`);
            return;
          }
        }
      } catch (error) {
        // Continue with manual login flow
      }
    }
    
    console.log('\n🛑 MANUAL LOGIN REQUIRED');
    console.log('📋 Please complete the Microsoft login manually in the browser window:');
    console.log('   1. Enter your Microsoft credentials');
    console.log('   2. Complete any 2FA if required');
    console.log('   3. Wait for redirect to the main application');
    console.log('   4. The test will automatically continue once login is complete\n');
    
    // Wait for login completion - check URL change or specific elements
    const maxWaitTime = 120000; // 2 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if we've been redirected away from login page
        const currentUrl = page.url();
        
        // Check for /en redirect (successful login) or other non-login URLs
        if (currentUrl.includes('/en') ||
            (!currentUrl.includes('/login') && 
             !currentUrl.includes('login.microsoftonline.com') &&
             !currentUrl.includes('login.microsoft'))) {
          
          console.log(`🔄 Detected redirect: ${currentUrl}`);
          
          // If on /en path, login is definitely successful
          if (currentUrl.includes('/en')) {
            console.log('✅ Login completed successfully! Redirected to /en');
            console.log(`📍 Current URL: ${currentUrl}`);
            
            // Take screenshot of successful login
            await page.screenshot({
              path: 'test-results/login-success.png',
              fullPage: true
            });
            
            break;
          }
          
          // For other paths, verify app is accessible with element check
          const appElements = [
            '[data-testid="from-input"]',
            '[data-testid="to-input"]',
            'input[placeholder*="From"]',
            'input[placeholder*="To"]',
            '.search-form'
          ];
          
          let appAccessible = false;
          for (const selector of appElements) {
            if (await page.locator(selector).isVisible({ timeout: 3000 })) {
              appAccessible = true;
              break;
            }
          }
          
          if (appAccessible) {
            console.log('✅ Login completed successfully!');
            console.log(`📍 Current URL: ${currentUrl}`);
            
            // Take screenshot of successful login
            await page.screenshot({
              path: 'test-results/login-success.png',
              fullPage: true
            });
            
            break;
          }
        }
        
        // Wait and check again
        await page.waitForTimeout(2000);
        
      } catch (error) {
        // Continue waiting
      }
    }
    
    // Final check
    const finalUrl = page.url();
    if (finalUrl.includes('/login') || finalUrl.includes('microsoft')) {
      console.log('⚠️  Login may not be complete. Continuing anyway...');
    } else {
      console.log('✅ Login process completed!');
    }
  }
  
  /**
   * Save authentication state to file
   */
  static async saveAuthState(context: BrowserContext): Promise<void> {
    try {
      // Ensure directory exists
      const authDir = path.dirname(this.AUTH_FILE);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }
      
      await context.storageState({ path: this.AUTH_FILE });
      console.log('💾 Authentication state saved');
      
    } catch (error) {
      console.warn('⚠️  Could not save auth state:', error);
    }
  }
  
  /**
   * Load authentication state from file
   */
  static async loadAuthState(): Promise<string | undefined> {
    try {
      if (fs.existsSync(this.AUTH_FILE)) {
        console.log('📁 Loading saved authentication state');
        return this.AUTH_FILE;
      }
    } catch (error) {
      console.warn('⚠️  Could not load auth state:', error);
    }
    
    return undefined;
  }
  
  /**
   * Check if user is logged in
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      
      // If on Microsoft login pages, definitely not logged in
      if (currentUrl.includes('login.microsoftonline.com') || 
          currentUrl.includes('login.microsoft') ||
          currentUrl.includes('/login')) {
        return false;
      }
      
      // If redirected to /en path after Microsoft login, consider logged in
      if (currentUrl.includes('/en')) {
        console.log(`✅ Detected /en redirect - User is logged in`);
        return true;
      }
      
      // Check for application elements that indicate successful login
      const appSelectors = [
        '[data-testid="from-input"]',
        '[data-testid="to-input"]',
        'input[placeholder*="From"]',
        'input[placeholder*="To"]',
        'input[placeholder*="from"]',
        'input[placeholder*="to"]',
        '.search-form',
        '#search-form'
      ];
      
      for (const selector of appSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 3000 })) {
          console.log(`✅ Found app element: ${selector} - User is logged in`);
          return true;
        }
      }
      
      // Fallback: Look for user-related elements
      const userSelectors = [
        '[data-testid="user-menu"]',
        '.user-avatar',
        'button:has-text("Logout")',
        'button:has-text("Sign out")',
        '.navbar .user',
        '[aria-label*="user"]',
        '[data-testid="logout"]'
      ];
      
      for (const selector of userSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          console.log(`✅ Found user element: ${selector} - User is logged in`);
          return true;
        }
      }
      
      console.log(`⚠️ No login indicators found. URL: ${currentUrl}`);
      return false;
      
    } catch (error) {
      console.log(`❌ Error checking login status: ${error}`);
      return false;
    }
  }
  
  /**
   * Perform logout
   */
  static async logout(page: Page): Promise<void> {
    try {
      console.log('🚪 Attempting to logout...');
      
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Sign out")',
        'a:has-text("Logout")',
        '[data-testid="logout-button"]'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click();
            console.log('✅ Logout clicked');
            await page.waitForTimeout(2000);
            return;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      console.log('⚠️  Logout button not found');
      
    } catch (error) {
      console.warn('⚠️  Logout failed:', error);
    }
  }
  
  /**
   * Clear authentication state
   */
  static clearAuthState(): void {
    try {
      if (fs.existsSync(this.AUTH_FILE)) {
        fs.unlinkSync(this.AUTH_FILE);
        console.log('🗑️  Authentication state cleared');
      }
    } catch (error) {
      console.warn('⚠️  Could not clear auth state:', error);
    }
  }
}
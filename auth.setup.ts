import { test as setup, expect } from '@playwright/test';
import { AuthHelper } from './lib/utils/authHelper';

const authFile = './test-results/auth.json';

setup('authenticate', async ({ page, context }) => {
  console.log('🔧 Setting up authentication for all tests...');
  
  try {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if login is required
    if (!await AuthHelper.isLoggedIn(page)) {
      console.log('🔑 Performing authentication setup...');
      await AuthHelper.login(page);
      
      // Wait a bit to ensure login is complete
      await page.waitForTimeout(3000);
      
      // Verify authentication was successful
      if (await AuthHelper.isLoggedIn(page)) {
        console.log('✅ Authentication successful');
      } else {
        console.log('⚠️ Authentication may not be complete, but continuing...');
      }
    } else {
      console.log('✅ Already authenticated');
    }
    
    // Save authentication state
    await context.storageState({ path: authFile });
    console.log('💾 Authentication state saved to:', authFile);
    
    // Take screenshot of authenticated state
    await page.screenshot({
      path: 'test-results/authenticated-app.png',
      fullPage: true
    });
    
    // Verify we can access the main application
    const title = await page.title();
    const url = page.url();
    
    console.log('📋 Authenticated Application Info:');
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    
    // Ensure we're not still on a login page
    expect(url).not.toContain('/login');
    expect(url).not.toContain('microsoft');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    
    await page.screenshot({
      path: 'test-results/auth-setup-failed.png',
      fullPage: true
    });
    
    throw error;
  }
});
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../lib/utils/authHelper';

/**
 * One-time authentication setup test
 * Run this first to authenticate and save browser state for all other tests
 */
test('Authenticate and save browser state', async ({ page, context }) => {
  console.log('🔧 Setting up authentication for all future tests...');
  
  try {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Perform authentication
    console.log('🔑 Starting authentication process...');
    await AuthHelper.login(page);
    
    // Wait for authentication to complete
    await page.waitForTimeout(5000);
    
    // Verify we're authenticated
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('📋 Post-authentication status:');
    console.log(`   URL: ${currentUrl}`);
    console.log(`   Title: ${title}`);
    
    // Save the authentication state
    await context.storageState({ path: './test-results/auth.json' });
    console.log('💾 Authentication state saved to ./test-results/auth.json');
    
    // Take screenshot for verification
    await page.screenshot({
      path: 'test-results/authenticated-app-state.png',
      fullPage: true
    });
    
    // Verify we're not on login page
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).not.toContain('microsoft');
    
    console.log('✅ Authentication setup completed successfully!');
    console.log('🎯 All future tests will use this saved authentication state');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    
    await page.screenshot({
      path: 'test-results/auth-setup-error.png',
      fullPage: true
    });
    
    throw error;
  }
});
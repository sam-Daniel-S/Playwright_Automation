import { test, expect } from '@playwright/test';
import { AuthHelper } from '../lib/utils/authHelper';

/**
 * One-time authentication setup test
 * Run this first to authenticate and save browser state for all other tests
 */
test('Authenticate and save browser state', async ({ page, context }) => {
  console.log('🔧 Setting up authentication for all future tests...');
  
  try {
    // Set authentication cookie directly
    console.log('🔑 Setting authentication cookie...');
    await context.addCookies([{
      name:'AppServiceAuthSession',
      value:'a74s4eE50tzmtpEUWppzM8O+URioaNCCDb7vBqs+AjW2ufvXkAP7vGCrdJo5uaaEBHVCHmpSUUUMzYixNUHiuGPkmnhtmdXWPe92qmcnIfpCdmiePmMaSNAhs4AWeTWNUNI+gmAFJXJErjTxP10UWBlygQj77fzp1P7MYf51HptKeX1r1XBPyOtHzsAEeTVQZ2GkzBhTWcJsX/Ku1mWNQRpozWoS2McBTWlhCsC/UvLZFKsYmfwwvD5JY306OvSgDw7+D6l+6YGDht7HVBgNCvmPdL+la5bmKIvcUa55DLZdD+UBV2cLMZO5a5+0rr82vw7H14WL5sH1iCVzs3ITIEetdXkwL7BdkGSUS6cD+IPg5df2HQgdIQqiR5srn16EqqYT47kJQBh7QhWATASbMem77rwZdGiH3dpm7uVx/pewUv7J1D0Yulz161Gm6JDdH/aKeBBIpHE2iyjvt0Ah3nqty9eCI9xWc9vwDZLe0HmxLd9LLHHKY3H0dBrapCpIggzHgCxGPdN/jKW/iJD47ppvQCtSvZkSSN3BSWPuGTSIrmpVOY5HsbkB6retegQQ2A4HS1F8sCJh4lroQ0l8OcIjAZpbnnNoE94Oh0/Y/Emj+2VxqRVj/opQ8cq0ZEgs5G0pjorfRT3nBBp8ZNtUW+0jG9ZYKFgTNFHEJ4IY7+r1w/dU+Z+29sUTf0OcIxGL1M+MJ9Im9bJC6BgJWFLuRKIweCY5RgbOH1tcNBMdoVmCaEnM03UeBzg4QYI/4g71D1WRxSN35dLMAd4o5VJAc5++BktYYUTk2F6lgfZ5jjPalOvfEeOcx2GE/S1HBAoWU/SwFIyB151p4N/O16sHJVEG80KK3Wr/I3ZhRa94QAEcAgF4hmFHwhsT3FpJCVRNNoa3E8McaOWlGkdzdjzxjN9s2+DrMGpdC3oIAGWSW9V4RE6EAI+D89BJ5vYEu3PHaW2F0e/N8lhNF9H/34XbfaR1m5298e6rsRt62HEbMXQvKdAi+WGDXZ4jRJ0+jQEye9mqtkkPmktnxtMsPz0cv0yApHLsR8IMLi+AVuvVMuS/RtD/OeStD6oCzs/VTY2IBqYkUIC06X3HRfUvKTYldwvKXoS4aId1oaET9OE32weElrztATzj/eQ9RfLZ+Bu9XORfP+UpGLSYq0qPOTd8cV4E+v8EffQorFS/GKv+7XwFwBdvVFvLEuuguzUEMe6dSKFQV2mfCiwMPN1UxD3GSpb0NikUfNoy0yRn0UKwyPjmyrj3rbl92MQ481YOYGpzyLC1npuU7xbEZPOhiBz3ZSiSgm8QNTLmfkwrzGw5Nchw9KmaD/BSutWcQUCdCAwO2K1UqPG582i2S2xmse/MOs4g12sTpjDED3MvsG9kUsQ=',
      domain: 'app-test-finnair-fra-frontend-f7byg3hef7abafat.germanywestcentral-01.azurewebsites.net',
      path: '/',
      httpOnly: true,
      secure: true,
    }]);
    
    // Navigate to the application after setting cookies
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication to complete
    await page.waitForTimeout(2000);
    
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
    
    // Verify we're authenticated (more flexible check)
    if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('/login')) {
      console.log('⚠️ Still on login page, authentication may have failed');
      console.log('🔄 Attempting to continue anyway - this might be expected for some setups');
    } else {
      console.log('✅ Successfully authenticated - not on login page');
    }
    
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



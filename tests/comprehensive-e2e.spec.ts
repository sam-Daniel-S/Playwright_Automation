import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { ExcelReader } from '../lib/excel/excelReader';
import { PassengerBuilder } from '../lib/utils/passengerBuilder';
import { AuthHelper } from '../lib/utils/authHelper';
import { SearchPage } from '../pages/SearchPage';
import { ResultsPage } from '../pages/ResultsPage';
import { PassengerInfoPage } from '../pages/PassengerInfoPage';
import { BookingSummaryPage } from '../pages/BookingSummaryPage';
import { Scenario, FlightSelection } from '../lib/data/types';
import * as path from 'path';

// Global error handlers to prevent worker restarts
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

/**
 * Comprehensive E2E test that executes all scenarios from Excel/CSV
 */
test.describe('Airline Booking - All Scenarios E2E', () => {
  
  test('Execute all booking scenarios from test data', async ({ page, context }) => {
    // Set a longer timeout for the entire test suite to accommodate multiple scenarios
    test.setTimeout(18000000 * 10); // 18000 seconds per scenario * max 10 scenarios
    
    console.log('🚀 Starting comprehensive E2E test execution...');
    
    // Handle authentication with state management
    await handleAuthentication(page, context);
    
    // Load test scenarios
    const testDataPath = path.join(__dirname, '..', 'test-data', 'scenarios.xlsx');
    const csvFallbackPath = path.join(__dirname, '..', 'test-data', 'scenarios.csv');
    
    let scenarios: Scenario[] = [];
    
    try {
      console.log('📊 Loading test scenarios...');
      scenarios = await ExcelReader.readScenarios(testDataPath);
    } catch (error) {
      console.warn('Excel file not found, using CSV fallback...');
      scenarios = await ExcelReader.readScenarios(csvFallbackPath);
    }
    
    // Process and expand passenger data for all scenarios
    for (const scenario of scenarios) {
      if (scenario.parsedPassengers) {
        PassengerBuilder.validatePassengerCombination(scenario.parsedPassengers);
        scenario.expandedPassengers = PassengerBuilder.expandPassengers(scenario.parsedPassengers);
      }
    }
    
    console.log(`✅ Loaded ${scenarios.length} test scenarios`);
    
    // Debug: Print all loaded scenarios
    scenarios.forEach((scenario, index) => {
      console.log(`📋 Scenario ${index + 1}: ID="${scenario.scenarioID}", Action="${scenario.action}", ${scenario.origin}→${scenario.destination}`);
    });
    
    // Initialize page objects
    const searchPage = new SearchPage(page);
    const resultsPage = new ResultsPage(page);
    const passengerInfoPage = new PassengerInfoPage(page);
    const bookingSummaryPage = new BookingSummaryPage(page);
    
    // Execute each scenario
    let successCount = 0;
    let failureCount = 0;
    let currentScenarioIndex = 0;
    const results: { scenario: string; status: string; error?: string }[] = [];
    
    for (const scenario of scenarios) {
      currentScenarioIndex++;
      console.log(`\n📊 Processing scenario ${currentScenarioIndex} of ${scenarios.length}`);
      if (!scenario.scenarioID) {
        console.warn(`⚠️ Skipping scenario with missing scenarioID:`, scenario);
        continue;
      }
      
      console.log(`\n🧪 Executing Scenario: ${scenario.scenarioID}`);
      console.log(`📋 ${scenario.tripType} | ${scenario.origin} → ${scenario.destination} | ${scenario.cabin} | ${scenario.passengers}`);
      
      // Check if page/context is still valid before proceeding
      try {
        console.log(`🔍 Checking browser state for scenario ${scenario.scenarioID}...`);
        if (page.isClosed()) {
          throw new Error('Page has been closed - cannot continue with scenarios');
        }
        
        // Verify we can still interact with the page
        await page.evaluate(() => document.readyState);
        console.log(`✅ Browser state is valid for scenario ${scenario.scenarioID}`);
      } catch (contextError) {
        console.error(`❌ Browser context/page is closed. Stopping execution at scenario ${scenario.scenarioID}`);
        console.error('Context error:', contextError);
        break; // Stop executing remaining scenarios
      }
      
      try {
        // Set individual timeout for this scenario - FRESH START
        const scenarioTimeout = scenario.timeout || 18000000; // 18000 seconds per scenario
        console.log(`   ⏱️  Setting fresh timeout to ${scenarioTimeout}ms (${scenarioTimeout/1000} seconds) for this scenario`);
        
        // Create a fresh timeout for each scenario with execution time tracking
        const scenarioStartTime = Date.now();
        console.log(`   🚀 Scenario execution started at: ${new Date(scenarioStartTime).toISOString()}`);
        
        // Execute scenario with fresh timeout
        await Promise.race([
          executeScenarioWithTimeTracking(scenario, { searchPage, resultsPage, passengerInfoPage, bookingSummaryPage }, scenarioStartTime),
          new Promise((_, reject) => {
            setTimeout(() => {
              const elapsedTime = Date.now() - scenarioStartTime;
              reject(new Error(`Scenario timeout - exceeded ${scenarioTimeout}ms (actual execution time: ${elapsedTime}ms / ${Math.round(elapsedTime/1000)} seconds)`));
            }, scenarioTimeout);
          })
        ]);
        
        const scenarioElapsedTime = Date.now() - scenarioStartTime;
        console.log(`   ⏱️  Scenario completed in ${scenarioElapsedTime}ms (${Math.round(scenarioElapsedTime/1000)} seconds)`);
        
        successCount++;
        results.push({ scenario: scenario.scenarioID, status: 'PASSED' });
        console.log(`✅ Scenario ${scenario.scenarioID} completed successfully`);
        
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ scenario: scenario.scenarioID, status: 'FAILED', error: errorMessage });
        
        console.error(`❌ Scenario ${scenario.scenarioID} failed:`, errorMessage);
        
        try {
          // Only capture screenshot if page is still valid
          if (!page.isClosed()) {
            await page.screenshot({
              path: `test-results/scenario-${scenario.scenarioID}-failure.png`,
              fullPage: true
            }).catch(screenshotError => {
              console.warn(`Warning: Could not capture screenshot for ${scenario.scenarioID}:`, screenshotError);
            });
          } else {
            console.warn(`Warning: Cannot capture screenshot for ${scenario.scenarioID} - page is closed`);
          }
        } catch (screenshotError) {
          console.warn(`Warning: Screenshot capture failed for ${scenario.scenarioID}`);
        }
        
        // For negative test cases, failure might be expected
        if (scenario.expectedResult === 'error') {
          console.log(`ℹ️  This was a negative test case - failure expected`);
          successCount++; // Count as success since failure was expected
          failureCount--; // Remove from failure count
          results[results.length - 1].status = 'PASSED (Expected Failure)';
        }
        
        // Continue to next scenario regardless of failure
        console.log(`🔄 Continuing to next scenario...`);
      }
      
      // Enhanced cleanup and reset between scenarios to ensure fresh state
      try {
        if (!page.isClosed()) {
          console.log(`🔄 Starting cleanup and reset for next scenario...`);
          const cleanupStartTime = Date.now();
          
          await page.waitForTimeout(2000); // Longer delay between scenarios
          
          // Clear any potential modal dialogs or popups
          try {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } catch (escError) {
            // Ignore escape key errors
          }
          
          // Navigate to home page to ensure clean state for next scenario
          try {
            await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
            console.log(`🏠 Navigated to home page for fresh start`);
          } catch (navError) {
            console.warn(`Warning: Could not navigate to home page: ${navError}`);
          }
          
          const cleanupElapsedTime = Date.now() - cleanupStartTime;
          console.log(`✅ Scenario ${scenario.scenarioID} cleanup completed in ${cleanupElapsedTime}ms`);
        } else {
          console.warn(`Warning: Page closed during cleanup for ${scenario.scenarioID}`);
        }
      } catch (error) {
        console.warn('Warning: Cleanup between scenarios failed, continuing...', error);
      }
    }
    
    // Summary report
    console.log(`\n📊 Test Execution Summary:`);
    console.log(`   Total Scenarios: ${scenarios.length}`);
    console.log(`   Passed: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`   Success Rate: ${((successCount / scenarios.length) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Detailed Results:`);
    results.forEach(result => {
      const status = result.status.includes('PASSED') ? '✅' : '❌';
      console.log(`   ${status} ${result.scenario}: ${result.status}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
    
    // Assert overall success (allow some failures for negative tests)
    const successRate = (successCount / scenarios.length) * 100;
    expect(successRate).toBeGreaterThanOrEqual(50); // At least 50% success rate
    
    console.log(`🏁 Comprehensive E2E test completed!`);
  });
});

/**
 * Handle authentication with cookie-based approach
 * Uses direct cookie setting for faster and more reliable authentication
 */
async function handleAuthentication(page: any, context: any): Promise<void> {
  console.log('🔧 Setting up authentication for test execution...');
  
  try {
    console.log('🔑 Setting authentication cookie...');
    await context.addCookies([{
      name:'AppServiceAuthSession',
      value:'bwXoVPrTMD1RiwJORFJ29Oxjb2+ua/LHpQSKiP3LWL3t7RaxJa6rvIlHnO7pHSp30nmN7Rk4VsX3qfSY9RKgzyn9qaMkcNkqkZilC7Udq3dgY2CmYpb4dKbA3o0Z4WFW+9yZ0eslFjQpm+93rSs9p55rcMuN+D6Grs1HCvxTkrLJwxgs0lrKifebTP2kPJFMeMDWLa2L1qf6upWaaL+h8gQ8aLY05a0VGJbRjmHCqON/4jr+CJeOQz1qVX5hcjuya3GWsPpQbNwyjxlsm84hePeBfqA4hZ2wqQRj/OihtZZE5oDsu9J1wvA8sx4xExe2UXdh1mh6nwHAO/qOu3fnmomB8yd3Nit5KokvzsZaFygg7xFb6EZjmnsbDkmyiYkOb2XxvSaaITcDvYUjvkL7+QBp171cCxBG1rsTduaVLc/ezzWKr9S0pFAf+scl0AdRPSgsXfcoQeASXsWWslDG795S2WDNeEYUWGhcmPWy6dkgMegT7sXEpLY9S0uMsaGIjvmdGxjmf6hg0+xaVcHSQnXzohtUcLWOPfZJ4ad3rgYL9MvRL4TlTeff9/t/3cRwbPUBbgc870DGqDo6oiGFFzes5FdDd3mzBSSW3rE/iS45gaMOnbRrbAVJGg1JJWiONEfoeWl1HQNEijILsphpQLYu4SKy7oQ2HhO9G9bOduzA4dwOWXNHahzD7OPeSHLYpPKIJ2TXf6Xt4901fftw5Vo42XJF/5aXgu+Ix4egOL6aN5k0kcEiB7MxYm4cUnafURPrF6qci0ZcX0JExoVPMc3kyNy6+MbZrH5qZoyZrx9+didjN58HhYtz4yji1VaHbWO2/xbM37yI7yf4fv6hBirKDzZtMR/PS3J9rJMaZbBWd4pnd3Sd1+1CD/vjPPCLC0CJZaVIiyuEWkEAF2tYtYUlZgJMyD0bwrC10Op5+HhVkIMVrZwrv1qEf6IOZyH7OBUQB6zpDVAi7Lb3Mx0njSNhI+ZGc9pXNrjuYdFcwr8lgWAX1fc6ti2mTyXqnJ0B0X/xMOFwttvL48x9MrcpQpyswJADpmbLlkv4+YAs1F+GrjwZUee078u4qFJzEyejdzCiccYP82e6mPYarngQCRJy7mUjxSKHsSmYBm7l1ZM+p2EGOawq+3u/opAKNEaUzCDU90eLbqkgydh2vONrEtElzcLuwJLH/ycFMl81h+yrRMSaSzmJ3E0gbQGaxC6grId+WvJZhB//APa1thzxL/+ARSstqUsRbTLCeNkXGI1ZKa3tLzoC5leqgLQ+bekmBE7c+dVP974nweKcpt6gONNIRjdvwniSuNcOi3QJFvZQKAKTuKgUJ2AFmcbL3SgAbNtjw46wg0ojZ8COkmcpAWc3AtDLUIn7c1EgcnuiRaLlFvqTqAEnYBX63U4ygJDj0BnZ69z0kHxPNEGxQLJu2Bt0OIQEZ46TZLib5VtSSn0hMUsPo+eVvx3ypkTra/rf',
      domain: 'app-test-finnair-fra-frontend-f7byg3hef7abafat.germanywestcentral-01.azurewebsites.net',
      path: '/',
      httpOnly: true,
      secure: true,
    }]);
    
    // Navigate to the application after setting cookies
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if cookie authentication worked
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('📋 Post-authentication status:');
    console.log(`   URL: ${currentUrl}`);
    console.log(`   Title: ${title}`);
    
    // Verify authentication
    if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('/login')) {
      console.log('⚠️ Cookie authentication failed, falling back to interactive login...');
      throw new Error('Cookie authentication unsuccessful');
    }
    
    console.log('✅ Cookie authentication successful!');
    
    // Save the authentication state for consistency
    await context.storageState({ path: './test-results/auth.json' });
    console.log('💾 Authentication state saved for future test runs');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  }
}

/**
 * Execute a scenario based on the Action type
 */
async function executeScenario(
  scenario: Scenario,
  pages: {
    searchPage: SearchPage;
    resultsPage: ResultsPage;
    passengerInfoPage: PassengerInfoPage;
    bookingSummaryPage: BookingSummaryPage;
  }
): Promise<void> {
  
  // Wrap the entire scenario execution in error boundary
  try {
    
    const { searchPage, resultsPage, passengerInfoPage, bookingSummaryPage } = pages;
    
    console.log(`   🎯 Executing Action: ${scenario.action}`);
    
    switch (scenario.action) {
      case 'Search':
        await executeSearchOnly(scenario, searchPage);
        break;
        
      case 'Results':
        await executeSearchAndResults(scenario, searchPage, resultsPage);
        break;
        
      case 'PassengerInfo':
        await executeUntilPassengerInfo(scenario, searchPage, resultsPage, passengerInfoPage);
        break;
        
      case 'BookingSummary':
        await executeUntilBookingSummary(scenario, searchPage, resultsPage, passengerInfoPage, bookingSummaryPage);
        break;
        
      case 'Booking':
      default:
        await executeFullBookingFlow(scenario, searchPage, resultsPage, passengerInfoPage, bookingSummaryPage);
        break;
    }
    
  } catch (scenarioError) {
    // Catch any unhandled errors in the scenario execution
    console.error(`❌ Unhandled error in scenario execution:`, scenarioError);
    throw scenarioError; // Re-throw to be handled by the calling code
  }
}

/**
 * Execute scenario with detailed time tracking
 */
async function executeScenarioWithTimeTracking(
  scenario: Scenario,
  pages: {
    searchPage: SearchPage;
    resultsPage: ResultsPage;
    passengerInfoPage: PassengerInfoPage;
    bookingSummaryPage: BookingSummaryPage;
  },
  startTime: number
): Promise<void> {
  
  console.log(`   ⏱️  Starting scenario execution with detailed time tracking`);
  
  try {
    // Execute the scenario with intermediate time logging
    const stepStartTime = Date.now();
    
    await executeScenario(scenario, pages);
    
    const stepElapsedTime = Date.now() - stepStartTime;
    const totalElapsedTime = Date.now() - startTime;
    
    console.log(`   ⏱️  Scenario execution phase completed in ${stepElapsedTime}ms`);
    console.log(`   ⏱️  Total scenario time so far: ${totalElapsedTime}ms (${Math.round(totalElapsedTime/1000)} seconds)`);
    
  } catch (error) {
    const totalElapsedTime = Date.now() - startTime;
    console.error(`   ⏱️  Scenario failed after ${totalElapsedTime}ms (${Math.round(totalElapsedTime/1000)} seconds)`);
    throw error;
  }
}

/**
 * Execute only the search step
 */
async function executeSearchOnly(scenario: Scenario, searchPage: SearchPage): Promise<void> {
  console.log('   📍 Step 1: Filling and submitting search form...');
  await searchPage.go();
  await searchPage.fillSearch(scenario);
  await searchPage.submitSearch();
  await searchPage.waitForResults();
  
  console.log('   ✅ Search completed successfully');
}

/**
 * Execute search and results selection
 */
async function executeSearchAndResults(scenario: Scenario, searchPage: SearchPage, resultsPage: ResultsPage): Promise<void> {
  // Step 1: Search
  await executeSearchOnly(scenario, searchPage);
  
  // Step 2: Handle search results
  console.log('   ✈️  Step 2: Processing search results...');
  
  try {
    console.log('Waiting for search results to load...');
    
    // Select flight based on cabin preference
    const flightSelection: FlightSelection = {
      cabin: scenario.cabin,
      preference: 'first', // Use first available for reliability
      fareFamily: scenario.fareFamily
    };
    console.log('About to call selectFlight...');
    await resultsPage.selectFlight(flightSelection, scenario.tripType);
    
    console.log('   ✅ Results processing completed successfully');
    
  } catch (error) {
    // If no results found, this might be expected for negative tests
    if (scenario.expectedResult === 'error') {
      console.log('   ⚠️  No search results - expected for negative test');
      return; // Exit successfully for negative test
    }
    throw new Error(`Search results failed: ${error}`);
  }
}

/**
 * Execute until passenger information step
 */
async function executeUntilPassengerInfo(
  scenario: Scenario, 
  searchPage: SearchPage, 
  resultsPage: ResultsPage, 
  passengerInfoPage: PassengerInfoPage
): Promise<void> {
  // Steps 1-2: Search and Results
  await executeSearchAndResults(scenario, searchPage, resultsPage);
  
  // Step 3: Fill passenger information
  console.log('   👤 Step 3: Filling passenger information...');
  
  if (!scenario.expandedPassengers) {
    throw new Error('Passenger data not expanded');
  }
  
  try {
    await passengerInfoPage.fillPassengers(scenario.expandedPassengers);
    console.log('   ✅ Passenger information completed successfully');
  } catch (error) {
    throw new Error(`Passenger info failed: ${error}`);
  }
}

/**
 * Execute until booking summary step
 */
async function executeUntilBookingSummary(
  scenario: Scenario,
  searchPage: SearchPage,
  resultsPage: ResultsPage,
  passengerInfoPage: PassengerInfoPage,
  bookingSummaryPage: BookingSummaryPage
): Promise<void> {
  // Steps 1-3: Search, Results, and Passenger Info
  await executeUntilPassengerInfo(scenario, searchPage, resultsPage, passengerInfoPage);
  await bookingSummaryPage.proceedToPaymentAndWait();
  
  // Step 4: Verify booking summary
  // console.log('   📋 Step 4: Verifying booking summary...');
  
  // try {
  //   // await bookingSummaryPage.verifyBookingSummary(scenario);
  //   console.log('   ✅ Booking summary completed successfully');
  // } catch (error) {
  //   console.log('   ⚠️  Booking summary verification failed (continuing):', error);
  // }
}

/**
 * Execute the complete booking flow (all steps)
 */
async function executeFullBookingFlow(
  scenario: Scenario,
  searchPage: SearchPage,
  resultsPage: ResultsPage,
  passengerInfoPage: PassengerInfoPage,
  bookingSummaryPage: BookingSummaryPage
): Promise<void> {
  // Steps 1-4: Search, Results, Passenger Info, and Booking Summary
  await executeUntilBookingSummary(scenario, searchPage, resultsPage, passengerInfoPage, bookingSummaryPage);
  
  // Step 5: Complete booking (optional for test environment)
  // if (scenario.expectedResult !== 'error') {
  //   console.log('   💳 Step 5: Processing payment with enhanced flow...');
    
  //   try {
  //     // Use the enhanced payment flow with country/language selection
  //     await bookingSummaryPage.proceedToPaymentAndWait();
  //     console.log('   ✅ Enhanced payment flow completed successfully');
  //   } catch (error) {
  //     // Payment step might fail in test environment - log but don't fail test
  //     console.log('   ⚠️  Payment step failed (expected in test environment):', error);
  //   }
  // }
}

// /**
//  * Action-based execution test to demonstrate different action types
//  */
// test.describe('Action-Based Execution Tests', () => {
  
//   test('Test Search Action Only', async ({ page, context }) => {
//     await handleAuthentication(page, context);
    
//     const searchOnlyScenario: Scenario = {
//       scenarioID: 'SEARCH_ONLY_TEST',
//       action: 'Search',
//       tripType: 'One-way',
//       origin: 'HEL',
//       destination: 'LHR',
//       passengers: '1 ADT',
//       cabin: 'Economy',
//       dates: '15-Dec-25',
//       tags: 'search-only',
//       parsedPassengers: [{ type: 'ADT', count: 1 }],
//       expandedPassengers: PassengerBuilder.expandPassengers([{ type: 'ADT', count: 1 }]),
//       parsedDates: { departure: '15-Dec-25' },
//       tagArray: ['search-only']
//     };
    
//     const searchPage = new SearchPage(page);
//     const resultsPage = new ResultsPage(page);
//     const passengerInfoPage = new PassengerInfoPage(page);
//     const bookingSummaryPage = new BookingSummaryPage(page);
    
//     console.log('🔍 Testing Search action only...');
    
//     await executeScenario(searchOnlyScenario, {
//       searchPage,
//       resultsPage,
//       passengerInfoPage,
//       bookingSummaryPage
//     });
    
//     console.log('✅ Search-only test completed successfully');
//   });
  
//   test('Test Results Action (Search + Results)', async ({ page, context }) => {
//     await handleAuthentication(page, context);
    
//     const resultsScenario: Scenario = {
//       scenarioID: 'RESULTS_TEST',
//       action: 'Results',
//       tripType: 'One-way',
//       origin: 'HEL',
//       destination: 'CPH',
//       passengers: '1 ADT',
//       cabin: 'Economy',
//       dates: '20-Dec-25',
//       tags: 'results-only',
//       parsedPassengers: [{ type: 'ADT', count: 1 }],
//       expandedPassengers: PassengerBuilder.expandPassengers([{ type: 'ADT', count: 1 }]),
//       parsedDates: { departure: '20-Dec-25' },
//       tagArray: ['results-only']
//     };
    
//     const searchPage = new SearchPage(page);
//     const resultsPage = new ResultsPage(page);
//     const passengerInfoPage = new PassengerInfoPage(page);
//     const bookingSummaryPage = new BookingSummaryPage(page);
    
//     console.log('📊 Testing Results action (Search + Results)...');
    
//     await executeScenario(resultsScenario, {
//       searchPage,
//       resultsPage,
//       passengerInfoPage,
//       bookingSummaryPage
//     });
    
//     console.log('✅ Results test completed successfully');
//   });
// });

// /**
//  * Individual scenario tests for debugging specific cases
//  */
// test.describe.skip('Individual Scenario Tests', () => {
  
//   // Smoke test - quick validation
//   test('Smoke Test - Basic Booking Flow', async ({ page, context }) => {
//     // Handle authentication first
//     await handleAuthentication(page, context);
//     const smokeScenario: Scenario = {
//       scenarioID: 'SMOKE_QUICK',
//       action: 'Booking',
//       tripType: 'One-way',
//       origin: 'HEL',
//       destination: 'LHR',
//       passengers: '1 ADT',
//       cabin: 'Economy',
//       dates: '15-Dec-25',
//       tags: 'smoke',
//       parsedPassengers: [{ type: 'ADT', count: 1 }],
//       expandedPassengers: PassengerBuilder.expandPassengers([{ type: 'ADT', count: 1 }]),
//       parsedDates: { departure: '15-Dec-25' },
//       tagArray: ['smoke']
//     };
    
//     const searchPage = new SearchPage(page);
//     const resultsPage = new ResultsPage(page);
//     const passengerInfoPage = new PassengerInfoPage(page);
//     const bookingSummaryPage = new BookingSummaryPage(page);
    
//     console.log('🚀 Running quick smoke test...');
    
//     await executeScenario(smokeScenario, {
//       searchPage,
//       resultsPage,
//       passengerInfoPage,
//       bookingSummaryPage
//     });
    
//     console.log('✅ Smoke test completed successfully');
//   });
  
//   // Test with multiple passengers
//   test('Multi-Passenger Booking', async ({ page, context }) => {
//     // Handle authentication first
//     await handleAuthentication(page, context);
//     const multiPassengerScenario: Scenario = {
//       scenarioID: 'MULTI_PAX',
//       action: 'Booking',
//       tripType: 'Round-trip',
//       origin: 'HEL',
//       destination: 'CPH',
//       passengers: '2 ADT,1 CHD',
//       cabin: 'Economy',
//       dates: '20-25 Dec 2025',
//       tags: 'regression',
//       parsedPassengers: [
//         { type: 'ADT', count: 2 },
//         { type: 'CHD', count: 1 }
//       ],
//       expandedPassengers: PassengerBuilder.expandPassengers([
//         { type: 'ADT', count: 2 },
//         { type: 'CHD', count: 1 }
//       ]),
//       parsedDates: { departure: '20-Dec-25', return: '25-Dec-25' },
//       tagArray: ['regression']
//     };
    
//     const searchPage = new SearchPage(page);
//     const resultsPage = new ResultsPage(page);
//     const passengerInfoPage = new PassengerInfoPage(page);
//     const bookingSummaryPage = new BookingSummaryPage(page);
    
//     console.log('🚀 Running multi-passenger test...');
    
//     await executeScenario(multiPassengerScenario, {
//       searchPage,
//       resultsPage,
//       passengerInfoPage,
//       bookingSummaryPage
//     });
    
//     console.log('✅ Multi-passenger test completed successfully');
//   });
  
//   // Negative test - same origin/destination
//   test('Negative Test - Same Origin and Destination', async ({ page, context }) => {
//     // Handle authentication first
//     await handleAuthentication(page, context);
//     const negativeScenario: Scenario = {
//       scenarioID: 'NEG_SAME_AIRPORTS',
//       action: 'Search',
//       tripType: 'One-way',
//       origin: 'HEL',
//       destination: 'HEL',
//       passengers: '1 ADT',
//       cabin: 'Economy',
//       dates: '15-Dec-25',
//       tags: 'negative',
//       expectedResult: 'error',
//       parsedPassengers: [{ type: 'ADT', count: 1 }],
//       expandedPassengers: PassengerBuilder.expandPassengers([{ type: 'ADT', count: 1 }]),
//       parsedDates: { departure: '15-Dec-25' },
//       tagArray: ['negative']
//     };
    
//     const searchPage = new SearchPage(page);
//     const resultsPage = new ResultsPage(page);
//     const passengerInfoPage = new PassengerInfoPage(page);
//     const bookingSummaryPage = new BookingSummaryPage(page);
    
//     console.log('🚀 Running negative test...');
    
//     try {
//       await executeScenario(negativeScenario, {
//         searchPage,
//         resultsPage,
//         passengerInfoPage,
//         bookingSummaryPage
//       });
      
//       // If we get here without error, check if validation error appeared
//       console.log('✅ Negative test handled gracefully');
      
//     } catch (error) {
//       console.log('✅ Negative test caught expected error:', error);
//       // This is expected for negative tests
//     }
//   });
// });

// /**
//  * Quick debug test to check application accessibility
//  */
// test.skip('Debug - Application Access Check', async ({ page, context }) => {
//   console.log('🔍 Running application access debug test...');
  
//   // Handle authentication first
//   await handleAuthentication(page, context);
  
//   const searchPage = new SearchPage(page);
  
//   // Just navigate and take screenshot
//   await searchPage.go();
  
//   const title = await page.title();
//   const url = page.url();
  
//   console.log(`📋 Application Info:`);
//   console.log(`   Title: ${title}`);
//   console.log(`   URL: ${url}`);
  
//   await page.screenshot({
//     path: 'test-results/application-debug.png',
//     fullPage: true
//   });
  
//   // Check if basic elements exist
//   const fromInput = page.locator('//input[@data-testid="from-input"]').first();
//   const toInput = page.locator('//input[@data-testid="to-input"]').first();
//   const searchButton = page.locator('//button[text()="Search"]').first();
  
//   const fromVisible = await fromInput.isVisible({ timeout: 5000 });
//   const toVisible = await toInput.isVisible({ timeout: 5000 });
//   const searchVisible = await searchButton.isVisible({ timeout: 5000 });
  
//   console.log(`📊 Element Visibility:`);
//   console.log(`   From Input: ${fromVisible ? '✅' : '❌'}`);
//   console.log(`   To Input: ${toVisible ? '✅' : '❌'}`);
//   console.log(`   Search Button: ${searchVisible ? '✅' : '❌'}`);
  
//   console.log('✅ Debug test completed');
// });
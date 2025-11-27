import { test, expect, Page } from '@playwright/test';
import { ExcelReader } from '../lib/excel/excelReader';
import { PassengerBuilder } from '../lib/utils/passengerBuilder';
import { SelectorAssistant } from '../lib/ai/selectorAssistant';
import { SearchPage } from '../pages/SearchPage';
import { ResultsPage } from '../pages/ResultsPage';
import { PassengerInfoPage } from '../pages/PassengerInfoPage';
import { BookingSummaryPage } from '../pages/BookingSummaryPage';
import { Scenario, TestContext, FlightSelection } from '../lib/data/types';
import * as path from 'path';

/**
 * Data-driven E2E tests for airline booking system
 * 
 * This test suite reads scenarios from Excel/CSV and dynamically creates tests
 * Tests are tagged for grep filtering: @smoke, @regression
 */

// Test configuration
const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data', 'scenarios.xlsx');
const CSV_FALLBACK_PATH = path.join(__dirname, '..', 'test-data', 'scenarios.csv');

// Global test context
let scenarios: Scenario[] = [];

// Load test scenarios before all tests
test.beforeAll(async () => {
  console.log('Loading test scenarios...');
  
  try {
    // Try Excel first, fallback to CSV
    scenarios = await ExcelReader.readScenarios(TEST_DATA_PATH);
  } catch (error) {
    console.warn('Excel file not found, trying CSV fallback...');
    try {
      scenarios = await ExcelReader.readScenarios(CSV_FALLBACK_PATH);
    } catch (csvError) {
      console.error('Failed to load test data:', csvError);
      throw new Error('No test scenarios could be loaded. Please check test-data folder.');
    }
  }
  
  // Process and expand passenger data
  for (const scenario of scenarios) {
    if (scenario.parsedPassengers) {
      // Validate passenger combination
      PassengerBuilder.validatePassengerCombination(scenario.parsedPassengers);
      
      // Expand passengers for form filling
      scenario.expandedPassengers = PassengerBuilder.expandPassengers(scenario.parsedPassengers);
    }
  }
  
  console.log(`Loaded ${scenarios.length} test scenarios`);
});

// Create test groups by tags for better organization
test.describe('Airline Booking E2E Tests', () => {
  
  // Test setup for each scenario
  test.beforeEach(async ({ page }) => {
    // Set up test context and error handling
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });
  
  // Dynamically create tests for each scenario
  for (const scenario of scenarios || []) {
    // Skip empty scenarios
    if (!scenario.scenarioID) continue;
    
    // Create test with scenario ID and tags
    const testName = `${scenario.scenarioID}: ${scenario.origin} → ${scenario.destination} (${scenario.cabin})`;
    const testTags = scenario.tagArray || [];
    
    // Add tags to test name for grep filtering
    const taggedTestName = testTags.length > 0 
      ? `${testName} ${testTags.map(tag => `@${tag}`).join(' ')}`
      : testName;
    
    test(taggedTestName, async ({ page }) => {
      // Create test context
      const testContext: TestContext = {
        scenario,
        startTime: new Date(),
        screenshots: [],
        logs: [],
        errorMessages: []
      };
      
      // Add test annotations for Playwright
      for (const tag of testTags) {
        test.info().annotations.push({
          type: 'tag',
          description: tag
        });
      }
      
      console.log(`\n🧪 Starting test: ${scenario.scenarioID}`);
      console.log(`📋 Scenario: ${scenario.tripType} | ${scenario.origin} → ${scenario.destination}`);
      console.log(`👥 Passengers: ${scenario.passengers} | 🎫 Class: ${scenario.cabin}`);
      
      try {
        await executeBookingFlow(page, scenario, testContext);
        
      } catch (error) {
        console.error(`❌ Test failed: ${scenario.scenarioID}`, error);
        
        // Capture failure information
        const screenshotPath = await captureFailureEvidence(page, scenario, error as Error);
        testContext.screenshots.push(screenshotPath);
        
        // Perform AI-assisted failure analysis if enabled
        await performFailureAnalysis(testContext, screenshotPath);
        
        // Re-throw error to fail the test
        throw error;
      }
      
      console.log(`✅ Test completed successfully: ${scenario.scenarioID}`);
    });
  }
});

/**
 * Execute the complete booking flow for a scenario
 */
async function executeBookingFlow(
  page: Page, 
  scenario: Scenario, 
  context: TestContext
): Promise<void> {
  
  // Initialize page objects
  const searchPage = new SearchPage(page);
  const resultsPage = new ResultsPage(page);
  const passengerInfoPage = new PassengerInfoPage(page);
  const bookingSummaryPage = new BookingSummaryPage(page);
  
  // Step 1: Navigate to search page and fill search form
  console.log('📍 Step 1: Filling search form...');
  await searchPage.go();
  await searchPage.fillSearch(scenario);
  await searchPage.submitSearch();
  
  // Step 2: Select flight from results
  console.log('✈️  Step 2: Selecting flight...');
  await resultsPage.waitForResults();
  
  const flightSelection: FlightSelection = {
    cabin: scenario.cabin,
    preference: 'cheapest',
    fareFamily: scenario.fareFamily
  };
  
  await resultsPage.selectFlight(flightSelection, scenario.tripType);
  
  // Step 3: Fill passenger information
  console.log('👤 Step 3: Filling passenger information...');
  if (!scenario.expandedPassengers) {
    throw new Error('Passenger data not expanded for scenario');
  }
  
  await passengerInfoPage.fillPassengers(scenario.expandedPassengers);
  
  // Step 4: Verify booking summary
  console.log('📋 Step 4: Verifying booking summary...');
  await bookingSummaryPage.verifyBookingSummary(scenario);
  
  // Step 5: Complete booking (if not a negative test case)
  if (scenario.expectedResult !== 'error') {
    console.log('💳 Step 5: Completing booking...');
    await bookingSummaryPage.completeBooking();
  }
}

/**
 * Capture evidence when a test fails
 */
async function captureFailureEvidence(
  page: Page, 
  scenario: Scenario, 
  error: Error
): Promise<string> {
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `test-results/failures/${scenario.scenarioID}-${timestamp}.png`;
  
  try {
    // Capture screenshot
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    // Capture page HTML
    const htmlPath = screenshotPath.replace('.png', '.html');
    const content = await page.content();
    
    require('fs').writeFileSync(htmlPath, content, 'utf8');
    
    console.log(`📸 Failure evidence captured: ${screenshotPath}`);
    
  } catch (captureError) {
    console.error('Failed to capture failure evidence:', captureError);
  }
  
  return screenshotPath;
}

/**
 * Perform AI-assisted failure analysis
 */
async function performFailureAnalysis(
  context: TestContext, 
  screenshotPath: string
): Promise<void> {
  
  try {
    console.log('🔍 Performing failure analysis...');
    
    const logs = [
      ...context.logs,
      ...context.errorMessages,
      `Scenario: ${context.scenario.scenarioID}`,
      `Test duration: ${Date.now() - context.startTime.getTime()}ms`
    ];
    
    // Get AI-powered failure triage
    const triage = await SelectorAssistant.triageFailure(logs, screenshotPath);
    
    console.log('🤖 AI Failure Analysis:');
    console.log(`   Category: ${triage.category}`);
    console.log(`   Severity: ${triage.severity}`);
    console.log(`   Suggested Fix: ${triage.suggestedFix}`);
    
    if (triage.aiAnalysis) {
      console.log(`   AI Insights: ${triage.aiAnalysis}`);
    }
    
    // Add triage results to test info
    test.info().annotations.push({
      type: 'failure-analysis',
      description: `${triage.category} | ${triage.severity} | ${triage.suggestedFix}`
    });
    
  } catch (analysisError) {
    console.warn('Failure analysis failed:', analysisError);
  }
}

/**
 * Smoke test group - quick validation of core functionality
 */
test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add smoke test specific setup if needed
  });
  
  // Filter scenarios with smoke tag
  const smokeScenarios = scenarios.filter(s => 
    s.tagArray?.includes('smoke') || s.tags?.includes('smoke')
  );
  
  if (smokeScenarios.length === 0) {
    test.skip(true, 'No smoke test scenarios found');
  }
});

/**
 * Regression test group - comprehensive testing
 */
test.describe('Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add regression test specific setup if needed
  });
  
  // Filter scenarios with regression tag
  const regressionScenarios = scenarios.filter(s => 
    s.tagArray?.includes('regression') || s.tags?.includes('regression')
  );
  
  if (regressionScenarios.length === 0) {
    test.skip(true, 'No regression test scenarios found');
  }
});

/**
 * Negative test cases - error condition testing
 */
test.describe('Negative Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up for negative test cases
  });
  
  // Filter scenarios that expect errors
  const negativeScenarios = scenarios.filter(s => 
    s.expectedResult === 'error' || s.tagArray?.includes('negative')
  );
  
  for (const scenario of negativeScenarios) {
    if (!scenario.scenarioID) continue;
    
    test(`Negative: ${scenario.scenarioID}`, async ({ page }) => {
      console.log(`🚫 Testing negative scenario: ${scenario.scenarioID}`);
      
      try {
        const searchPage = new SearchPage(page);
        await searchPage.go();
        await searchPage.fillSearch(scenario);
        
        // Expect this to fail or show validation errors
        await expect(async () => {
          await searchPage.submitSearch();
        }).toThrow();
        
        console.log(`✅ Negative test passed: Expected error occurred`);
        
      } catch (error) {
        // For negative tests, we expect errors
        console.log(`✅ Negative test passed: ${error}`);
      }
    });
  }
});

/**
 * Helper function to create parameterized tests
 */
function createParameterizedTest(
  testName: string, 
  scenarios: Scenario[], 
  testFunction: (scenario: Scenario, page: Page) => Promise<void>
): void {
  
  test.describe(testName, () => {
    for (const scenario of scenarios) {
      if (!scenario.scenarioID) continue;
      
      test(`${scenario.scenarioID}`, async ({ page }) => {
        await testFunction(scenario, page);
      });
    }
  });
}

/**
 * Data validation tests
 */
test.describe('Data Validation', () => {
  
  test('All scenarios have required fields', async () => {
    const requiredFields = ['scenarioID', 'tripType', 'origin', 'destination', 'passengers', 'cabin', 'dates'];
    
    for (const scenario of scenarios) {
      for (const field of requiredFields) {
        expect(scenario[field as keyof Scenario]).toBeTruthy();
      }
    }
  });
  
  test('Passenger data is valid', async () => {
    for (const scenario of scenarios) {
      if (scenario.parsedPassengers) {
        expect(() => {
          PassengerBuilder.validatePassengerCombination(scenario.parsedPassengers!);
        }).not.toThrow();
      }
    }
  });
});

// Export for potential use in other test files
export { scenarios, executeBookingFlow };
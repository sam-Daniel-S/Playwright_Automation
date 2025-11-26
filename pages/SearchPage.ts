import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Scenario, SearchFormData, TripType, CabinClass } from '../lib/data/types';
import { PassengerBuilder } from '../lib/utils/passengerBuilder';

/**
 * Search Page Object for flight search functionality
 */
export class SearchPage extends BasePage {
  
  // Selectors based on existing locators file
  private readonly selectors = {
    // Trip type selectors
    oneWayTab: '//input[@data-testid="oneWay-radio"]',
    roundTripTab: '//input[@data-testid="roundTrip-radio"]',
    multiCityTab: '//input[@data-testid="multicity-radio"]',
    
    // Airport inputs
    fromAirportInput: '//input[@data-testid="from-input"]',
    toAirportInput: '//input[@data-testid="to-input"]',
    selectFromInput: "//div[@class='qmbogk7']//div[1]",
    selectToInput: "//div[@class='qmbogk7']//div[1]",
    airportSuggestions: '[data-testid="airport-suggestions"], .airport-dropdown, .autocomplete-dropdown',
    
    // Date inputs
    departureDateInput: '//input[@data-testid="travel-date"]',
    selectDateOneWay: '(//button[text()="15"])[2]',
    selectRoundTripDepartureDate: '(//button[text()="8"])[2]',
    selectRoundTripReturnDate: '(//button[text()="18"])[2]',
    
    // Class selection
    clickClassTypeDropdown: '(//div[@class="qmbogk0"]//div)[2]',
    selectClass_Eco: '(//span[text()="Economy"])[2]',
    selectClass_Bus: '//span[text()="Business"]',
    selectClass_First: '//span[text()="First Class"]',
    selectClass_PreEco: '//span[text()="Premium Economy"]',
    
    // Passenger selection
    passengersTypeDropdown: '((//label[text()="Passengers"])[1]/following::div)',
    selectPassenger_Adult: '//div[text()="Adult"]',
    selectPassenger_Child: '//div[text()="Child"]',
    selectPassenger_Infant: '//div[text()="Infant"]',
    addNewPassengers: '//button[text()="Add Passengers"]',
    passengerCountInput_Plus: "//button[text()='+']",
    passengerCountInput_Minus: '//button[text()="-"]',
    
    // Search button
    searchButton: '//button[text()="Search"]',
    
    // Error messages
    sameOriginDestinationError: "//p[text()='Departure and arrival locations must be different']",
    originError: "//p[text()='Please enter a valid departure location from the available options']",
  } as const;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the flight search page
   */
  async go(url?: string): Promise<void> {
    const searchUrl = url || '/'; // Use baseURL from playwright config
    await this.navigateTo(searchUrl);
    await this.waitForPageLoad();
    
    // Wait for search form to be visible
    await this.waitFor(this.selectors.fromAirportInput);
    
    console.log('Flight search page loaded successfully');
  }

  /**
   * Fill the search form with scenario data
   */
  async fillSearch(scenario: Scenario): Promise<void> {
    console.log(`Filling search form for scenario: ${scenario.scenarioID}`);
    
    try {
      // Close any popups that might interfere
      await this.closeInterferingPopups();
      
      // Select trip type
      await this.selectTripType(scenario.tripType);
      
      // Fill origin and destination
      await this.fillOriginDestination(scenario.origin, scenario.destination);
      
      // Select travel dates
      await this.selectDates(scenario);
      
      // Select cabin class
      await this.selectCabinClass(scenario.cabin);
      
      // Configure passengers
      await this.configurePassengers(scenario);
      
      console.log('Search form filled successfully');
      
    } catch (error) {
      console.error('Failed to fill search form:', error);
      await this.captureScreenshot('search-form-error');
      throw error;
    }
  }

  /**
   * Submit the search and wait for results
   */
  async submitSearch(): Promise<void> {
    console.log('Submitting flight search...');
    
    await this.clickWhenReady(this.selectors.searchButton);
    
    // Wait for search to process and results to load
    await this.page.waitForTimeout(2000);
    
    // Check for validation errors
    const hasErrors = await this.checkForValidationErrors();
    if (hasErrors) {
      throw new Error('Search validation failed - see captured errors');
    }
    
    console.log('Search submitted successfully');
  }

  /**
   * Select trip type (One-way, Round-trip)
   */
  private async selectTripType(tripType: TripType): Promise<void> {
    const selector = tripType === 'One-way' 
      ? this.selectors.oneWayTab 
      : this.selectors.roundTripTab;
    
    await this.clickWhenReady(selector);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill origin and destination airports
   */
  private async fillOriginDestination(origin: string, destination: string): Promise<void> {
    // Fill origin
    await this.fillAirportInput(this.selectors.fromAirportInput, origin);
    
    // Fill destination
    await this.fillAirportInput(this.selectors.toAirportInput, destination);
    
    // Validate not same
    if (origin.toLowerCase() === destination.toLowerCase()) {
      const errorVisible = await this.isVisible(this.selectors.sameOriginDestinationError);
      if (errorVisible) {
        throw new Error('Origin and destination cannot be the same');
      }
    }
  }

  /**
   * Fill individual airport input with autocomplete handling
   */
  private async fillAirportInput(selector: string, airportCode: string): Promise<void> {
    await this.fillInput(selector, airportCode);
    
    // Wait for suggestions to appear
    await this.page.waitForTimeout(1000);
    
    // Try to select from suggestions
    const suggestionSelectors = [
      `${this.selectors.airportSuggestions} >> text="${airportCode}"`,
      `${this.selectors.airportSuggestions} >> text*="${airportCode}"`,
      this.selectors.selectFromInput, // Fallback to first suggestion
    ];
    
    for (const suggestionSelector of suggestionSelectors) {
      try {
        if (await this.isVisible(suggestionSelector, 2000)) {
          await this.clickWhenReady(suggestionSelector);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Select travel dates based on trip type
   */
  private async selectDates(scenario: Scenario): Promise<void> {
    await this.clickWhenReady(this.selectors.departureDateInput);
    
    // Wait for calendar to open
    await this.page.waitForTimeout(1000);
    
    if (scenario.tripType === 'One-way') {
      await this.selectSingleDate(scenario.parsedDates?.departure || '15');
    } else {
      await this.selectDateRange(
        scenario.parsedDates?.departure || '8',
        scenario.parsedDates?.return || '18'
      );
    }
  }

  /**
   * Select single date for one-way trips
   */
  private async selectSingleDate(dayStr: string): Promise<void> {
    const day = this.extractDayFromDate(dayStr);
    const dateSelector = `(//button[text()="${day}"])[2]`;
    
    try {
      await this.clickWhenReady(dateSelector);
    } catch (error) {
      // Fallback to default date
      await this.clickWhenReady(this.selectors.selectDateOneWay);
    }
  }

  /**
   * Select date range for round-trip
   */
  private async selectDateRange(departureStr: string, returnStr: string): Promise<void> {
    const departureDay = this.extractDayFromDate(departureStr);
    const returnDay = this.extractDayFromDate(returnStr);
    
    try {
      // Select departure date
      const departureDateSelector = `(//button[text()="${departureDay}"])[2]`;
      await this.clickWhenReady(departureDateSelector);
      
      await this.page.waitForTimeout(500);
      
      // Select return date
      const returnDateSelector = `(//button[text()="${returnDay}"])[2]`;
      await this.clickWhenReady(returnDateSelector);
      
    } catch (error) {
      // Fallback to default dates
      await this.clickWhenReady(this.selectors.selectRoundTripDepartureDate);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.selectRoundTripReturnDate);
    }
  }

  /**
   * Extract day number from date string
   */
  private extractDayFromDate(dateStr: string): string {
    // Handle formats like "15-Nov-25" or "15/11/2025"
    const dayMatch = dateStr.match(/^(\d{1,2})/);
    return dayMatch ? dayMatch[1] : '15'; // Default fallback
  }

  /**
   * Select cabin class
   */
  private async selectCabinClass(cabin: CabinClass): Promise<void> {
    // Open the class dropdown
    await this.clickWhenReady(this.selectors.clickClassTypeDropdown);
    await this.page.waitForTimeout(500);
    
    if (cabin === 'Economy') {
      // For Economy, just open and close the dropdown since it's the default
      console.log('Economy is default - opening and closing dropdown');
      await this.clickWhenReady(this.selectors.clickClassTypeDropdown);
    } else {
      // For non-Economy classes, first deselect Economy then select the target class
      console.log(`Selecting ${cabin} class - deselecting Economy first`);
      
      // First click Economy to deselect it (if it's selected by default)
      try {
        await this.clickWhenReady(this.selectors.selectClass_Eco);
        await this.page.waitForTimeout(300);
      } catch (error) {
        console.log('Economy deselection not needed or failed, continuing...');
      }
      
      // Then select the target class
      let classSelector: string;
      switch (cabin) {
        case 'Premium':
          classSelector = this.selectors.selectClass_PreEco;
          break;
        case 'Business':
          classSelector = this.selectors.selectClass_Bus;
          break;
        case 'First':
          classSelector = this.selectors.selectClass_First;
          break;
        default:
          throw new Error(`Unknown cabin class: ${cabin}`);
      }
      
      await this.clickWhenReady(classSelector);
    }
    
    await this.page.waitForTimeout(300);
  }

  /**
   * Configure passengers based on scenario
   */
  private async configurePassengers(scenario: Scenario): Promise<void> {
    if (!scenario.parsedPassengers) {
      throw new Error('Passenger data not parsed');
    }
    
    // Open passenger dropdown
    await this.clickWhenReady(this.selectors.passengersTypeDropdown);
    await this.page.waitForTimeout(500);
    
    // Configure each passenger type
    for (const passengerCount of scenario.parsedPassengers) {
      await this.setPassengerCount(passengerCount.type, passengerCount.count);
    }
    
    // Close dropdown by clicking elsewhere
    await this.clickWhenReady(this.selectors.fromAirportInput);
  }

  /**
   * Set passenger count for specific type
   */
  private async setPassengerCount(type: 'ADT' | 'CHD' | 'INF', count: number): Promise<void> {
    // First select passenger type
    let typeSelector: string;
    switch (type) {
      case 'ADT':
        typeSelector = this.selectors.selectPassenger_Adult;
        break;
      case 'CHD':
        typeSelector = this.selectors.selectPassenger_Child;
        break;
      case 'INF':
        typeSelector = this.selectors.selectPassenger_Infant;
        break;
    }
    
    // Click to select passenger type
    await this.clickWhenReady(typeSelector);
    await this.page.waitForTimeout(300);
    
    // Adjust count using plus/minus buttons
    // Note: This is simplified - actual implementation depends on UI behavior
    for (let i = 1; i < count; i++) {
      await this.clickWhenReady(this.selectors.passengerCountInput_Plus);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Close interfering popups/overlays
   */
  private async closeInterferingPopups(): Promise<void> {
    const popupSelectors = [
      // '//div[@class="_1htdylg0"]//div[3]//button[2]', // Close recommendations
      // '//div[@class="_1htdylg0"]//div[3]//button[3]', // Close smart pad
      '//button[@title="Collapse sidebar"]', // Close sidebar
    ];
    
    for (const selector of popupSelectors) {
      try {
        if (await this.isVisible(selector, 2000)) {
          await this.clickWhenReady(selector);
          await this.page.waitForTimeout(500);
        }
      } catch (error) {
        // Popup not present or already closed
      }
    }
  }

  /**
   * Check for validation errors on the search form
   */
  private async checkForValidationErrors(): Promise<boolean> {
    const errorSelectors = [
      this.selectors.sameOriginDestinationError,
      this.selectors.originError,
      '[data-testid="error-message"]',
      '.error-message',
      '.validation-error'
    ];
    
    let hasErrors = false;
    
    for (const errorSelector of errorSelectors) {
      if (await this.isVisible(errorSelector, 1000)) {
        const errorText = await this.getText(errorSelector);
        console.error(`Validation error: ${errorText}`);
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      await this.captureScreenshot('validation-errors');
    }
    
    return hasErrors;
  }

  /**
   * Get search form data for validation
   */
  async getSearchFormData(): Promise<Partial<SearchFormData>> {
    const formData: Partial<SearchFormData> = {};
    
    try {
      // Get origin/destination values
      const originInput = this.locator(this.selectors.fromAirportInput);
      const destinationInput = this.locator(this.selectors.toAirportInput);
      
      formData.origin = await originInput.inputValue();
      formData.destination = await destinationInput.inputValue();
      
      return formData;
      
    } catch (error) {
      console.warn('Could not retrieve search form data:', error);
      return formData;
    }
  }
}
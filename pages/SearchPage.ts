import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Scenario, SearchFormData, TripType, CabinClass } from '../lib/data/types';
import { PassengerBuilder } from '../lib/utils/passengerBuilder';
import { FlightSearchLocators } from '../flightSearchLocators';

/**
 * Search Page Object for flight search functionality
 */
export class SearchPage extends BasePage {
  
  private readonly locators: FlightSearchLocators;
  
  // Selectors based on existing locators file
  private readonly selectors = {
    // Trip type selectors
    oneWayTab: '//input[@data-testid="oneWay-radio"]',
    roundTripTab: '//input[@data-testid="roundTrip-radio"]',
    multiCityTab: '//input[@data-testid="multicity-radio"]',
    
    // Airport inputs
    fromAirportInput: '//input[@data-testid="from-input"]',
    toAirportInput: '//input[@data-testid="to-input"]',
    selectFromInput: "//div[@class='qmbogk8']//div[1]",
    selectToInput: "//div[@class='qmbogk8']//div[1]",
    airportSuggestions: '[data-testid="airport-suggestions"], .airport-dropdown, .autocomplete-dropdown',
    
    // Date inputs
    departureDateInput: '//div[@data-testid="travel-date"]',
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
    
    // Optional promotional and loyalty fields
    promoCodeInput: '//input[@data-testid="promocode"]',
    discountCodeInput: '(//label[text()="Discount Code"]/following::input)[1]',
    loyaltyProgramInput: '(//label[text()="Loyalty Program"]/following::input)[1]',
    memberIdInput: '//label[text()="Member ID"]/following::input',
    
    // Error messages
    sameOriginDestinationError: "//p[text()='Departure and arrival locations must be different']",
    originError: "//p[text()='Please enter a valid departure location from the available options']",
  } as const;

  constructor(page: Page) {
    super(page);
    this.locators = new FlightSearchLocators(page);
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
      
      // Fill optional promotional and loyalty fields if specified
      await this.fillOptionalFields(scenario);
      
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
    await this.page.waitForTimeout(1000);
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
    
  }

  /**
   * Fill optional promotional and loyalty fields if specified in scenario
   */
  private async fillOptionalFields(scenario: Scenario): Promise<void> {
    console.log('Checking for optional promotional and loyalty fields...');
    
    try {
      // Fill Promo Code if specified
      if (scenario.promoCode && scenario.promoCode.trim()) {
        console.log(`Filling promo code: ${scenario.promoCode}`);
        if (await this.isVisible(this.selectors.promoCodeInput, 3000)) {
          await this.fillInput(this.selectors.promoCodeInput, scenario.promoCode);
          console.log('✅ Promo code filled successfully');
        } else {
          console.log('⚠️ Promo code field not found or not visible');
        }
      }
      
      // Fill Discount Code if specified
      if (scenario.discountCode && scenario.discountCode.trim()) {
        console.log(`Filling discount code: ${scenario.discountCode}`);
        if (await this.isVisible(this.selectors.discountCodeInput, 3000)) {
          await this.fillInput(this.selectors.discountCodeInput, scenario.discountCode);
          console.log('✅ Discount code filled successfully');
        } else {
          console.log('⚠️ Discount code field not found or not visible');
        }
      }
      
      // Fill Loyalty Program if specified
      if (scenario.loyaltyProgram && scenario.loyaltyProgram.trim()) {
        console.log(`Filling loyalty program: ${scenario.loyaltyProgram}`);
        if (await this.isVisible(this.selectors.loyaltyProgramInput, 3000)) {
          await this.fillInput(this.selectors.loyaltyProgramInput, scenario.loyaltyProgram);
          console.log('✅ Loyalty program filled successfully');
        } else {
          console.log('⚠️ Loyalty program field not found or not visible');
        }
      }
      
      // Fill Member ID if specified
      if (scenario.memberId && scenario.memberId.trim()) {
        console.log(`Filling member ID: ${scenario.memberId}`);
        if (await this.isVisible(this.selectors.memberIdInput, 3000)) {
          await this.fillInput(this.selectors.memberIdInput, scenario.memberId);
          console.log('✅ Member ID filled successfully');
        } else {
          console.log('⚠️ Member ID field not found or not visible');
        }
      }
      
      // If no optional fields were specified, log that
      if (!scenario.promoCode && !scenario.discountCode && !scenario.loyaltyProgram && !scenario.memberId) {
        console.log('ℹ️ No optional promotional or loyalty fields specified in scenario');
      }
      
    } catch (error) {
      console.error('❌ Error filling optional fields:', error);
      // Don't throw error - optional fields shouldn't break the flow
      console.log('⚠️ Continuing with search despite optional field errors');
    }
  }

  /**
   * Fill individual airport input with autocomplete handling
   */
  private async fillAirportInput(selector: string, airportCode: string): Promise<void> {
    await this.fillInput(selector, airportCode);
    
    // Wait for suggestions to appear
    await this.page.waitForTimeout(1000);
    
    // Determine which selection to use based on the input field
    const suggestionSelector = selector === this.selectors.fromAirportInput 
      ? this.selectors.selectFromInput 
      : this.selectors.selectToInput;
    
    // Click on the appropriate suggestion to close the dropdown
    await this.clickWhenReady(suggestionSelector);
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
    const dateSelector = `(//button[text()="${day}"])[1]`;
    
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
      const departureDateSelector = `(//button[text()="${departureDay}"])[1]`;
      await this.clickWhenReady(departureDateSelector);
      
      await this.page.waitForTimeout(500);
      
      // Select return date
      const returnDateSelector = `(//button[text()="${returnDay}"])[1]`;
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
   * Uses plus button for count increment, adds new slots only for different passenger types
   */
  private async configurePassengers(scenario: Scenario): Promise<void> {
    if (!scenario.parsedPassengers) {
      throw new Error('Passenger data not parsed');
    }
    
    console.log('Configuring passengers for search:', scenario.parsedPassengers);
    
    // Get passenger counts by type
    const adults = scenario.parsedPassengers.find(p => p.type === 'ADT')?.count || 0;
    const children = scenario.parsedPassengers.find(p => p.type === 'CHD')?.count || 0;
    const infants = scenario.parsedPassengers.find(p => p.type === 'INF')?.count || 0;
    
    console.log(`Passengers needed: ${adults} adults, ${children} children, ${infants} infants`);
    
    let currentSlot = 1;
    
    // Configure adults (slot 1 is adult by default)
    if (adults > 0) {
      console.log(`Setting ${adults} adults in slot ${currentSlot}`);
      if (adults > 1) {
        // Use plus button to increase adult count from default 1 to required count
        await this.increasePassengerCount(currentSlot, adults - 1);
      }
      // Adult type is already set by default, so no need to change dropdown
      currentSlot++;
    }
    
    // Add and configure children if needed
    if (children > 0) {
      console.log(`Adding and configuring ${children} children`);
      await this.locators.addNewPassengers.click();
      await this.page.waitForTimeout(1000);
      
      // Change passenger type to Child
      await this.setPassengerTypeInSlot(currentSlot, 'Child');
      
      // Increase count if more than 1 child
      if (children > 1) {
        await this.increasePassengerCount(currentSlot, children - 1);
      }
      currentSlot++;
    }
    
    // Add and configure infants if needed  
    if (infants > 0) {
      console.log(`Adding and configuring ${infants} infants`);
      await this.locators.addNewPassengers.click();
      await this.page.waitForTimeout(1000);
      
      // Change passenger type to Infant
      await this.setPassengerTypeInSlot(currentSlot, 'Infant');
      
      // Increase count if more than 1 infant
      if (infants > 1) {
        await this.increasePassengerCount(currentSlot, infants - 1);
      }
    }
    
    console.log('✅ Passenger configuration completed');
  }
  
  /**
   * Set passenger type for a specific slot (without changing count)
   */
  private async setPassengerTypeInSlot(slotNumber: number, passengerType: 'Adult' | 'Child' | 'Infant'): Promise<void> {
    try {
      console.log(`Setting passenger type in slot ${slotNumber} to ${passengerType}`);
      
      // Get the dropdown selector for the specific passenger slot
      let dropdownSelector;
      
      if (slotNumber === 1) {
        dropdownSelector = this.locators.PassengersDropDown;
      } else if (slotNumber === 2) {
        dropdownSelector = this.locators.passengersTypeDropdown_New;
      } else if (slotNumber === 3) {
        dropdownSelector = this.locators.passengersTypeDropdown_New_2;
      } else {
        // For additional passengers, use a dynamic selector
        dropdownSelector = this.page.locator(`((//label[text()="Passengers"])[${slotNumber}]/following::div)`).first();
      }
      
      // Click the dropdown for this passenger slot
      await dropdownSelector.click();
      await this.page.waitForTimeout(500);
      
      // Select the appropriate passenger type
      switch (passengerType) {
        case 'Adult':
          await this.locators.selectPassenger_Adult.click();
          break;
        case 'Child':
          await this.locators.selectPassenger_Child.click();
          break;
        case 'Infant':
          await this.locators.selectPassenger_Infant.click();
          break;
      }
      
      await this.page.waitForTimeout(500);
      console.log(`✅ Slot ${slotNumber} type set to ${passengerType}`);
      
    } catch (error) {
      console.error(`Failed to set passenger type in slot ${slotNumber} to ${passengerType}:`, error);
      throw error;
    }
  }
  
  /**
   * Increase passenger count in a specific slot using plus button
   */
  private async increasePassengerCount(slotNumber: number, increaseBy: number): Promise<void> {
    if (increaseBy <= 0) return;
    
    try {
      console.log(`Increasing passenger count in slot ${slotNumber} by ${increaseBy}`);
      
      // Get the appropriate plus button selector
      let plusButtonSelector;
      
      if (slotNumber === 1) {
        plusButtonSelector = this.locators.passengerCountInput_Plus_1;
      } else if (slotNumber === 2) {
        plusButtonSelector = this.locators.passengerCountInput_Plus_2;
      } else if (slotNumber === 3) {
        plusButtonSelector = this.locators.passengerCountInput_Plus_3;
      } else {
        // For additional passengers, use a dynamic plus button selector
        plusButtonSelector = this.page.locator(`(//button[text()="+"])[${slotNumber}]`).first();
      }
      
      // Click plus button the required number of times
      for (let i = 0; i < increaseBy; i++) {
        await plusButtonSelector.click();
        await this.page.waitForTimeout(300);
        console.log(`Plus clicked ${i + 1}/${increaseBy} for slot ${slotNumber}`);
      }
      
      console.log(`✅ Passenger count in slot ${slotNumber} increased by ${increaseBy}`);
      
    } catch (error) {
      console.error(`Failed to increase passenger count in slot ${slotNumber}:`, error);
      throw error;
    }
  }



  /**
   * Close interfering popups/overlays
   */
  private async closeInterferingPopups(): Promise<void> {
    const popupSelectors = [
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

   async verifySearchProcessed(): Promise<boolean> {
      console.log('Verifying search was processed - looking for Flights text');
  
      try {
        // Wait for the "Flights" text to be visible using the specific XPath
        const FlightsTextLocator = this.locators.verifySearchResultPage;
  
        // Wait up to 15 seconds for the Flights text to appear
        await FlightsTextLocator.waitFor({ state: 'visible', timeout: 15000 });
  
        // Get the text content to verify it contains "Flights"
        const FlightsText = await FlightsTextLocator.textContent();
  
        if (FlightsText) {
          console.info(`✅ Found Flights text: "${FlightsText}"`);
          return true;
        } else {
          throw new Error('Flights text is null or empty');
        }
  
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to get Flights text: ${errorMessage}`);
        
        // Take a screenshot for debugging
        await this.captureScreenshot('search-results-not-found');
        throw error;
      }
    }
  
    async waitForResults(): Promise<void> {
      console.log('Waiting for search results to load...');
      try {
        await this.verifySearchProcessed();
        await this.page.waitForTimeout(2000);
        console.info('✅ Search results loaded successfully');
      } catch (error) {
        console.error(`Failed to wait for results: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
}
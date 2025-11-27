import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { FlightSelection, CabinClass, TripType } from '../lib/data/types';
import { FlightSearchLocators } from '../flightSearchLocators';

/**
 * Results Page Object for flight search results and selection
 */
export class ResultsPage extends BasePage {

  private readonly locators: FlightSearchLocators;

  private readonly selectors = {
    // Page verification
    verifySearchResultPage: '//span[text()="Flights"]',

    // Flight selection by cabin class
    economyFlightCard: '//div[@data-testid="flight-result-economy-column-0"]//div[5]',
    businessFlightCard: '//div[@data-testid="flight-result-business-column-0"]//div[2]',
    priceForAdult : '(//div[text()="Price for 1 Adult"])[1]',

    // Continue button
    continueButton: "//button[text()='Continue']",
  } as const;

  constructor(page: Page) {
    super(page);
    this.locators = new FlightSearchLocators(page);
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
      
      // Additional wait to ensure page is stable
      await this.page.waitForTimeout(2000);
      console.info('✅ Search results loaded successfully');
    } catch (error) {
      console.error(`Failed to wait for results: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }


  async selectFlight(flightSelection?: FlightSelection, tripType?: TripType): Promise<void> {
    console.log('Select a flight from the flight results');

    try {
      console.log('Checking if flight selection element is visible...');

      
      
      // Check if the flight selection element is visible
      const isFlightVisible = await this.locators.verifySearchResultPage.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isFlightVisible) {
        console.info('✅ Found flight using original locator');
        await this.page.waitForTimeout(1000);
        switch (flightSelection?.cabin) {
          case 'Economy':
            await this.page.locator(this.selectors.priceForAdult).click();
            break;
          case 'Business':
            await this.page.locator(this.selectors.priceForAdult).click();
            break;
      }
      // await this.fareFamilySelection(flightSelection?.cabin!);
        console.log('✅ Outbound Flight Selected using original locator');
      } else {
        console.log('❌ Could not find flight selection element');
        
        // Take screenshot for debugging
        await this.captureScreenshot('flight-not-found');
        
        // Log current page URL and title for debugging
        console.error(`Current URL: ${this.page.url()}`);
        console.error(`Page title: ${await this.page.title()}`);
        
        throw new Error('Flight selection element not found');
      }

      // // Select fare family/cabin class if provided
      // if (flightSelection?.cabin) {
      //   await this.fareFamilySelection(flightSelection.cabin);
      // }

      // Continue to booking with trip type handling
      await this.continueToBooking(tripType);
      
    } catch (error) {
      console.error(`Failed to select flight: ${error instanceof Error ? error.message : String(error)}`);
      
      // Take screenshot on any error
      await this.captureScreenshot('flight-selection-error');
      throw error;
    }
  }

  async fareFamilySelection(cabinClass: CabinClass): Promise<void> {
    console.log(`Selecting fare family for cabin class: ${cabinClass}`);
    try {
      if (cabinClass === 'Economy') {
        await this.locators.selectEconomyCard.click();
        console.log('✅ Economy Flight Selected');
      }
      else if (cabinClass === 'Business') {
        await this.locators.selectBusinessCard.click();
        console.log('✅ Business Flight Selected');
      }
    } catch (error) {
      console.error(`Failed to select fare family: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async continueToBooking(tripType?: TripType): Promise<void> {
    console.log('Clicking Continue to proceed to booking');
    try {
      await this.locators.Click_Continue_FlightCard.click();
      console.log('✅ Clicked Continue to proceed to booking');
      
      // If it's a round trip, handle the inbound flight selection
      if (tripType === 'Round-trip') {
        console.log('Round trip detected - handling inbound flight selection');
        
        // Wait for 3 seconds after the first continue click
        await this.page.waitForTimeout(3000);
        console.log('Waited 3 seconds after inbound selection');
        
        // Click continue button again for the inbound flight
        await this.locators.Click_Continue_FlightCard.click();
        console.info('✅ Clicked Continue again for round trip inbound flight');
      }
    } catch (error) {
      console.error(`Failed to click Continue: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }


    
}
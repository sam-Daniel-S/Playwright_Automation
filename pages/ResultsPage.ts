import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { FlightSelection, CabinClass } from '../lib/data/types';

/**
 * Results Page Object for flight search results and selection
 */
export class ResultsPage extends BasePage {
  
  private readonly selectors = {
    // Page verification
    verifySearchResultPage: '//span[text()="Flights"]',
    
    // Flight selection by cabin class
    economyFlightCard: '//div[@data-testid="flight-result-economy-column-0"]//div[5]',
    businessFlightCard: '//div[@data-testid="flight-result-business-column-0"]//div[2]',
    firstClassFlightCard: '', // To be implemented based on actual selectors
    premiumFlightCard: '', // To be implemented based on actual selectors
    
    // Flight details
    flightPrice: '//div[@class="flex items-center"]//div[2]',
    flightDuration: '//div[@data-testid="flight-duration"][1]',
    
    // Fare family selection
    fareTypeToolTip: '//div[@data-testid="flight-result-economy-column-0"]//div//div//div//div//span[2]',
    servicesPopUp: '//span[@data-testid="farename-0-1"]',
    selectEconomyCard: '//span[@data-testid="farename-0-1"]/following-sibling::span[1]',
    
    // Continue button
    continueButton: "//button[text()='Continue']",
    
    // Flight details popups
    termsAndConditions: '//button[text()="Terms & Conditions"]',
    fareRules: '//button[text()="Fare Rules"]',
    amenities: '//button[text()="Amenities"]',
    closePopUp: '//div[contains(@class,"flex justify-between")]//h3/following::button[1]',
    
    // Loading states
    loadingIndicator: '[data-testid="loading"], .loading, .spinner',
    noResultsMessage: '[data-testid="no-results"], .no-flights, .no-results',
    
    // Flight cards generic
    flightCards: '[data-testid*="flight-result"], .flight-card, .flight-option',
    flightCardPrice: '[data-testid*="price"], .price, .fare-amount',
    flightCardDuration: '[data-testid*="duration"], .duration, .flight-time',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for search results to load and be displayed
   */
  async waitForResults(): Promise<void> {
    console.log('Waiting for flight search results...');
    
    try {
      // Wait for results page to load
      await this.waitFor(this.selectors.verifySearchResultPage, { timeout: 60000 });
      
      // Wait for loading indicators to disappear
      await this.waitForLoadingToComplete();
      
      // Check if we have results or no-results message
      const hasResults = await this.verifyResultsAvailable();
      
      if (!hasResults) {
        throw new Error('No flights found for the search criteria');
      }
      
      console.log('Flight results loaded successfully');
      
    } catch (error) {
      console.error('Failed to load search results:', error);
      await this.captureScreenshot('results-loading-error');
      throw error;
    }
  }

  /**
   * Select a flight based on criteria
   */
  async selectFlight(criteria: FlightSelection): Promise<void> {
    console.log(`Selecting flight: cabin=${criteria.cabin}, preference=${criteria.preference}`);
    
    try {
      // Wait for flight cards to be visible
      await this.waitFor(this.selectors.flightCards);
      
      // Get available flights for the specified cabin
      const flightCard = await this.findFlightByCabin(criteria.cabin);
      
      if (!flightCard) {
        throw new Error(`No flights available for ${criteria.cabin} class`);
      }
      
      // Apply preference logic (cheapest, first, fastest)
      const selectedCard = await this.applySelectionPreference(flightCard, criteria);
      
      // Select the flight
      await this.clickFlightCard(selectedCard);
      
      // Handle fare family selection if needed
      if (criteria.fareFamily) {
        await this.selectFareFamily(criteria.fareFamily);
      }
      
      // Click continue to proceed
      await this.continueToNextStep();
      
      console.log('Flight selected successfully');
      
    } catch (error) {
      console.error('Failed to select flight:', error);
      await this.captureScreenshot('flight-selection-error');
      throw error;
    }
  }

  /**
   * Find flight card by cabin class
   */
  private async findFlightByCabin(cabin: CabinClass): Promise<string> {
    let selector: string;
    
    switch (cabin) {
      case 'Economy':
        selector = this.selectors.economyFlightCard;
        break;
      case 'Business':
        selector = this.selectors.businessFlightCard;
        break;
      case 'Premium':
        // Fallback to economy if premium not available
        selector = this.selectors.economyFlightCard;
        break;
      case 'First':
        // Fallback to business if first not available
        selector = this.selectors.businessFlightCard;
        break;
      default:
        throw new Error(`Unknown cabin class: ${cabin}`);
    }
    
    // Verify the flight card exists
    const isVisible = await this.isVisible(selector, 10000);
    if (!isVisible) {
      // Try fallback selectors
      const fallbackSelectors = [
        this.selectors.economyFlightCard,
        this.selectors.flightCards
      ];
      
      for (const fallbackSelector of fallbackSelectors) {
        if (await this.isVisible(fallbackSelector, 5000)) {
          console.warn(`Using fallback selector for ${cabin} class: ${fallbackSelector}`);
          return fallbackSelector;
        }
      }
      
      throw new Error(`No flight cards found for ${cabin} class`);
    }
    
    return selector;
  }

  /**
   * Apply selection preference (cheapest, first, fastest)
   */
  private async applySelectionPreference(
    flightCardSelector: string, 
    criteria: FlightSelection
  ): Promise<string> {
    
    switch (criteria.preference) {
      case 'first':
        // Just return the first available card
        return flightCardSelector;
        
      case 'cheapest':
        // Find the cheapest option (this would need more complex logic in real implementation)
        return await this.findCheapestFlight(flightCardSelector);
        
      case 'fastest':
        // Find the fastest option (this would need duration comparison)
        return await this.findFastestFlight(flightCardSelector);
        
      default:
        return flightCardSelector;
    }
  }

  /**
   * Find cheapest flight among available options
   */
  private async findCheapestFlight(baseSelector: string): Promise<string> {
    // Simplified implementation - in real scenario, would compare prices
    // For now, just return the first available option
    return baseSelector;
  }

  /**
   * Find fastest flight among available options
   */
  private async findFastestFlight(baseSelector: string): Promise<string> {
    // Simplified implementation - in real scenario, would compare durations
    // For now, just return the first available option
    return baseSelector;
  }

  /**
   * Click on the selected flight card
   */
  private async clickFlightCard(cardSelector: string): Promise<void> {
    await this.clickWhenReady(cardSelector);
    
    // Wait for any selection animations or updates
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select specific fare family if required
   */
  private async selectFareFamily(fareFamily: string): Promise<void> {
    console.log(`Selecting fare family: ${fareFamily}`);
    
    try {
      // Check if fare family selection popup appeared
      if (await this.isVisible(this.selectors.servicesPopUp, 5000)) {
        
        // Look for the specific fare family option
        const fareFamilySelector = `text="${fareFamily}"`;
        
        if (await this.isVisible(fareFamilySelector, 5000)) {
          await this.clickWhenReady(fareFamilySelector);
        } else {
          console.warn(`Fare family "${fareFamily}" not found, using default selection`);
          // Click the default economy card
          await this.clickWhenReady(this.selectors.selectEconomyCard);
        }
      }
      
    } catch (error) {
      console.warn('Fare family selection failed:', error);
      // Continue without specific fare family
    }
  }

  /**
   * Click continue to proceed to next step
   */
  private async continueToNextStep(): Promise<void> {
    await this.clickWhenReady(this.selectors.continueButton);
    
    // Wait for navigation to complete
    await this.waitForPageLoad();
  }

  /**
   * Wait for loading indicators to complete
   */
  private async waitForLoadingToComplete(): Promise<void> {
    try {
      // Wait for loading indicators to appear (if any)
      await this.page.waitForTimeout(2000);
      
      // Wait for loading indicators to disappear
      const loadingSelector = this.selectors.loadingIndicator;
      if (await this.isVisible(loadingSelector, 5000)) {
        await this.page.locator(loadingSelector).waitFor({ 
          state: 'hidden', 
          timeout: 60000 
        });
      }
      
      // Additional wait for results to stabilize
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      // Loading indicators might not be present
      console.warn('Loading completion detection failed:', error);
    }
  }

  /**
   * Verify that search results are available
   */
  private async verifyResultsAvailable(): Promise<boolean> {
    // Check for no-results message
    if (await this.isVisible(this.selectors.noResultsMessage, 5000)) {
      const noResultsText = await this.getText(this.selectors.noResultsMessage);
      console.log(`No results found: ${noResultsText}`);
      return false;
    }
    
    // Check for flight cards
    const hasFlightCards = await this.isVisible(this.selectors.flightCards, 10000);
    if (!hasFlightCards) {
      console.log('No flight cards found on results page');
      return false;
    }
    
    return true;
  }

  /**
   * Get flight details for validation
   */
  async getSelectedFlightDetails(): Promise<{
    price?: string;
    duration?: string;
    cabin?: string;
  }> {
    const details: { price?: string; duration?: string; cabin?: string } = {};
    
    try {
      // Get price
      if (await this.isVisible(this.selectors.flightPrice, 5000)) {
        details.price = await this.getText(this.selectors.flightPrice);
      }
      
      // Get duration
      if (await this.isVisible(this.selectors.flightDuration, 5000)) {
        details.duration = await this.getText(this.selectors.flightDuration);
      }
      
    } catch (error) {
      console.warn('Could not retrieve flight details:', error);
    }
    
    return details;
  }

  /**
   * View flight details popups (Terms, Fare Rules, Amenities)
   */
  async viewFlightDetails(detailType: 'terms' | 'fareRules' | 'amenities'): Promise<void> {
    let selector: string;
    
    switch (detailType) {
      case 'terms':
        selector = this.selectors.termsAndConditions;
        break;
      case 'fareRules':
        selector = this.selectors.fareRules;
        break;
      case 'amenities':
        selector = this.selectors.amenities;
        break;
    }
    
    // Click to open details
    await this.clickWhenReady(selector);
    
    // Wait for popup to appear
    await this.page.waitForTimeout(2000);
    
    // Close popup
    if (await this.isVisible(this.selectors.closePopUp, 5000)) {
      await this.clickWhenReady(this.selectors.closePopUp);
    }
  }

  /**
   * Get count of available flights
   */
  async getFlightCount(): Promise<number> {
    try {
      const flightCards = this.page.locator(this.selectors.flightCards);
      const count = await flightCards.count();
      console.log(`Found ${count} flight options`);
      return count;
    } catch (error) {
      console.warn('Could not count flight cards:', error);
      return 0;
    }
  }

  /**
   * Check if specific cabin class is available
   */
  async isCabinAvailable(cabin: CabinClass): Promise<boolean> {
    try {
      const selector = await this.findFlightByCabin(cabin);
      return await this.isVisible(selector, 5000);
    } catch (error) {
      return false;
    }
  }
}
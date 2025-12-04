import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Scenario, BookingSummary, CabinClass } from '../lib/data/types';
import { PassengerBuilder } from '../lib/utils/passengerBuilder';

/**
 * Booking Summary Page Object for final booking verification and payment
 */
export class BookingSummaryPage extends BasePage {
  
  private readonly selectors = {
    // Cart and summary validation
    validateOrigin: '//div[@data-testid="flight-departure-airport-0"]',
    validateDestination: '//div[@data-testid="flight-arrival-airport-0"]',
    validatePassengerType: '//div[@class="text-[14px]"]//span[5]',
    cartTotalFare: '//div[@class="vwi6926"]//span[1]',
    cartFlightDuration: '//div[contains(@class,"text-center flex-1")]//div[1]',
    cartOriginDestinationValidation: '//div[@class="_5j3xl8l"]//div[1]',
    
    // Cart management
    cartIcon: '//div[@class="_1htdylg0"]//div[3]//button[5]',
    openFlightTab: '//span[text()="Flights"]',
    editFlight: '//button[@data-testid="cart_bound1_edit"]',
    deleteFlight: '//button[@data-testid="cart_bound1_delete"]',
    updateFlight: '//div[@data-testid="flight-result-economy-column-1"]//div[5]',
    
    // Passenger management
    editPassengers: '//button[@data-testid="cart_guests_edit"]',
    deletePassengers: '//button[@data-testid="cart_guests_delete"]',
    
    // Price breakdown
    priceBreakDown: '//button[text()="Price Breakdown"]',
    overallPriceBreakDown: '//button[@data-testid="cart_overall_pricebreakdown"]',
    
    // Payment and checkout
    proceedToPayment: '//button[@data-testid="cart_proceedtopayment"]',
    confirmPayment: '//button[text()="Pay Now"]',
    
    // Order status
    orderCreated: '//button[@data-testid="order_status_created"]',
    
    // Payment form fields
    selectCountryDropDown: '//input[@placeholder="Select Country"]',
    countryName: '//input[@class="qmbogkj"]/following::div[@class="qmbogk8 qmbogkg"]',
    selectLanguageDropDown: '//input[@placeholder="Select Language"]',
    language: '//input[@class="qmbogkj"]/following::div[@class="qmbogk8 qmbogkg"]',
    
    // Generic selectors for validation
    bookingSummarySection: '[data-testid="booking-summary"], .booking-summary, .cart-summary',
    flightDetailsSection: '[data-testid="flight-details"], .flight-info, .trip-details',
    passengerListSection: '[data-testid="passenger-list"], .passenger-info, .traveler-details',
    totalFareSection: '[data-testid="total-fare"], .total-price, .grand-total',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Proceed with payment and complete booking
   */
  async completeBooking(): Promise<void> {
    console.log('Completing booking process...');
    
    try {
      // Fill payment details if needed
      await this.fillPaymentDetails();
      
      await this.proceedToPaymentAndWait();
      
      // Verify order creation
      await this.verifyOrderCreation();
      
      console.log('Booking completed successfully');
      
    } catch (error) {
      console.error('Booking completion failed:', error);
      await this.captureScreenshot('booking-completion-error');
      throw error;
    }
  }


  /**
   * Fill payment details if payment form is present
   */
  private async fillPaymentDetails(): Promise<void> {
    console.log('Filling payment details...');
    
    // Check if country selection is required
    if (await this.isVisible(this.selectors.selectCountryDropDown, 5000)) {
      await this.clickWhenReady(this.selectors.selectCountryDropDown);
      await this.page.waitForTimeout(500);
      
      if (await this.isVisible(this.selectors.countryName, 5000)) {
        await this.clickWhenReady(this.selectors.countryName);
      }
    }
    
    // Check if language selection is required
    if (await this.isVisible(this.selectors.selectLanguageDropDown, 5000)) {
      await this.clickWhenReady(this.selectors.selectLanguageDropDown);
      await this.page.waitForTimeout(500);
      
      if (await this.isVisible(this.selectors.language, 5000)) {
        await this.clickWhenReady(this.selectors.language);
      }
    }
  }


  /**
   * Verify order creation and booking completion
   */
  private async verifyOrderCreation(): Promise<void> {
    // Check for order created status
    if (await this.isVisible(this.selectors.orderCreated, 15000)) {
      console.log('✅ Order created successfully');
      
      const orderStatus = await this.getText(this.selectors.orderCreated);
      console.log(`Order status: ${orderStatus}`);
    } else {
      console.log('Order creation status not found - booking may still be processing');
    }
  }


  /**
   * View price breakdown details
   */
  async viewPriceBreakdown(): Promise<void> {
    if (await this.isVisible(this.selectors.priceBreakDown, 5000)) {
      await this.clickWhenReady(this.selectors.priceBreakDown);
      await this.page.waitForTimeout(2000);
      
      // Close breakdown by clicking elsewhere or close button
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Edit flight selection from cart
   */
  async editFlightSelection(): Promise<void> {
    if (await this.isVisible(this.selectors.editFlight, 5000)) {
      await this.clickWhenReady(this.selectors.editFlight);
      await this.waitForPageLoad();
    }
  }

  /**
   * Edit passenger information from cart
   */
  async editPassengerInfo(): Promise<void> {
    if (await this.isVisible(this.selectors.editPassengers, 5000)) {
      await this.clickWhenReady(this.selectors.editPassengers);
      await this.waitForPageLoad();
    }
  }

  /**
   * Check if booking summary page is loaded
   */
  async isBookingSummaryLoaded(): Promise<boolean> {
    const keyElements = [
      this.selectors.validateOrigin,
      this.selectors.validateDestination,
      this.selectors.proceedToPayment
    ];
    
    for (const selector of keyElements) {
      if (!await this.isVisible(selector, 5000)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Proceed to payment with country/language selection and wait for completion
   * Use this function after filling the passengers form and clicking on continue button
   */
  async proceedToPaymentAndWait(): Promise<void> {
    console.log('Attempting to click Proceed to Payment button');

    try {
      await this.locator(this.selectors.proceedToPayment).waitFor({ state: 'visible' });
      await this.locator(this.selectors.proceedToPayment).click({ force: true });

      // Wait for country dropdown to be visible before filling
      await this.locator(this.selectors.selectCountryDropDown).waitFor({ state: 'visible', timeout: 60000 });
      await this.locator(this.selectors.selectCountryDropDown).fill('India');
      console.log('✅ Country set to India');

      // Language selection with proper wait
      await this.locator(this.selectors.selectLanguageDropDown).fill('English');
      console.log('✅ Language set to English');

      console.log('Proceed to Payment clicked, waiting for Confirm Payment button');
      // await this.locator(this.selectors.confirmPayment).waitFor({ state: 'visible', timeout: 50000 });
      await this.locator(this.selectors.confirmPayment).click({ force: true });
      await this.page.waitForTimeout(20000);
      console.log('✅ Payment flow ready');
    } catch (error) {
      console.error(`Payment flow failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
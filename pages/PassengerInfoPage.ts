import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Passenger, PassengerType } from '../lib/data/types';
import { FlightSearchLocators } from '../flightSearchLocators';

/**
 * Passenger Information Page Object for filling passenger details
 */
export class PassengerInfoPage extends BasePage {
  
  private readonly locators: FlightSearchLocators;
  
  private readonly selectors = {
    // Adult passenger form
    titleDropdown: '//div[@data-testid="guestdetails_title1"]',
    selectMrOption: '//div[text()="Mr"]',
    selectMsOption: '//div[text()="Ms"]',
    selectMrsOption: '//div[text()="Mrs"]',
    firstNameInput: '//input[@data-testid="guestdetails_firstname1"]',
    lastNameInput: '//input[@data-testid="guestdetails_lastname1"]',
    dobInput: '//div[@data-testid="guestdetails_dob1"]//input[1]',
    
    // Contact information
    contactPurpose: '//span[text()="Standard"]',
    deviceType: '//span[text()="Mobile"]',
    phoneExtensionDropdown: '//input[@data-testid="guestdetails_countrycode1"]',
    phoneExtension: '//div[text()="+91"]',
    contactInput: '//input[@data-testid="guestdetails_contactno1"]',
    emailInput: '//input[@data-testid="guestdetails_email1"]',
    
    // Address information
    streetInput: '//input[@data-testid="guestdetails_street1"]',
    cityInput: '//input[@data-testid="guestdetails_city1"]',
    stateInput: '//input[@data-testid="guestdetails_state1"]',
    countryDropdown: '//input[@data-testid="guestdetails_country1"]',
    selectCountry: '//div[text()="India"]',
    postalCodeInput: '//input[@data-testid="guestdetails_postalcode1"]',
    
    // Child passenger navigation and form
   
    childTitleDropdown: '//div[@data-testid="guestdetails_child_title1"]',
    childFirstNameInput: '//input[@data-testid="guestdetails_child_firstname1"]',
    childLastNameInput: '//input[@data-testid="guestdetails_child_lastname1"]',
    childDobInput: '//div[@data-testid="guestdetails_child_dob1"]//input[1]',
    
    // Infant passenger form
    infantTitleDropdown: '//div[@data-testid="guestdetails_infant_title1"]',
    infantFirstNameInput: '//input[@data-testid="guestdetails_infant_firstname1"]',
    infantLastNameInput: '//input[@data-testid="guestdetails_infant_lastname1"]',
    infantDobInput: '//div[@data-testid="guestdetails_infant_dob1"]//input[1]',
    infantAdultAssociationDropdown: '//div[@data-testid="guestdetails_infant_infantassocitation1"]',
    
    // Continue buttons
    continueButton: '//button[@data-testid="guestdetails_continuebtn"]',
    continueAdultInfantChildButton: '//button[@data-testid="guestdetails_child_continuebtn"]',
    
    // Form validation
    errorMessages: '[data-testid="error-message"], .error-message, .field-error, .validation-error',
    requiredFields: '[required], .required, [aria-required="true"]',
  } as const;

  constructor(page: Page) {
    super(page);
    this.locators = new FlightSearchLocators(page);
  }

  /**
   * Fill passenger information forms for all passengers
   */
  async fillPassengers(passengers: Passenger[]): Promise<void> {
    console.log(`Filling passenger information for ${passengers.length} passengers`);
    
    try {
      // Wait for passenger form to load
      await this.waitForPassengerFormLoad();
      
      // Fill passengers by type: Adults first, then Children, then Infants
      await this.fillAdultPassengers(passengers.filter(p => p.type === 'ADT'));
      await this.fillChildPassengers(passengers.filter(p => p.type === 'CHD'));
      await this.fillInfantPassengers(passengers.filter(p => p.type === 'INF'));
      
      // Continue to next step
      await this.continueToNextStep(passengers);
      
      console.log('Passenger information filled successfully');
      
    } catch (error) {
      console.error('Failed to fill passenger information:', error);
      await this.captureScreenshot('passenger-info-error');
      throw error;
    }
  }

  /**
   * Wait for passenger information form to load
   */
  private async waitForPassengerFormLoad(): Promise<void> {
    await this.waitFor(this.selectors.titleDropdown, { timeout: 30000 });
    
    // Wait for form to be fully interactive
    await this.page.waitForTimeout(2000);
  }

  /**
   * Fill adult passenger information for all adult forms
   */
  private async fillAdultPassengers(adults: Passenger[]): Promise<void> {
    if (adults.length === 0) return;
    
    console.log(`Filling ${adults.length} adult passenger(s)`);
    
    // Fill each adult passenger form
    for (let i = 0; i < adults.length; i++) {
      const adult = adults[i];
      const passengerNumber = i + 1;
      console.log(`Filling adult passenger ${passengerNumber}`);
      
      await this.fillAdultForm(adult, passengerNumber);
    }
  }

  /**
   * Fill adult passenger form with dynamic selectors
   */
  private async fillAdultForm(adult: Passenger, passengerNumber: number): Promise<void> {
    console.log(`Filling adult form ${passengerNumber}`);
    
    // Generate dynamic selectors for this passenger
    const titleDropdown = `//div[@data-testid="guestdetails_title${passengerNumber}"]`;
    const firstNameInput = `//input[@data-testid="guestdetails_firstname${passengerNumber}"]`;
    const lastNameInput = `//input[@data-testid="guestdetails_lastname${passengerNumber}"]`;
    const dobInput = `//div[@data-testid="guestdetails_dob${passengerNumber}"]//input[1]`;
    
    // Fill title
    await this.clickWhenReady(titleDropdown);
    await this.page.waitForTimeout(500);
    
    const titleSelector = adult.title === 'Ms' 
      ? this.selectors.selectMsOption 
      : adult.title === 'Mrs'
      ? this.selectors.selectMrsOption
      : this.selectors.selectMrOption;
    
    await this.clickWhenReady(titleSelector);
    
    // Fill name fields
    await this.fillInput(firstNameInput, adult.firstName);
    await this.fillInput(lastNameInput, adult.lastName);
    
    // Fill date of birth
    await this.fillInput(dobInput, adult.dateOfBirth);
    
    // Fill contact and address information for each adult passenger
    await this.fillContactInformation(adult, passengerNumber);
    await this.fillAddressInformation(passengerNumber);
    
    console.log(`✅ Adult passenger ${passengerNumber} form completed`);
  }

  /**
   * Fill contact information with dynamic selectors
   */
  private async fillContactInformation(passenger: Passenger, passengerNumber: number): Promise<void> {
    // Generate dynamic selectors
    const phoneExtensionDropdown = `//input[@data-testid="guestdetails_countrycode${passengerNumber}"]`;
    const contactInput = `//input[@data-testid="guestdetails_contactno${passengerNumber}"]`;
    const emailInput = `//input[@data-testid="guestdetails_email${passengerNumber}"]`;
    
    // Contact purpose (Standard)
    if (await this.isVisible(this.selectors.contactPurpose, 5000)) {
      await this.clickWhenReady(this.selectors.contactPurpose);
    }
    
    // Device type (Mobile)
    if (await this.isVisible(this.selectors.deviceType, 5000)) {
      await this.clickWhenReady(this.selectors.deviceType);
    }
    
    // Phone number country code
    if (await this.isVisible(phoneExtensionDropdown, 5000)) {
      await this.clickWhenReady(phoneExtensionDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.phoneExtension);
    }
    
    // Phone number
    const phoneNumber = this.generatePhoneNumber();
    await this.fillInput(contactInput, phoneNumber);
    
    // Email address
    const email = this.generateEmail(passenger.firstName, passenger.lastName);
    await this.fillInput(emailInput, email);
  }

  /**
   * Fill address information with dynamic selectors
   */
  private async fillAddressInformation(passengerNumber: number): Promise<void> {
    // Generate dynamic selectors
    const streetInput = `//input[@data-testid="guestdetails_street${passengerNumber}"]`;
    const cityInput = `//input[@data-testid="guestdetails_city${passengerNumber}"]`;
    const stateInput = `//input[@data-testid="guestdetails_state${passengerNumber}"]`;
    const countryDropdown = `//input[@data-testid="guestdetails_country${passengerNumber}"]`;
    const postalCodeInput = `//input[@data-testid="guestdetails_postalcode${passengerNumber}"]`;
    
    // Street address
    await this.fillInput(streetInput, '123 Test Street');
    
    // City
    await this.fillInput(cityInput, 'Test City');
    
    // State
    await this.fillInput(stateInput, 'Test State');
    
    // Country
    if (await this.isVisible(countryDropdown, 5000)) {
      await this.clickWhenReady(countryDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.selectCountry);
    }
    
    // Postal code
    await this.fillInput(postalCodeInput, '123456');
  }

  /**
   * Fill child passenger information
   */
  private async fillChildPassengers(children: Passenger[]): Promise<void> {
    if (children.length === 0) return;
    
    console.log(`Filling ${children.length} child passenger(s)`);
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      await this.fillSingleChildPassenger(child, i + 1);
    }
  }

  /**
   * Fill single child passenger form with dynamic selectors
   */
  private async fillSingleChildPassenger(child: Passenger, childNumber: number): Promise<void> {
    console.log(`Filling child passenger ${childNumber}`);
    
    // Generate dynamic selectors for this child
    const childTitleDropdown = `//div[@data-testid="guestdetails_child_title${childNumber}"]`;
    const childFirstNameInput = `//input[@data-testid="guestdetails_child_firstname${childNumber}"]`;
    const childLastNameInput = `//input[@data-testid="guestdetails_child_lastname${childNumber}"]`;
    const childDobInput = `//div[@data-testid="guestdetails_child_dob${childNumber}"]//input[1]`;
    
    
    // Navigate to child form if needed
    const childNavSelector = `//button[text()="Child ${childNumber}"]`;
    if (await this.isVisible(childNavSelector, 5000)) {
      await this.clickWhenReady(childNavSelector);
      await this.page.waitForTimeout(1000);
    }
    
    // Fill child title
    await this.clickWhenReady(childTitleDropdown);
    await this.page.waitForTimeout(500);
    
    const titleSelector = child.title === 'Ms' 
      ? this.selectors.selectMsOption 
      : this.selectors.selectMrOption;
    
    await this.clickWhenReady(titleSelector);
    
    // Fill child name and DOB
    await this.fillInput(childFirstNameInput, child.firstName);
    await this.fillInput(childLastNameInput, child.lastName);
    await this.fillInput(childDobInput, child.dateOfBirth);
    await this.page.keyboard.press('Enter');
    
    console.log(`✅ Child passenger ${childNumber} form completed`);
  }

  /**
   * Fill infant passenger information
   */
  private async fillInfantPassengers(infants: Passenger[]): Promise<void> {
    if (infants.length === 0) return;
    
    console.log(`Filling ${infants.length} infant passenger(s)`);
    
    for (let i = 0; i < infants.length; i++) {
      const infant = infants[i];
      await this.fillSingleInfantPassenger(infant, i + 1);
    }
  }

  /**
   * Fill single infant passenger form with dynamic selectors
   */
  private async fillSingleInfantPassenger(infant: Passenger, infantNumber: number): Promise<void> {
    console.log(`Filling infant passenger ${infantNumber}`);
    
    // Generate dynamic selectors for this infant
    const infantTitleDropdown = `//div[@data-testid="guestdetails_infant_title${infantNumber}"]`;
    const infantFirstNameInput = `//input[@data-testid="guestdetails_infant_firstname${infantNumber}"]`;
    const infantLastNameInput = `//input[@data-testid="guestdetails_infant_lastname${infantNumber}"]`;
    const infantAdultAssociationDropdown = `//div[@data-testid="guestdetails_infant_infantassocitation${infantNumber}"]`;
    const infantDobInput = `//div[@data-testid="guestdetails_infant_dob${infantNumber}"]//input[1]`;
    
    // Navigate to infant form if needed
    const infantNavSelector = `//button[text()="Infant ${infantNumber}"]`;
    if (await this.isVisible(infantNavSelector, 5000)) {
      await this.clickWhenReady(infantNavSelector);
      await this.page.waitForTimeout(1000);
    }
    
    // Fill infant title (typically Ms for female infants)
    if (await this.isVisible(infantTitleDropdown, 5000)) {
      await this.clickWhenReady(infantTitleDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.selectMsOption);
    }
    
    // Fill infant name and DOB
    await this.fillInput(infantFirstNameInput, infant.firstName);
    await this.fillInput(infantLastNameInput, infant.lastName);
    await this.fillInput(infantDobInput, infant.dateOfBirth);
    
    // Associate infant with adult passenger
    if (infant.associatedAdult && await this.isVisible(infantAdultAssociationDropdown, 5000)) {
      await this.clickWhenReady(infantAdultAssociationDropdown);
      await this.page.waitForTimeout(500);
      
      // Select the associated adult using dynamic selector based on infant number
      const adultAssociationSelector = `(//div[@class='qmbogk9 ']/following-sibling::div)[1]`;
      await this.clickWhenReady(adultAssociationSelector);
    }
    
    console.log(`✅ Infant passenger ${infantNumber} form completed`);
  }

  /**
   * Continue to next step after filling passenger information
   */
  private async continueToNextStep(passengers: Passenger[]): Promise<void> { 
    // Determine which continue button to use based on passenger types
    const hasChildren = passengers.some(p => p.type === 'CHD');
    const hasInfants = passengers.some(p => p.type === 'INF');
    
    const continueSelector = (hasChildren || hasInfants) 
      ? this.selectors.continueAdultInfantChildButton 
      : this.selectors.continueButton;
    
    await this.clickWhenReady(continueSelector);
    
    // Wait for navigation
    await this.waitForPageLoad();
  }

  /**
   * Generate test phone number
   */
  private generatePhoneNumber(): string {
    const prefix = '98765';
    const suffix = String(Math.floor(Math.random() * 90000) + 10000);
    return prefix + suffix;
  }

  /**
   * Generate test email address
   */
  private generateEmail(firstName: string, lastName: string): string {
    const domain = 'testmail.com';
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const timestamp = Date.now().toString().slice(-4);
    return `${username}${timestamp}@${domain}`;
  }
}
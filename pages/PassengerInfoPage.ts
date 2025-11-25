import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Passenger, PassengerType } from '../lib/data/types';

/**
 * Passenger Information Page Object for filling passenger details
 */
export class PassengerInfoPage extends BasePage {
  
  private readonly selectors = {
    // Adult passenger form
    titleDropdown: '//div[@data-testid="guestdetails_title1"]',
    selectMrOption: '//div[text()="Mr"]',
    selectMsOption: '//div[text()="Ms"]',
    selectMrsOption: '//div[text()="Mrs"]',
    firstNameInput: '//input[@data-testid="guestdetails_firstname1"]',
    lastNameInput: '//input[@data-testid="guestdetails_lastname1"]',
    dobInput: '//input[@placeholder="DD/MM/YYYY"]',
    
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
    navigateToChildPassenger: '//button[text()="Child 1"]',
    childTitleDropdown: '//div[@data-testid="guestdetails_child_title1"]',
    childFirstNameInput: '//input[@data-testid="guestdetails_child_firstname1"]',
    childLastNameInput: '//input[@data-testid="guestdetails_child_lastname1"]',
    childDobInput: '(//input[@placeholder="DD/MM/YYYY"])[2]',
    
    // Infant passenger form
    infantTitleDropdown: '//div[@data-testid="guestdetails_infant_title1"]',
    infantFirstNameInput: '//input[@data-testid="guestdetails_infant_firstname1"]',
    infantLastNameInput: '//input[@data-testid="guestdetails_infant_lastname1"]',
    infantDobInput: '(//input[@placeholder="DD/MM/YYYY"])[3]',
    infantAdultAssociationDropdown: '//div[@data-testid="guestdetails_infant_infantassocitation1"]',
    selectInfantAdultAssociation: '//div[text()="Select Adult Passenger"]/following-sibling::div',
    
    // Continue buttons
    continueButton: '//button[@data-testid="guestdetails_continuebtn"]',
    continueAdultInfantChildButton: '//button[@data-testid="guestdetails_child_continuebtn"]',
    
    // Form validation
    errorMessages: '[data-testid="error-message"], .error-message, .field-error, .validation-error',
    requiredFields: '[required], .required, [aria-required="true"]',
  } as const;

  constructor(page: Page) {
    super(page);
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
   * Fill adult passenger information
   */
  private async fillAdultPassengers(adults: Passenger[]): Promise<void> {
    if (adults.length === 0) return;
    
    console.log(`Filling ${adults.length} adult passenger(s)`);
    
    // Fill first adult (primary passenger)
    const primaryAdult = adults[0];
    await this.fillPrimaryAdultForm(primaryAdult);
    
    // Fill additional adults if any (would need to navigate to additional forms)
    for (let i = 1; i < adults.length; i++) {
      // Note: This would require navigation to additional adult forms
      // Implementation depends on UI behavior for multiple adults
      console.log(`Additional adult ${i + 1} would be filled here`);
    }
  }

  /**
   * Fill primary adult passenger form
   */
  private async fillPrimaryAdultForm(adult: Passenger): Promise<void> {
    // Fill title
    await this.clickWhenReady(this.selectors.titleDropdown);
    await this.page.waitForTimeout(500);
    
    const titleSelector = adult.title === 'Ms' 
      ? this.selectors.selectMsOption 
      : adult.title === 'Mrs'
      ? this.selectors.selectMrsOption
      : this.selectors.selectMrOption;
    
    await this.clickWhenReady(titleSelector);
    
    // Fill name fields
    await this.fillInput(this.selectors.firstNameInput, adult.firstName);
    await this.fillInput(this.selectors.lastNameInput, adult.lastName);
    
    // Fill date of birth
    await this.fillInput(this.selectors.dobInput, adult.dateOfBirth);
    
    // Fill contact information
    await this.fillContactInformation(adult);
    
    // Fill address information
    await this.fillAddressInformation();
  }

  /**
   * Fill contact information for primary passenger
   */
  private async fillContactInformation(passenger: Passenger): Promise<void> {
    // Contact purpose (Standard)
    if (await this.isVisible(this.selectors.contactPurpose, 5000)) {
      await this.clickWhenReady(this.selectors.contactPurpose);
    }
    
    // Device type (Mobile)
    if (await this.isVisible(this.selectors.deviceType, 5000)) {
      await this.clickWhenReady(this.selectors.deviceType);
    }
    
    // Phone number country code
    if (await this.isVisible(this.selectors.phoneExtensionDropdown, 5000)) {
      await this.clickWhenReady(this.selectors.phoneExtensionDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.phoneExtension);
    }
    
    // Phone number
    const phoneNumber = this.generatePhoneNumber();
    await this.fillInput(this.selectors.contactInput, phoneNumber);
    
    // Email address
    const email = this.generateEmail(passenger.firstName, passenger.lastName);
    await this.fillInput(this.selectors.emailInput, email);
  }

  /**
   * Fill address information
   */
  private async fillAddressInformation(): Promise<void> {
    // Street address
    await this.fillInput(this.selectors.streetInput, '123 Test Street');
    
    // City
    await this.fillInput(this.selectors.cityInput, 'Test City');
    
    // State
    await this.fillInput(this.selectors.stateInput, 'Test State');
    
    // Country
    if (await this.isVisible(this.selectors.countryDropdown, 5000)) {
      await this.clickWhenReady(this.selectors.countryDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.selectCountry);
    }
    
    // Postal code
    await this.fillInput(this.selectors.postalCodeInput, '123456');
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
   * Fill single child passenger form
   */
  private async fillSingleChildPassenger(child: Passenger, childNumber: number): Promise<void> {
    // Navigate to child form if not the first child
    if (childNumber > 1) {
      const childNavSelector = `//button[text()="Child ${childNumber}"]`;
      if (await this.isVisible(childNavSelector, 5000)) {
        await this.clickWhenReady(childNavSelector);
        await this.page.waitForTimeout(1000);
      }
    } else if (await this.isVisible(this.selectors.navigateToChildPassenger, 5000)) {
      await this.clickWhenReady(this.selectors.navigateToChildPassenger);
      await this.page.waitForTimeout(1000);
    }
    
    // Fill child title
    await this.clickWhenReady(this.selectors.childTitleDropdown);
    await this.page.waitForTimeout(500);
    
    const titleSelector = child.title === 'Ms' 
      ? this.selectors.selectMsOption 
      : this.selectors.selectMrOption;
    
    await this.clickWhenReady(titleSelector);
    
    // Fill child name and DOB
    await this.fillInput(this.selectors.childFirstNameInput, child.firstName);
    await this.fillInput(this.selectors.childLastNameInput, child.lastName);
    await this.fillInput(this.selectors.childDobInput, child.dateOfBirth);
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
   * Fill single infant passenger form
   */
  private async fillSingleInfantPassenger(infant: Passenger, infantNumber: number): Promise<void> {
    // Navigate to infant form if needed
    // This would depend on the specific UI implementation
    
    // Fill infant title (typically Ms for female infants)
    if (await this.isVisible(this.selectors.infantTitleDropdown, 5000)) {
      await this.clickWhenReady(this.selectors.infantTitleDropdown);
      await this.page.waitForTimeout(500);
      await this.clickWhenReady(this.selectors.selectMsOption);
    }
    
    // Fill infant name and DOB
    await this.fillInput(this.selectors.infantFirstNameInput, infant.firstName);
    await this.fillInput(this.selectors.infantLastNameInput, infant.lastName);
    await this.fillInput(this.selectors.infantDobInput, infant.dateOfBirth);
    
    // Associate infant with adult passenger
    if (infant.associatedAdult && await this.isVisible(this.selectors.infantAdultAssociationDropdown, 5000)) {
      await this.clickWhenReady(this.selectors.infantAdultAssociationDropdown);
      await this.page.waitForTimeout(500);
      
      // Select the associated adult (simplified - would need dynamic selector)
      await this.clickWhenReady(this.selectors.selectInfantAdultAssociation);
    }
  }

  /**
   * Continue to next step after filling passenger information
   */
  private async continueToNextStep(passengers: Passenger[]): Promise<void> {
    // Check for validation errors before continuing
    const hasErrors = await this.checkForValidationErrors();
    if (hasErrors) {
      throw new Error('Passenger form validation failed');
    }
    
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
   * Check for form validation errors
   */
  private async checkForValidationErrors(): Promise<boolean> {
    const errorSelector = this.selectors.errorMessages;
    
    if (await this.isVisible(errorSelector, 3000)) {
      const errorElements = this.page.locator(errorSelector);
      const errorCount = await errorElements.count();
      
      console.error(`Found ${errorCount} validation errors:`);
      
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.error(`- ${errorText}`);
      }
      
      await this.captureScreenshot('passenger-validation-errors');
      return true;
    }
    
    return false;
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

  /**
   * Validate required fields are filled
   */
  async validateRequiredFields(): Promise<boolean> {
    const requiredFields = this.page.locator(this.selectors.requiredFields);
    const count = await requiredFields.count();
    
    let allFilled = true;
    
    for (let i = 0; i < count; i++) {
      const field = requiredFields.nth(i);
      const value = await field.inputValue().catch(() => '');
      
      if (!value || value.trim().length === 0) {
        const fieldName = await field.getAttribute('data-testid') || await field.getAttribute('name') || `field-${i}`;
        console.error(`Required field not filled: ${fieldName}`);
        allFilled = false;
      }
    }
    
    return allFilled;
  }

  /**
   * Get current passenger form data for validation
   */
  async getPassengerFormData(): Promise<{
    primaryAdult?: Passenger;
    errors: string[];
  }> {
    const result = {
      primaryAdult: undefined as Passenger | undefined,
      errors: [] as string[]
    };
    
    try {
      // Try to read primary adult data
      const firstName = await this.locator(this.selectors.firstNameInput).inputValue().catch(() => '');
      const lastName = await this.locator(this.selectors.lastNameInput).inputValue().catch(() => '');
      const email = await this.locator(this.selectors.emailInput).inputValue().catch(() => '');
      
      if (firstName && lastName) {
        result.primaryAdult = {
          type: 'ADT',
          title: 'Mr', // Simplified
          firstName,
          lastName,
          dateOfBirth: '01/01/1990' // Placeholder
        };
      }
      
    } catch (error) {
      result.errors.push(`Failed to read form data: ${error}`);
    }
    
    return result;
  }
}
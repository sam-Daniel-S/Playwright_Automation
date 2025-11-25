import { Page, Locator } from '@playwright/test';


export class FlightSearchLocators{
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get closeRecommendations(): Locator{
    return this.page.locator('(//div[@class="_1htdylg0"]//div)[3]//button[2]').first();
  }

  get closeSmartPad() : Locator{
    return this.page.locator('(//div[@class="_1htdylg0"]//div)[3]//button[3]').first();
  }

  get closeSideBar() : Locator {
    return this.page.locator('//button[@title="Collapse sidebar"]').first();
  }
  
  get cartIcon() : Locator{
    return this.page.locator('(//div[@class="_1htdylg0"]//div)[3]//button[5]').first();
  }
  /// validation locators -------------------
  get validatePassengerType() : Locator{
    return this.page.locator('(//div[@class="text-[14px]"]//span)[5]').first();
  }

  get validateOrigin():Locator{
    return this.page.locator('//div[@data-testid="flight-departure-airport-0"]').first();
  }
  get validateDestination():Locator{
    return this.page.locator('//div[@data-testid="flight-arrival-airport-0"]').first();
  }

  get termsAndConditions() : Locator{
    return this.page.locator('//button[text()="Terms & Conditions"]').first();
  }
 
  get fareRules() : Locator{
    return this.page.locator('//button[text()="Fare Rules"]').first();
  }
 
  get amenities() : Locator{
    return this.page.locator('//button[text()="Amenities"]').first();
  }
 
  get servicesPopUp() : Locator {
    return this.page.locator ('//span[@data-testid="farename-0-1"]')
  }
 
  get closePopUp() : Locator{
    return this.page.locator('//div[contains(@class,"flex justify-between")]//h3/following::button[1]').first();
  }

  get fareTypeToolTip(): Locator{
    return this.page.locator('(//div[@data-testid="flight-result-economy-column-0"]//div//div//div//div//span[2])').first();
  }
 
  // get flightDetailsPopUp() : Locator{
  //   return this.page.locator('(//div[@class="relative tooltip-container"]//button)[1]').first();
  // }

  get editflight():Locator{
    return this.page.locator('//button[@data-testid="cart_bound1_edit"]').first();
  }
 
  get deleteflight():Locator{
    return this.page.locator('//button[@data-testid="cart_bound1_delete"]').first();
  }
 
  get openFlightTab():Locator{
    return this.page.locator('//span[text()="Flights"]').first();
  }

  get updateflight() : Locator{
    return this.page.locator('(//div[@data-testid="flight-result-economy-column-1"]//div)[5]').first();
  }

  get priceBreakDown() : Locator{
    return this.page.locator('//button[text()="Price Breakdown"]').first();
  }
 
  get overallPriceBreakDown() : Locator{
    return this.page.locator('//button[@data-testid="cart_overall_pricebreakdown"]').first();
  }

  get editPassengers(): Locator{
    return this.page.locator('//button[@data-testid="cart_guests_edit"]').first();
  }
 
  get deletePassengers() : Locator{
    return this.page.locator('//button[@data-testid="cart_guests_delete"]').first();
  }
  
  get flightPrice(): Locator{
    return this.page.locator('(//div[@class="flex items-center"]//div)[2]').first();
  }
 
  get cartTotalFare(): Locator{
    return this.page.locator('//div[@class="vwi6926"]//span[1]').first();
  }

  get flightDuration(): Locator{
    return this.page.locator('(//div[@data-testid="flight-duration"])[1]').first();
  }
 
  get cartFlightDuration(): Locator{
    return this.page.locator('(//div[contains(@class,"text-center flex-1")]//div)[1]').first();
  }
 
   get cartOriginDestinationValidation() : Locator{
    return this.page.locator('(//div[@class="_5j3xl8l"]//div)[1]').first();
  }
 
  get orderCreated() : Locator{
    return this.page.locator('//button[@data-testid="order_status_created"]').first();
  }
  
   //------------triptype------------------------
   get oneWayTab(): Locator{
    return this.page.locator('//input[@data-testid="oneWay-radio"]').first();   
   }

   get roundTripTab(): Locator{
    return this.page.locator('//input[@data-testid="roundTrip-radio"]').first();
   }

   get multiCityTab(): Locator {
    return this.page.locator('//input[@data-testid="multicity-radio"]').first();
  }

  //------------------searchpanel-------------------------
  get fromAirportInput(): Locator{
    return this.page.locator('//input[@data-testid="from-input"]').first();
  }

  get selectFromInput(): Locator{
    return this.page.locator("//div[@class='qmbogk7']//div[1]").first();
  }

//   get selectAirportInput(): Locator{
//     return this.page.locator('//input[@data-testid="from-input"]/following::button[@type="button"]').first();
//   } // --- After fixing filter on search pannel

  
  get toAirportInput(): Locator{
    return this.page.locator('//input[@data-testid="to-input"]').first();
  }

  get selectToInput(): Locator{
    return this.page.locator("//div[@class='qmbogk7']//div[1]").first();
  }

  get airportSuggestions(): Locator {
    return this.page.locator('[data-testid="airport-suggestions"], .airport-dropdown, .autocomplete-dropdown').first();
  }

  //Error locators for airport inputs
  get sameOriginDestinationErrorMessage(): Locator {
    return this.page.locator("//p[text()='Departure and arrival locations must be different']").first();
  }

  get OriginErrorMessage(): Locator {
    return this.page.locator("//p[text()='Please enter a valid departure location from the available options']").first();
  }

  // Date picker locators
  get departureDateInput(): Locator {
    return this.page.locator('//input[@data-testid="travel-date"]').first();
  }

  get selectCalendarTripType_Oneway(): Locator {
    return this.page.locator('//span[text()="One Way"]');
  }

  get selectCalendarTripType_RoundTrip(): Locator {
    return this.page.locator('//span[text()="Round Trip"]');
  }

  get selectDateOneWay(): Locator {
    return this.page.locator('(//button[text()="15"])[2]').first();
  }

  // Round trip date picker locators
  get roundTripDateInput(): Locator {
    return this.page.locator('//input[@value="22/12/2025 - 28/12/2025"] | //input[@data-testid="travel-date"]').first();
  }

  get selectRoundTripDepartureDate(): Locator {
    return this.page.locator('(//button[text()="8"])[2]').first();
  }

  get selectRoundTripReturnDate(): Locator {
    return this.page.locator('(//button[text()="18"])[2]').first();
  }

  // More flexible date selection locators
  get availableCalendarDates(): Locator {
    return this.page.locator('[data-testid*="calendar-day"]:not([disabled])');
  }

  // Class locators
  get clickClassTypeDropdown(): Locator {
    return this.page.locator('(//div[@class="qmbogk0"]//div)[2]').first();
  }

   get selectClass_Eco(): Locator {
    return this.page.locator('(//span[text()="Economy"])[2]').first();
  }
  
  get selectClass_Bus(): Locator {
    return this.page.locator('//span[text()="Business"]').first();
  }

  get selectClass_First(): Locator {
    return this.page.locator('//span[text()="First Class"]').first();
  }

  get selectClass_PreEco(): Locator {
    return this.page.locator('//span[text()="Premium Economy"]').first();
  }
  
 //passenger feilds
  get passengersTypeDropdown(): Locator {
    return this.page.locator('((//label[text()="Passengers"])[1]/following::div)').first();
  }

  get PassengersDropDown(): Locator {
    return this.page.locator('((//label[text()="Passengers"])[1]/following::div)').first();
  }

  get selectPassenger_Adult(): Locator {
    return this.page.locator('//div[text()="Adult"]').first();
  }

  get selectPassenger_Child(): Locator {
    return this.page.locator('//div[text()="Child"]').first();
  }

   get selectPassenger_Infant(): Locator {
    return this.page.locator('//div[text()="Infant"]').first();
  } 

  get addNewPassengers(): Locator {
    return this.page.locator('//button[text()="Add Passengers"]').first();
  } 

   get passengersTypeDropdown_New(): Locator {
    return this.page.locator('((//label[text()="Passengers"])[2]/following::div)').first();
  }

   get passengersTypeDropdown_New_2(): Locator {
    return this.page.locator('((//label[text()="Passengers"])[3]/following::div)').first();
  } 
  
  get passengerCountInput_Plus(): Locator {
    return this.page.locator("//button[text()='+']").first();
  }

  get passengerCountInput_Plus_1(): Locator {
    return this.page.locator('(//button[text()="+"])[1]').first();
  }
  
  get passengerCountInput_Plus_2(): Locator {
    return this.page.locator('(//button[text()="+"])[2]').first();
  }

  get passengerCountInput_Plus_3(): Locator {
    return this.page.locator('(//button[text()="+"])[3]').first();
  }

  get passengerCountInput_Minus(): Locator {
    return this.page.locator('//button[text()="-"]').first();
  }

  get passengerCountInput_Minus_1(): Locator {
    return this.page.locator('(//button[text()="−"])[1]').first();
  }
  
  get passengerCountInput_Minus_2(): Locator {
    return this.page.locator('(//button[text()="-"])[2]').first();
  }

  get passengerCountInput_Minus_3(): Locator {
    return this.page.locator('(//button[text()="-"])[3]').first();
  }
 
  // Search button
  get searchButton(): Locator {
    return this.page.locator('//button[text()="Search"]').first();
  }
 
  //to verify flight result received or not
  get verifySearchResultPage(): Locator {
    return this.page.locator('//span[text()="Flights"]').first();
  }

  get selectFlight(): Locator{
    return this.page.locator('(//div[@data-testid="flight-result-economy-column-0"]//div)[5]').first();
  }
  
  //continue button on flight result card 
  get Click_Continue_FlightCard(): Locator {
    return this.page.locator("//button[text()='Continue']").first();
  }

  //Form validation 
  get errorMessages(): Locator {
    return this.page.locator('[data-testid="error-message"], .error-message, .field-error, .validation-error');
  }

  get requiredFields(): Locator {
    return this.page.locator('[required], .required, [aria-required="true"]');
  }

  get continuePassengerDetails(): Locator{
    return this.page.locator('//button[@data-testid="guestdetails_continuebtn"]').first();
  }

  get continuePassengerDetailsAdult_Infant_Child(): Locator{
    return this.page.locator('//button[@data-testid="guestdetails_child_continuebtn"]').first();
  }
 
  get proceedToPayment(): Locator{
    return this.page.locator('//button[@data-testid="cart_proceedtopayment"]').first();
  }

  get ConfirmPayment(): Locator{
    return this.page.locator('//button[text()="Pay Now"]').first();
  }

  //Economy class 
  get selectEconomyCard(): Locator {
    return this.page.locator('//span[@data-testid="farename-0-1"]/following-sibling::span[1]').first();
  }

  //Business class
  get selectBusinessCard(): Locator{
    return this.page.locator('(//div[@data-testid="flight-result-business-column-0"]//div)[2]').first();
    // (//div[@data-testid='testid-fareoption-BUSINESS CLASSIC']//div)[1]
  }

  //First class 
  get selectFirstClassCard(): Locator{
    return this.page.locator('').first();
  }

   
  //Passenger Form 
   // Title selection locators
  get titleDropdown(): Locator {
    return this.page.locator('//div[@data-testid="guestdetails_title1"]').first();
  }

  get selectMrOption(): Locator {
    return this.page.locator('//div[text()="Mr"]').first();
  }

  get firstNameInput(): Locator {
    return this.page.locator('//input[@data-testid="guestdetails_firstname1"]').first();
  }

  get lastNameInput(): Locator{
    return this.page.locator('//input[@data-testid="guestdetails_lastname1"]').first();
  }

  get DOBInput(): Locator{
    return this.page.locator('//input[@placeholder="DD/MM/YYYY"]').first();
  }

  get contactPurpose() : Locator{
    return this.page.locator('//span[text()="Standard"]').first();
  }

  // get category(): Locator{
  //   return this.page.locator('//span[text()="Personal"]').first();
  // }

  get DeviceType() : Locator{
    return this.page.locator('//span[text()="Mobile"]').first();
  }

  get phNoExtensionDropDown():Locator{
    return this.page.locator('//input[@data-testid="guestdetails_countrycode1"]').first();
  }

  get phNoExtension():Locator{
    return this.page.locator('//div[text()="+91"]').first();
  }

  get contactInput():Locator{
    return this.page.locator('//input[@data-testid="guestdetails_contactno1"]').first();
  }

  get emailInput(): Locator{
    return this.page.locator('//input[@data-testid="guestdetails_email1"]').first();
  }

  get streetInput() : Locator{
    return this.page.locator('//input[@data-testid="guestdetails_street1"]').first();
  }

  get CityInput() : Locator{
    return this.page.locator('//input[@data-testid="guestdetails_city1"]').first();
  }

  get StateInput():Locator{
    return this.page.locator('//input[@data-testid="guestdetails_state1"]').first();
  }

  get countryDropDown() : Locator{
    return this.page.locator('//input[@data-testid="guestdetails_country1"]').first();
  }

  get selectCountry() : Locator{
    return this.page.locator('//div[text()="India"]').first();
  }

  get postalCodeInput() : Locator{
    return this.page.locator('//input[@data-testid="guestdetails_postalcode1"]').first();
  }

  get navigateToChildPassenger(): Locator {
    return this.page.locator('//button[text()="Child 1"]').first();
  }

  // Child passenger locators
  get childPassengerTitleDropdown(): Locator {
    return this.page.locator('//div[@data-testid="guestdetails_child_title1"]').first();
  }

  get selectChildTitleOption(): Locator {
    return this.page.locator('//div[text()="Mr"]').first();
  }

  get childFirstNameInput(): Locator {
    return this.page.locator('//input[@data-testid="guestdetails_child_firstname1"]').first();
  }

  get childLastNameInput(): Locator{
    return this.page.locator('//input[@data-testid="guestdetails_child_lastname1"]').first();
  }

  get childDOBInput(): Locator{
    return this.page.locator('(//input[@placeholder="DD/MM/YYYY"])[2]').first();
  }
   
  // infant

  get InfantTitleDropDown(): Locator {
    return this.page.locator('//div[@data-testid="guestdetails_infant_title1"]').first();
  }

    get selectInfantTitleOption(): Locator {
    return this.page.locator('//div[text()="Ms"]').first();
  }

  get InfantFirstNameInput(): Locator{
    return this.page.locator('//input[@data-testid="guestdetails_infant_firstname1"]').first();
  }

  get InfantLastNameInput(): Locator{
    return this.page.locator('//input[@data-testid="guestdetails_infant_lastname1"]').first();
  }

  get InfantDOBInput(): Locator{
    return this.page.locator('(//input[@placeholder="DD/MM/YYYY"])[3]').first();
  }

  get InfantAdultAssociationDropDown(): Locator{
    return this.page.locator('//div[@data-testid="guestdetails_infant_infantassocitation1"]').first();
  }

  get SelectInfantAdultAssociation(): Locator{
    return this.page.locator('//div[text()="Select Adult Passenger"]/following-sibling::div').first();
  }

  //-----------payment screen ---------------------

  get SelectCountryDropDown(): Locator{
    return this.page.locator('//input[@placeholder="Select Country"]').first();
  }

  get CountryName(): Locator{
    return this.page.locator('//input[@class="qmbogkj"]/following::div[@class="qmbogk8 qmbogkg"]').first();
  }

  get SelectlanguageDropDown(): Locator{
    return this.page.locator('//input[@placeholder="Select Language"]')
  }

  get Language(): Locator{
    return this.page.locator('//input[@class="qmbogkj"]/following::div[@class="qmbogk8 qmbogkg"]').first();
  }
}
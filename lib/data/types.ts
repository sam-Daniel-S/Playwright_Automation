/**
 * Core data types for the airline booking E2E framework
 */

export type TripType = 'One-way' | 'Round-trip';
export type CabinClass = 'Economy' | 'Premium' | 'Business' | 'First';
export type PassengerType = 'ADT' | 'CHD' | 'INF'; // Adult, Child, Infant
export type ActionType = 'Booking' | 'Search' | 'Results' | 'PassengerInfo' | 'BookingSummary';

/**
 * Passenger count by type from scenario data
 */
export interface PassengerCount {
  type: PassengerType;
  count: number;
}

/**
 * Individual passenger instance for form filling
 */
export interface Passenger {
  type: PassengerType;
  title: 'Mr' | 'Ms' | 'Mrs';
  firstName: string;
  lastName: string;
  dateOfBirth: string; // DD/MM/YYYY format
  associatedAdult?: string; // For infants - name of associated adult
}

/**
 * Date range for travel
 */
export interface TravelDates {
  departure: string; // DD-MMM-YY format
  return?: string;   // Optional for round-trip
}

/**
 * Main scenario data structure matching Excel columns
 */
export interface Scenario {
  scenarioID: string;
  action: ActionType; // Determines which steps to execute
  tripType: TripType;
  origin: string;
  destination: string;
  passengers: string; // Raw string like "3 ADT,1 CHD,1 INF"
  cabin: CabinClass;
  fareFamily?: string;
  dates: string; // Raw string like "15-Nov-25" or "20-23 Nov 2025"
  tags: string; // Comma-separated tags
  expectedResult?: string;
  timeout?: number; // Timeout in milliseconds for this specific scenario
  
  // Optional promotional and loyalty fields
  promoCode?: string;
  discountCode?: string;
  loyaltyProgram?: string;
  memberId?: string;
  
  // Parsed fields (populated by data processor)
  parsedPassengers?: PassengerCount[];
  expandedPassengers?: Passenger[];
  parsedDates?: TravelDates;
  tagArray?: string[];
}

/**
 * Flight selection criteria
 */
export interface FlightSelection {
  cabin: CabinClass;
  preference: 'cheapest' | 'first' | 'fastest';
  fareFamily?: string;
}

/**
 * Search form data
 */
export interface SearchFormData {
  tripType: TripType;
  origin: string;
  destination: string;
  passengerCounts: PassengerCount[];
  cabin: CabinClass;
  dates: TravelDates;
}

/**
 * Booking summary validation data
 */
export interface BookingSummary {
  origin: string;
  destination: string;
  cabin: CabinClass;
  passengerCount: number;
  totalFare?: string;
  flightDuration?: string;
}

/**
 * AI Assistant types for future integration
 */
export interface SelectorSuggestion {
  selector: string;
  confidence: number;
  reasoning: string;
}

export interface FailureTriage {
  category: 'selector' | 'timing' | 'data' | 'network' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
  aiAnalysis?: string; // Populated when AI_ENABLED=true
}

/**
 * Test execution context
 */
export interface TestContext {
  scenario: Scenario;
  startTime: Date;
  screenshots: string[];
  logs: string[];
  errorMessages: string[];
}
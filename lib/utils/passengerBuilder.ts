import { PassengerCount, Passenger, PassengerType } from '../data/types';

/**
 * Utility for building and expanding passenger data for form filling
 */
export class PassengerBuilder {
  
  /**
   * Parse passenger string into PassengerCount array
   * @param passengerStr String like "3 ADT,1 CHD,1 INF"
   * @returns Array of passenger counts by type
   */
  static parsePassengerString(passengerStr: string): PassengerCount[] {
    const parts = passengerStr.split(',').map(p => p.trim());
    const result: PassengerCount[] = [];
    
    for (const part of parts) {
      const match = part.match(/^(\d+)\s*(ADT|CHD|INF|Adult|Child|Infant)$/i);
      
      if (!match) {
        throw new Error(`Invalid passenger format: ${part}. Expected format: "3 ADT" or "1 CHD"`);
      }
      
      const count = parseInt(match[1]);
      const typeStr = match[2].toUpperCase();
      
      let type: PassengerType;
      if (typeStr === 'ADT' || typeStr === 'ADULT') type = 'ADT';
      else if (typeStr === 'CHD' || typeStr === 'CHILD') type = 'CHD';
      else if (typeStr === 'INF' || typeStr === 'INFANT') type = 'INF';
      else throw new Error(`Invalid passenger type: ${typeStr}`);
      
      result.push({ type, count });
    }
    
    return result;
  }
  
  /**
   * Expand passenger counts into individual passenger instances for form filling
   * @param passengerCounts Array of passenger counts by type
   * @returns Array of individual passenger objects with placeholder data
   */
  static expandPassengers(passengerCounts: PassengerCount[]): Passenger[] {
    const passengers: Passenger[] = [];
    let adultCounter = 1;
    let childCounter = 1;
    let infantCounter = 1;
    
    // Process adults first (required for infant associations)
    const adultNames: string[] = [];
    
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'ADT') {
        for (let i = 0; i < passengerCount.count; i++) {
          const firstName = `Adult${adultCounter}`;
          const lastName = `Test`;
          
          passengers.push({
            type: 'ADT',
            title: 'Mr',
            firstName,
            lastName,
            dateOfBirth: this.generateDateOfBirth('ADT'),
          });
          
          adultNames.push(`${firstName} ${lastName}`);
          adultCounter++;
        }
      }
    }
    
    // Process children
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'CHD') {
        for (let i = 0; i < passengerCount.count; i++) {
          passengers.push({
            type: 'CHD',
            title: 'Mr',
            firstName: `Child${childCounter}`,
            lastName: 'Test',
            dateOfBirth: this.generateDateOfBirth('CHD'),
          });
          childCounter++;
        }
      }
    }
    
    // Process infants (associate with adults)
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'INF') {
        for (let i = 0; i < passengerCount.count; i++) {
          // Associate infant with available adult (round-robin if multiple infants)
          const associatedAdult = adultNames[(infantCounter - 1) % adultNames.length] || '';
          
          passengers.push({
            type: 'INF',
            title: 'Ms',
            firstName: `Infant${infantCounter}`,
            lastName: 'Test',
            dateOfBirth: this.generateDateOfBirth('INF'),
            associatedAdult,
          });
          infantCounter++;
        }
      }
    }
    
    return passengers;
  }
  
  /**
   * Generate appropriate date of birth based on passenger type
   * @param type Passenger type (ADT, CHD, INF)
   * @returns Date of birth in DD/MM/YYYY format
   */
  private static generateDateOfBirth(type: PassengerType): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    let birthYear: number;
    
    switch (type) {
      case 'ADT':
        // Adults: 18-65 years old
        birthYear = currentYear - Math.floor(Math.random() * (65 - 18)) - 18;
        break;
      case 'CHD':
        // Children: 2-17 years old
        birthYear = currentYear - Math.floor(Math.random() * (17 - 2)) - 2;
        break;
      case 'INF':
        // Infants: 0-23 months old
        birthYear = currentYear - 1; // 1 year old for simplicity
        break;
      default:
        throw new Error(`Unknown passenger type: ${type}`);
    }
    
    // Generate random month and day
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-specific day issues
    
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${birthYear}`;
  }
  
  /**
   * Get total passenger count across all types
   * @param passengerCounts Array of passenger counts
   * @returns Total number of passengers
   */
  static getTotalPassengerCount(passengerCounts: PassengerCount[]): number {
    return passengerCounts.reduce((total, pc) => total + pc.count, 0);
  }
  
  /**
   * Get passenger count by specific type
   * @param passengerCounts Array of passenger counts
   * @param type Passenger type to count
   * @returns Count of passengers of specified type
   */
  static getPassengerCountByType(passengerCounts: PassengerCount[], type: PassengerType): number {
    const found = passengerCounts.find(pc => pc.type === type);
    return found ? found.count : 0;
  }
  
  /**
   * Validate passenger combination rules
   * @param passengerCounts Array of passenger counts
   * @throws Error if passenger combination is invalid
   */
  static validatePassengerCombination(passengerCounts: PassengerCount[]): void {
    const adultCount = this.getPassengerCountByType(passengerCounts, 'ADT');
    const childCount = this.getPassengerCountByType(passengerCounts, 'CHD');
    const infantCount = this.getPassengerCountByType(passengerCounts, 'INF');
    
    // Must have at least one adult if there are children or infants
    if ((childCount > 0 || infantCount > 0) && adultCount === 0) {
      throw new Error('At least one adult is required when traveling with children or infants');
    }
    
    // Infants cannot exceed adults (one infant per adult)
    if (infantCount > adultCount) {
      throw new Error(`Cannot have more infants (${infantCount}) than adults (${adultCount})`);
    }
    
    // Maximum passenger limit (typical airline limit)
    const totalPassengers = adultCount + childCount + infantCount;
    if (totalPassengers > 9) {
      throw new Error(`Maximum 9 passengers allowed, got ${totalPassengers}`);
    }
    
    // Minimum one passenger
    if (totalPassengers === 0) {
      throw new Error('At least one passenger is required');
    }
  }
  
  /**
   * Format passenger count for display
   * @param passengerCounts Array of passenger counts
   * @returns Formatted string like "3 Adults, 1 Child, 1 Infant"
   */
  static formatPassengerCount(passengerCounts: PassengerCount[]): string {
    const parts: string[] = [];
    
    for (const pc of passengerCounts) {
      let label: string;
      switch (pc.type) {
        case 'ADT':
          label = pc.count === 1 ? 'Adult' : 'Adults';
          break;
        case 'CHD':
          label = pc.count === 1 ? 'Child' : 'Children';
          break;
        case 'INF':
          label = pc.count === 1 ? 'Infant' : 'Infants';
          break;
      }
      
      parts.push(`${pc.count} ${label}`);
    }
    
    return parts.join(', ');
  }
}
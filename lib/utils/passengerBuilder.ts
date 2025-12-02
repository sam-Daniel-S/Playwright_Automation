import { PassengerCount, Passenger, PassengerType } from '../data/types';

/**
 * Utility for building and expanding passenger data for form filling
 */
export class PassengerBuilder {
  
  // Name pools for generating unique passenger names
  private static readonly FIRST_NAMES = {
    male: ['James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
           'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
             'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'],
    child: ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
            'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander']
  };

  private static readonly LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
  ];

  // Track used names to ensure uniqueness within a booking
  private static usedNames: Set<string> = new Set();

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
    // Reset used names for each new passenger group
    this.usedNames.clear();
    
    const passengers: Passenger[] = [];
    
    // Process adults first (required for infant associations)
    const adultNames: string[] = [];
    
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'ADT') {
        for (let i = 0; i < passengerCount.count; i++) {
          const { firstName, lastName, title } = this.generateUniqueName('ADT');
          
          passengers.push({
            type: 'ADT',
            title:'Mr',
            firstName,
            lastName,
            dateOfBirth: this.generateDateOfBirth('ADT'),
          });
          
          adultNames.push(`${firstName} ${lastName}`);
        }
      }
    }
    
    // Process children
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'CHD') {
        for (let i = 0; i < passengerCount.count; i++) {
          const { firstName, lastName, title } = this.generateUniqueName('CHD');
          
          passengers.push({
            type: 'CHD',
            title:'Mr',
            firstName,
            lastName,
            dateOfBirth: this.generateDateOfBirth('CHD'),
          });
        }
      }
    }
    
    // Process infants (associate with adults)
    let infantCounter = 0;
    for (const passengerCount of passengerCounts) {
      if (passengerCount.type === 'INF') {
        for (let i = 0; i < passengerCount.count; i++) {
          // Associate infant with available adult (round-robin if multiple infants)
          const associatedAdult = adultNames[infantCounter % adultNames.length] || '';
          
          const { firstName, lastName, title } = this.generateUniqueName('INF');
          
          passengers.push({
            type: 'INF',
            title:'Mr',
            firstName,
            lastName,
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
   * Generate unique name for a passenger
   * @param type Passenger type (ADT, CHD, INF)
   * @returns Object with firstName, lastName, and title
   */
  private static generateUniqueName(type: PassengerType): { firstName: string; lastName: string; title: string } {
    let firstName: string;
    let lastName: string;
    let title: string;
    let fullName: string;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    
    do {
      // Select name pool based on passenger type
      if (type === 'ADT') {
        // Adults: mix of male and female names
        const isMale = Math.random() > 0.5;
        firstName = this.getRandomFromArray(isMale ? this.FIRST_NAMES.male : this.FIRST_NAMES.female);
        title = isMale ? 'Mr' : (Math.random() > 0.5 ? 'Ms' : 'Mrs');
      } else if (type === 'CHD') {
        // Children: use child-friendly names, random gender
        firstName = this.getRandomFromArray(this.FIRST_NAMES.child);
        title = Math.random() > 0.5 ? 'Mr' : 'Ms';
      } else {
        // Infants: typically use 'Ms' and child names
        firstName = this.getRandomFromArray(this.FIRST_NAMES.child);
        title = 'Ms';
      }
      
      lastName = this.getRandomFromArray(this.LAST_NAMES);
      fullName = `${firstName} ${lastName}`;
      attempts++;
      
    } while (this.usedNames.has(fullName) && attempts < maxAttempts);
    
    // If we couldn't find a unique name after max attempts, add a suffix
    if (this.usedNames.has(fullName)) {
      firstName = `${firstName}${attempts}`;
      fullName = `${firstName} ${lastName}`;
    }
    
    this.usedNames.add(fullName);
    
    return { firstName, lastName, title };
  }

  /**
   * Get random element from array
   * @param array Array to select from
   * @returns Random element
   */
  private static getRandomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
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
    let birthMonth: number;
    let birthDay: number;
    
    switch (type) {
      case 'ADT':
        // Adults: 18-100 years old
        const adultAge = Math.floor(Math.random() * (100 - 18)) + 18;
        birthYear = currentYear - adultAge;
        break;
      case 'CHD':
        // Children: 2-12 years old (exclusive of 12 to avoid overlap with adults)
        const childAge = Math.floor(Math.random() * (12 - 2)) + 2;
        birthYear = currentYear - childAge;
        break;
      case 'INF':
        // Infants: 0-2 years old (0-23 months)
        const infantAgeMonths = Math.floor(Math.random() * 24); // 0-23 months
        if (infantAgeMonths < 12) {
          // 0-11 months: same year
          birthYear = currentYear;
          birthMonth = Math.max(1, currentDate.getMonth() + 1 - infantAgeMonths);
        } else {
          // 12-23 months: previous year
          birthYear = currentYear - 1;
          birthMonth = Math.max(1, currentDate.getMonth() + 1 - (infantAgeMonths - 12));
        }
        birthDay = Math.min(currentDate.getDate(), 28); // Safe day
        
        return `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}/${birthYear}`;
      default:
        throw new Error(`Unknown passenger type: ${type}`);
    }
    
    // Generate random month and day for adults and children
    birthMonth = Math.floor(Math.random() * 12) + 1;
    birthDay = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-specific day issues
    
    return `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}/${birthYear}`;
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
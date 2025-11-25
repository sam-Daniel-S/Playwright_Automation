import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Scenario, TravelDates, PassengerCount, TripType, CabinClass } from '../data/types';

/**
 * Excel/CSV reader for test scenarios with robust parsing and fallback
 */
export class ExcelReader {
  
  /**
   * Read scenarios from Excel file or CSV fallback
   * @param filePath Path to Excel or CSV file
   * @param sheetName Excel sheet name (default: 'scenarios')
   * @returns Array of parsed scenarios
   */
  static async readScenarios(filePath: string, sheetName = 'scenarios'): Promise<Scenario[]> {
    try {
      // Try Excel first
      if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
        return this.readFromExcel(filePath, sheetName);
      }
      
      // Fallback to CSV
      if (filePath.endsWith('.csv')) {
        return this.readFromCSV(filePath);
      }
      
      throw new Error(`Unsupported file format: ${filePath}`);
      
    } catch (error) {
      console.error(`Failed to read scenarios from ${filePath}:`, error);
      
      // Try CSV fallback if Excel fails
      if (filePath.endsWith('.xlsx')) {
        const csvPath = filePath.replace('.xlsx', '.csv');
        console.log(`Attempting CSV fallback: ${csvPath}`);
        return this.readFromCSV(csvPath);
      }
      
      throw error;
    }
  }
  
  /**
   * Read scenarios from Excel file
   */
  private static readFromExcel(filePath: string, sheetName: string): Scenario[] {
    console.log(`Reading Excel file: ${filePath}, sheet: ${sheetName}`);
    
    const workbook = XLSX.readFile(filePath);
    
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet '${sheetName}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    return this.parseRawData(rawData);
  }
  
  /**
   * Read scenarios from CSV file
   */
  private static readFromCSV(filePath: string): Scenario[] {
    console.log(`Reading CSV file: ${filePath}`);
    
    const fileContent = readFileSync(filePath, 'utf-8');
    const rawData = parse(fileContent, {
      skip_empty_lines: true,
      trim: true
    });
    
    return this.parseRawData(rawData);
  }
  
  /**
   * Parse raw data array into Scenario objects
   */
  private static parseRawData(rawData: any[][]): Scenario[] {
    if (rawData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }
    
    const headers = rawData[0].map(h => String(h).toLowerCase().trim());
    const dataRows = rawData.slice(1);
    
    console.log(`Found ${dataRows.length} scenario(s) with headers: ${headers.join(', ')}`);
    
    const scenarios: Scenario[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      if (row.length === 0 || !row[0]) {
        continue; // Skip empty rows
      }
      
      try {
        const scenario = this.parseRow(headers, row, i + 2); // +2 for 1-based indexing and header
        scenarios.push(scenario);
      } catch (error) {
        console.warn(`Skipping row ${i + 2}: ${error}`);
      }
    }
    
    console.log(`Successfully parsed ${scenarios.length} scenarios`);
    return scenarios;
  }
  
  /**
   * Parse a single row into a Scenario object
   */
  private static parseRow(headers: string[], row: any[], rowNum: number): Scenario {
    const getValue = (columnName: string): string => {
      const index = headers.indexOf(columnName.toLowerCase());
      if (index === -1) return '';
      return String(row[index] || '').trim();
    };
    
    const scenarioID = getValue('scenarioid') || getValue('scenario_id') || getValue('id');
    if (!scenarioID) {
      throw new Error(`ScenarioID is required (row ${rowNum})`);
    }
    
    const tripType = this.parseTripType(getValue('triptype') || getValue('trip_type'));
    const origin = getValue('origin');
    const destination = getValue('destination');
    const passengers = getValue('passengers');
    const cabin = this.parseCabinClass(getValue('cabin'));
    const dates = getValue('dates');
    const tags = getValue('tags') || '';
    
    if (!origin || !destination || !passengers || !dates) {
      throw new Error(`Required fields missing: origin, destination, passengers, dates (row ${rowNum})`);
    }
    
    const scenario: Scenario = {
      scenarioID,
      tripType,
      origin,
      destination,
      passengers,
      cabin,
      fareFamily: getValue('farefamily') || getValue('fare_family'),
      dates,
      tags,
      expectedResult: getValue('expectedresult') || getValue('expected_result'),
      
      // Parse and expand data
      parsedPassengers: this.parsePassengers(passengers),
      parsedDates: this.parseDates(dates, tripType),
      tagArray: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };
    
    return scenario;
  }
  
  /**
   * Parse trip type with validation
   */
  private static parseTripType(value: string): TripType {
    const normalized = value.toLowerCase().replace(/[-_\s]/g, '');
    
    if (normalized.includes('oneway') || normalized === 'ow') return 'One-way';
    if (normalized.includes('roundtrip') || normalized.includes('return') || normalized === 'rt') return 'Round-trip';
    
    throw new Error(`Invalid trip type: ${value}. Expected: One-way, Round-trip`);
  }
  
  /**
   * Parse cabin class with validation
   */
  private static parseCabinClass(value: string): CabinClass {
    const normalized = value.toLowerCase().trim();
    
    switch (normalized) {
      case 'economy':
      case 'eco':
      case 'e':
        return 'Economy';
      case 'premium':
      case 'premium economy':
      case 'pe':
        return 'Premium';
      case 'business':
      case 'biz':
      case 'b':
        return 'Business';
      case 'first':
      case 'first class':
      case 'f':
        return 'First';
      default:
        throw new Error(`Invalid cabin class: ${value}. Expected: Economy, Premium, Business, First`);
    }
  }
  
  /**
   * Parse passenger string like "3 ADT,1 CHD,1 INF"
   */
  private static parsePassengers(passengers: string): PassengerCount[] {
    const parts = passengers.split(',').map(p => p.trim());
    const result: PassengerCount[] = [];
    
    for (const part of parts) {
      const match = part.match(/^(\d+)\s*(ADT|CHD|INF|Adult|Child|Infant)$/i);
      
      if (!match) {
        throw new Error(`Invalid passenger format: ${part}. Expected format: "3 ADT" or "1 CHD"`);
      }
      
      const count = parseInt(match[1]);
      const typeStr = match[2].toUpperCase();
      
      let type: 'ADT' | 'CHD' | 'INF';
      if (typeStr === 'ADT' || typeStr === 'ADULT') type = 'ADT';
      else if (typeStr === 'CHD' || typeStr === 'CHILD') type = 'CHD';
      else if (typeStr === 'INF' || typeStr === 'INFANT') type = 'INF';
      else throw new Error(`Invalid passenger type: ${typeStr}`);
      
      result.push({ type, count });
    }
    
    return result;
  }
  
  /**
   * Parse travel dates with multiple format support
   */
  private static parseDates(dates: string, tripType: TripType): TravelDates {
    // Handle single date for one-way: "15-Nov-25" or "15/11/2025"
    if (tripType === 'One-way') {
      return {
        departure: this.normalizeDate(dates)
      };
    }
    
    // Handle date range for round-trip: "20-23 Nov 2025" or "20/11/2025 - 23/11/2025"
    const rangeParsers = [
      // "20-23 Nov 2025" format
      /^(\d{1,2})-(\d{1,2})\s+(\w+)\s+(\d{4})$/,
      // "20/11/2025 - 23/11/2025" format
      /^([^-]+)\s*-\s*([^-]+)$/
    ];
    
    for (const parser of rangeParsers) {
      const match = dates.match(parser);
      if (match) {
        if (parser.source.includes('(\\d{1,2})-(\\d{1,2})')) {
          // Format: "20-23 Nov 2025"
          const [, startDay, endDay, month, year] = match;
          return {
            departure: this.normalizeDate(`${startDay}-${month}-${year.slice(-2)}`),
            return: this.normalizeDate(`${endDay}-${month}-${year.slice(-2)}`)
          };
        } else {
          // Format: "20/11/2025 - 23/11/2025"
          return {
            departure: this.normalizeDate(match[1].trim()),
            return: this.normalizeDate(match[2].trim())
          };
        }
      }
    }
    
    throw new Error(`Invalid date format: ${dates}. Expected formats: "15-Nov-25" (one-way) or "20-23 Nov 2025" (round-trip)`);
  }
  
  /**
   * Normalize date to consistent DD-MMM-YY format
   */
  private static normalizeDate(dateStr: string): string {
    dateStr = dateStr.trim();
    
    // Already in correct format: "15-Nov-25"
    if (/^\d{1,2}-\w{3}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse various formats and convert
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}-${month}-${year}`;
  }
}
# Action-Based Test Execution

This document explains how the action-based execution system works in the Playwright automation framework.

## Overview

The framework now supports different **Action types** in the CSV test data that determine which steps of the booking flow should be executed. This allows for more granular testing and better test organization.

## Action Types

| Action | Description | Steps Executed |
|--------|-------------|----------------|
| `Search` | Execute only the search step | 1. Fill search form and submit |
| `Results` | Execute search + results selection | 1. Search<br>2. Select flight from results |
| `PassengerInfo` | Execute up to passenger information | 1. Search<br>2. Results<br>3. Fill passenger information |
| `BookingSummary` | Execute up to booking summary | 1. Search<br>2. Results<br>3. Passenger Info<br>4. Verify booking summary |
| `Booking` | Execute complete booking flow | 1. Search<br>2. Results<br>3. Passenger Info<br>4. Booking Summary<br>5. Payment |

## CSV Format

The CSV file now includes an `Action` column:

```csv
Action,Trip Type,Origin,Destination,Date,Passengers (PTC),Class Type,Promo code,Discounts,Loyalty Program,Member ID
Booking,Oneway,HEL,JFK,12/2/2025,"3ADT,2CHD,2INF",Economy,,,,
Search,Round-trip,HEL,LHR,15/12/2025,1ADT,Economy,,,,
Results,Oneway,HEL,CPH,20/12/2025,2ADT,Business,,,,
PassengerInfo,Oneway,HEL,ARN,25/12/2025,"1ADT,1CHD",Premium,,,,
BookingSummary,Round-trip,HEL,OSL,30/12/2025,1ADT,First,,,,
```

## How It Works

### 1. CSV Parsing
The `ExcelReader` class now parses the `Action` column and validates it against allowed values:
- Booking, Search, Results, PassengerInfo, BookingSummary

### 2. Scenario Execution
The `executeScenario` function uses a switch statement to determine which execution path to follow:

```typescript
switch (scenario.action) {
  case 'Search':
    await executeSearchOnly(scenario, searchPage);
    break;
    
  case 'Results':
    await executeSearchAndResults(scenario, searchPage, resultsPage);
    break;
    
  case 'PassengerInfo':
    await executeUntilPassengerInfo(scenario, searchPage, resultsPage, passengerInfoPage);
    break;
    
  case 'BookingSummary':
    await executeUntilBookingSummary(scenario, searchPage, resultsPage, passengerInfoPage, bookingSummaryPage);
    break;
    
  case 'Booking':
  default:
    await executeFullBookingFlow(scenario, searchPage, resultsPage, passengerInfoPage, bookingSummaryPage);
    break;
}
```

### 3. Execution Functions
Each action type has its own execution function that builds upon the previous steps:

#### executeSearchOnly
- Navigates to the search page
- Fills the search form
- Submits the search
- **Stops here**

#### executeSearchAndResults
- Calls `executeSearchOnly`
- Waits for search results
- Selects a flight based on cabin preference
- **Stops here**

#### executeUntilPassengerInfo
- Calls `executeSearchAndResults`
- Fills passenger information for all passengers
- **Stops here**

#### executeUntilBookingSummary
- Calls `executeUntilPassengerInfo`
- Verifies the booking summary
- **Stops here**

#### executeFullBookingFlow
- Calls `executeUntilBookingSummary`
- Proceeds to payment
- Completes the booking (or attempts to in test environment)

## Benefits

### 1. **Targeted Testing**
- Test only the search functionality without going through the entire flow
- Validate search results without booking
- Test passenger information forms in isolation

### 2. **Debugging**
- Identify exactly where in the flow issues occur
- Run partial flows for faster debugging
- Isolate problems to specific steps

### 3. **Performance**
- Shorter test execution times for simple validations
- Reduced resource usage for basic checks
- Parallel execution of different action types

### 4. **Test Organization**
- Group tests by functionality rather than full end-to-end flows
- Create focused test suites for specific features
- Better test reporting and analysis

## Example Usage

### Testing Search Functionality Only
```csv
Action,Trip Type,Origin,Destination,Date,Passengers (PTC),Class Type
Search,Oneway,HEL,LHR,15/12/2025,1ADT,Economy
Search,Round-trip,HEL,CPH,20-25/12/2025,2ADT,Business
```

### Testing Results Selection
```csv
Action,Trip Type,Origin,Destination,Date,Passengers (PTC),Class Type
Results,Oneway,HEL,JFK,10/01/2026,1ADT,Economy
Results,Round-trip,HEL,ARN,15-20/01/2026,"1ADT,1CHD",Premium
```

### Full Booking Flow
```csv
Action,Trip Type,Origin,Destination,Date,Passengers (PTC),Class Type
Booking,Oneway,HEL,OSL,25/01/2026,"2ADT,1CHD,1INF",Business
```

## Running Tests

### Run All Actions from CSV
```bash
npx playwright test comprehensive-e2e.spec.ts
```

### Run Specific Action Types
```bash
npx playwright test action-based-execution.spec.ts
```

### Run Individual Action Tests
```bash
npx playwright test action-based-execution.spec.ts -g "Action: Search"
npx playwright test action-based-execution.spec.ts -g "Action: Results"
```

## Implementation Notes

### Type Safety
- All action types are defined in the `ActionType` union type
- TypeScript ensures only valid actions are used
- Compile-time validation prevents typos

### Error Handling
- Each execution function handles its own errors
- Failed steps don't prevent other scenarios from running
- Screenshots are captured for debugging

### Backward Compatibility
- Existing scenarios without an Action default to "Booking"
- All existing test data continues to work
- No breaking changes to existing functionality

## Future Enhancements

### Conditional Actions
- Add conditions based on test environment
- Dynamic action selection based on test data
- Configuration-driven action mapping

### Action Chaining
- Execute multiple actions in sequence
- Create test workflows with multiple scenarios
- Support for data passing between actions

### Reporting
- Action-specific reporting and metrics
- Performance analysis by action type
- Success rate tracking per action
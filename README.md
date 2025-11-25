# Airline Booking E2E Test Framework

A maintainable, data-driven E2E testing framework for airline booking systems built with Playwright + TypeScript.

## 🚀 Features

- **Data-Driven Testing**: Read test scenarios from Excel/CSV files
- **Modular Page Objects**: Maintainable page object pattern with reusable components
- **AI-Assisted Debugging**: Placeholder integration for AI-powered selector suggestions and failure analysis
- **Robust Error Handling**: Automatic retries, fallback selectors, and comprehensive logging
- **Tag-Based Filtering**: Run smoke tests, regression tests, or specific test categories
- **Strong Typing**: Full TypeScript support with custom data models
- **Cross-Browser Support**: Test on Chrome, Firefox, and Safari
- **Rich Reporting**: HTML reports, JUnit XML, and screenshot/video capture on failures

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Playwright Test framework

## 🛠️ Installation

1. **Clone/Setup the project:**
```bash
cd UI_Automation_SingleBase
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install Playwright browsers:**
```bash
npm run install:browsers
```

## 📊 Test Data Structure

Test scenarios are defined in `test-data/scenarios.xlsx` (or `.csv` fallback) with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| ScenarioID | Unique test identifier | `SMOKE_001` |
| TripType | One-way or Round-trip | `One-way` |
| Origin | Departure airport code | `DEL` |
| Destination | Arrival airport code | `BOM` |
| Passengers | Passenger counts | `3 ADT,1 CHD,1 INF` |
| Cabin | Cabin class | `Economy`, `Business`, `Premium`, `First` |
| FareFamily | Optional fare type | `Basic`, `Flex` |
| Dates | Travel dates | `15-Dec-25` or `20-25 Dec 2025` |
| Tags | Test categories | `smoke,regression` |
| ExpectedResult | Expected outcome | `success` or `error` |

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with browser visible (headed mode)
npm run test:headed

# Run smoke tests only
npm run test:smoke

# Run regression tests only
npm run test:regression

# Run all tests (explicit)
npm run test:all

# Debug mode (step through tests)
npm run test:debug

# Interactive UI mode
npm run test:ui
```

### Advanced Filtering

```bash
# Run tests by grep pattern
npx playwright test --grep "@smoke"
npx playwright test --grep "DEL.*BOM"
npx playwright test --grep "Business"

# Run specific test file
npx playwright test tests/e2e.spec.ts

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run with retries
npx playwright test --retries=2

# Generate report
npx playwright test && npm run report
```

## 📁 Project Structure

```
├── lib/
│   ├── data/
│   │   └── types.ts              # TypeScript interfaces and types
│   ├── excel/
│   │   └── excelReader.ts        # Excel/CSV data parser
│   ├── utils/
│   │   └── passengerBuilder.ts   # Passenger data utilities
│   └── ai/
│       └── selectorAssistant.ts  # AI-powered debugging tools
├── pages/
│   ├── BasePage.ts              # Base page with common utilities
│   ├── SearchPage.ts            # Flight search functionality
│   ├── ResultsPage.ts           # Flight results and selection
│   ├── PassengerInfoPage.ts     # Passenger form filling
│   └── BookingSummaryPage.ts    # Booking summary and payment
├── tests/
│   └── e2e.spec.ts              # Main test suite
├── test-data/
│   ├── scenarios.xlsx           # Test scenarios (Excel)
│   └── scenarios.csv            # Test scenarios (CSV fallback)
├── playwright.config.ts         # Playwright configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🎯 Test Flow

Each test scenario follows this flow:

1. **Search Page**: Fill origin, destination, dates, passengers, cabin class
2. **Results Page**: Wait for results, select flight based on cabin/preference
3. **Passenger Info**: Fill passenger details for all travelers
4. **Booking Summary**: Verify booking details, complete payment
5. **Validation**: Assert booking completion and data accuracy

## 🏷️ Test Tags and Categories

Tests are organized using tags for flexible execution:

- **@smoke**: Quick validation of core functionality (5-10 tests)
- **@regression**: Comprehensive testing (all scenarios)
- **@negative**: Error condition testing (validation failures)

Add tags to the `Tags` column in your test data to control test execution.

## 🔧 Configuration

### Environment Variables

Create a `.env` file for environment-specific settings:

```bash
# Base application URL
BASE_URL=https://your-airline-app.com

# AI features (optional)
AI_ENABLED=false
OPENAI_API_KEY=your_api_key_here

# Test settings
DEFAULT_TIMEOUT=30000
HEADLESS=true
```

### Playwright Config

Key settings in `playwright.config.ts`:

- **Retries**: 2 retries on CI, 0 locally
- **Parallelization**: Configurable workers
- **Browsers**: Chrome, Firefox, Safari support
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Reports**: HTML, JUnit, JSON formats

## 🤖 AI-Powered Features

The framework includes placeholder integration for AI services:

### Selector Assistant
- **Auto-suggestions**: When selectors fail, get AI-powered alternatives
- **Failure analysis**: Visual screenshot analysis with suggested fixes
- **Enable**: Set `AI_ENABLED=true` and `OPENAI_API_KEY=your_key`

### Integration Points
- `lib/ai/selectorAssistant.ts` - Contains integration hooks for OpenAI GPT-4 Vision
- Marked with `TODO` comments showing where to add API calls
- Environment variables control when AI features are active

## 📈 Adding New Test Scenarios

1. **Add to Excel/CSV**:
   - Open `test-data/scenarios.xlsx` or edit `scenarios.csv`
   - Add new row with scenario details
   - Use appropriate tags for categorization

2. **Passenger Format Examples**:
   ```
   1 ADT           # 1 Adult
   2 ADT 1 CHD     # 2 Adults, 1 Child  
   1 ADT 1 INF     # 1 Adult, 1 Infant
   3 ADT 1 CHD 1 INF  # Mixed group
   ```

3. **Date Format Examples**:
   ```
   15-Dec-25           # One-way
   20-25 Dec 2025      # Round-trip range
   15/12/2025          # Alternative format
   ```

## 🚦 Continuous Integration

Example GitHub Actions workflow:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run smoke tests
      run: npm run test:smoke
    
    - name: Run regression tests
      if: github.event_name == 'push'
      run: npm run test:regression
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## 🔄 Increment 2 Planning (Seats & Ancillaries)

Future enhancements for seat selection and ancillary services:

### Planned Features
- **Seat Selection Page Object**: `pages/SeatSelectionPage.ts`
- **Ancillary Services**: Baggage, meals, insurance selection
- **Enhanced Test Data**: Seat preferences, ancillary combinations
- **Advanced Validation**: Seat maps, service confirmations

### Data Model Extensions
```typescript
interface SeatSelection {
  passengerName: string;
  seatNumber: string;
  seatType: 'window' | 'aisle' | 'middle';
  extraLegroom: boolean;
}

interface AncillaryServices {
  baggage: { weight: number; pieces: number };
  meals: string[];
  insurance: boolean;
  priorityBoarding: boolean;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Selector Failures**:
   - Check if page loaded completely
   - Verify element exists in DOM
   - Use AI selector suggestions (if enabled)
   - Update locators in page objects

2. **Data Loading Issues**:
   - Ensure Excel/CSV file exists in `test-data/`
   - Check file permissions
   - Validate CSV format matches expected columns
   - Review console logs for parsing errors

3. **Test Timeouts**:
   - Increase timeout in `playwright.config.ts`
   - Check network conditions
   - Verify application performance
   - Use explicit waits for slow elements

4. **Environment Setup**:
   - Verify Node.js version (18+)
   - Install Playwright browsers
   - Check TypeScript compilation
   - Validate test data format

### Debug Mode

Run tests in debug mode to step through execution:

```bash
npm run test:debug
```

### Logging

Enable verbose logging:

```bash
DEBUG=pw:api npx playwright test
```

## 📚 Documentation

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Organization](https://playwright.dev/docs/test-organize)

## 🤝 Contributing

1. Follow TypeScript and Playwright best practices
2. Add tests for new page objects
3. Update documentation for new features
4. Use meaningful commit messages
5. Ensure all tests pass before submitting

## 📄 License

MIT License - see LICENSE file for details.
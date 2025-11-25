import { Page } from '@playwright/test';
import { SelectorSuggestion, FailureTriage } from '../data/types';

/**
 * AI-powered selector assistant for test maintenance and failure triage
 * 
 * This module provides placeholder implementations with clear integration points
 * for AI services like OpenAI GPT-4 Vision, Claude, or other LLMs.
 * 
 * Enable AI features by setting environment variables:
 * - AI_ENABLED=true
 * - OPENAI_API_KEY=your_api_key
 */
export class SelectorAssistant {
  
  private static readonly AI_ENABLED = process.env.AI_ENABLED === 'true';
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  /**
   * Suggest alternative selectors when a selector fails
   * @param page Playwright page instance
   * @param failingSelector The selector that failed
   * @returns Array of suggested alternative selectors
   */
  static async suggestSelectors(page: Page, failingSelector: string): Promise<SelectorSuggestion[]> {
    console.log(`Analyzing failing selector: ${failingSelector}`);
    
    try {
      // Collect page context for analysis
      const pageContext = await this.collectPageContext(page, failingSelector);
      
      // Generate fallback suggestions using DOM analysis
      const fallbackSuggestions = this.generateFallbackSelectors(pageContext, failingSelector);
      
      // If AI is enabled, enhance suggestions with LLM analysis
      if (this.AI_ENABLED && this.OPENAI_API_KEY) {
        const aiSuggestions = await this.getAISelectorSuggestions(pageContext, failingSelector);
        return [...aiSuggestions, ...fallbackSuggestions];
      }
      
      return fallbackSuggestions;
      
    } catch (error) {
      console.warn('Selector suggestion failed:', error);
      return this.getBasicFallbackSelectors(failingSelector);
    }
  }
  
  /**
   * Perform failure triage analysis
   * @param logs Array of test execution logs
   * @param screenshotPath Path to failure screenshot
   * @returns Triage analysis with suggested fixes
   */
  static async triageFailure(logs: string[], screenshotPath?: string): Promise<FailureTriage> {
    console.log('Performing failure triage analysis...');
    
    try {
      // Basic pattern-based analysis
      const basicTriage = this.performBasicTriage(logs);
      
      // If AI is enabled, enhance with visual and log analysis
      if (this.AI_ENABLED && this.OPENAI_API_KEY && screenshotPath) {
        const aiAnalysis = await this.getAIFailureAnalysis(logs, screenshotPath);
        return {
          ...basicTriage,
          aiAnalysis
        };
      }
      
      return basicTriage;
      
    } catch (error) {
      console.warn('Failure triage failed:', error);
      return {
        category: 'unknown',
        severity: 'medium',
        suggestedFix: 'Manual investigation required. Check logs and screenshot for details.'
      };
    }
  }
  
  /**
   * Collect relevant page context for selector analysis
   */
  private static async collectPageContext(page: Page, failingSelector: string) {
    const context = {
      failingSelector,
      url: page.url(),
      title: await page.title().catch(() => ''),
      viewport: page.viewportSize(),
      timestamp: new Date().toISOString()
    };
    
    try {
      // Try to find similar elements
      const selectorParts = failingSelector.split(/[\s>+~,]/);
      const searchTerms = selectorParts
        .filter(part => part.trim().length > 1)
        .map(part => part.replace(/[^\w-]/g, ''));
      
      const nearbyElements = [];
      
      for (const term of searchTerms.slice(0, 3)) { // Limit to avoid performance issues
        try {
          const elements = await page.locator(`[class*="${term}"], [id*="${term}"], [data-testid*="${term}"]`).all();
          
          for (let i = 0; i < Math.min(elements.length, 5); i++) {
            const element = elements[i];
            const attributes = await element.evaluate((el: Element) => {
              const attrs: Record<string, string> = {};
              for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                attrs[attr.name] = attr.value;
              }
              return attrs;
            }).catch(() => ({}));
            
            nearbyElements.push({
              tagName: await element.evaluate((el: Element) => el.tagName).catch(() => ''),
              attributes,
              textContent: await element.textContent().then((text: string | null) => text?.substring(0, 100)).catch(() => '')
            });
          }
        } catch (e) {
          // Continue if selector search fails
        }
      }
      
      return {
        ...context,
        nearbyElements,
        searchTerms
      };
      
    } catch (error) {
      console.warn('Failed to collect full page context:', error);
      return context;
    }
  }
  
  /**
   * Generate fallback selector suggestions using DOM analysis
   */
  private static generateFallbackSelectors(pageContext: any, failingSelector: string): SelectorSuggestion[] {
    const suggestions: SelectorSuggestion[] = [];
    
    // Extract useful patterns from failing selector
    const testIdMatch = failingSelector.match(/data-testid[="']([\w-]+)/);
    const classMatch = failingSelector.match(/class[="']([^"']*)/);
    const textMatch = failingSelector.match(/text[="']([^"']*)/);
    
    // Suggest test-id alternatives if available
    if (testIdMatch) {
      const testId = testIdMatch[1];
      suggestions.push({
        selector: `[data-testid="${testId}"]`,
        confidence: 0.9,
        reasoning: 'Simplified data-testid selector'
      });
      
      suggestions.push({
        selector: `[data-testid*="${testId}"]`,
        confidence: 0.7,
        reasoning: 'Partial data-testid match'
      });
    }
    
    // Suggest text-based alternatives
    if (textMatch) {
      const text = textMatch[1];
      suggestions.push({
        selector: `text="${text}"`,
        confidence: 0.8,
        reasoning: 'Direct text selector'
      });
      
      suggestions.push({
        selector: `text*="${text}"`,
        confidence: 0.6,
        reasoning: 'Partial text match'
      });
    }
    
    // Analyze nearby elements for alternative selectors
    if (pageContext.nearbyElements) {
      for (const element of pageContext.nearbyElements) {
        if (element.attributes['data-testid']) {
          suggestions.push({
            selector: `[data-testid="${element.attributes['data-testid']}"]`,
            confidence: 0.5,
            reasoning: 'Alternative element with data-testid'
          });
        }
        
        if (element.textContent && element.textContent.length > 0) {
          suggestions.push({
            selector: `text="${element.textContent.trim()}"`,
            confidence: 0.4,
            reasoning: 'Alternative element with text content'
          });
        }
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  /**
   * Get basic fallback selectors when analysis fails
   */
  private static getBasicFallbackSelectors(failingSelector: string): SelectorSuggestion[] {
    return [
      {
        selector: failingSelector.replace(/first\(\)$/, '').replace(/>>.*/, ''),
        confidence: 0.6,
        reasoning: 'Removed positional modifiers'
      },
      {
        selector: failingSelector.replace(/^.*>>/, ''),
        confidence: 0.5,
        reasoning: 'Removed parent selectors'
      }
    ];
  }
  
  /**
   * Perform basic pattern-based failure triage
   */
  private static performBasicTriage(logs: string[]): FailureTriage {
    const logText = logs.join(' ').toLowerCase();
    
    // Check for common error patterns
    if (logText.includes('timeout') || logText.includes('waiting for selector')) {
      return {
        category: 'timing',
        severity: 'medium',
        suggestedFix: 'Increase timeout or add explicit wait conditions. Check if element appears after user interaction.'
      };
    }
    
    if (logText.includes('selector') || logText.includes('locator')) {
      return {
        category: 'selector',
        severity: 'high',
        suggestedFix: 'Element selector may have changed. Update selector or use more stable attributes like data-testid.'
      };
    }
    
    if (logText.includes('network') || logText.includes('failed to fetch')) {
      return {
        category: 'network',
        severity: 'low',
        suggestedFix: 'Network issue detected. Consider adding retry logic or checking test environment connectivity.'
      };
    }
    
    if (logText.includes('data') || logText.includes('validation') || logText.includes('expected')) {
      return {
        category: 'data',
        severity: 'medium',
        suggestedFix: 'Data validation failed. Verify test data and expected values are correct.'
      };
    }
    
    return {
      category: 'unknown',
      severity: 'medium',
      suggestedFix: 'Unknown failure pattern. Manual investigation recommended.'
    };
  }
  
  /**
   * AI-powered selector suggestions (integration point for LLM services)
   * 
   * TODO: Integrate with OpenAI GPT-4 Vision or similar service
   * - Send page screenshot and DOM context
   * - Get intelligent selector suggestions based on visual analysis
   * - Parse and rank suggestions by confidence
   */
  private static async getAISelectorSuggestions(
    pageContext: any, 
    failingSelector: string
  ): Promise<SelectorSuggestion[]> {
    
    // INTEGRATION POINT: Replace with actual AI service call
    console.log('🔮 AI selector analysis would be performed here');
    console.log('Context:', { 
      url: pageContext.url, 
      selector: failingSelector,
      elementsFound: pageContext.nearbyElements?.length || 0
    });
    
    /*
    Example OpenAI integration:
    
    const openai = new OpenAI({ apiKey: this.OPENAI_API_KEY });
    
    const prompt = `
    Analyze this failing Playwright selector and suggest alternatives:
    
    Failing selector: ${failingSelector}
    Page URL: ${pageContext.url}
    Nearby elements: ${JSON.stringify(pageContext.nearbyElements, null, 2)}
    
    Provide 3-5 alternative selectors ranked by reliability.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });
    
    // Parse AI response and convert to SelectorSuggestion[]
    */
    
    // Placeholder return - replace with actual AI analysis
    return [
      {
        selector: `${failingSelector}.nth(0)`,
        confidence: 0.85,
        reasoning: 'AI-suggested: Use nth(0) instead of first() for better reliability'
      }
    ];
  }
  
  /**
   * AI-powered failure analysis (integration point for LLM services)
   * 
   * TODO: Integrate with OpenAI GPT-4 Vision for screenshot analysis
   * - Send screenshot and logs to AI service
   * - Get detailed failure analysis and suggestions
   * - Return structured analysis data
   */
  private static async getAIFailureAnalysis(
    logs: string[], 
    screenshotPath: string
  ): Promise<string> {
    
    // INTEGRATION POINT: Replace with actual AI service call
    console.log('🔮 AI failure analysis would be performed here');
    console.log('Screenshot:', screenshotPath);
    console.log('Log entries:', logs.length);
    
    /*
    Example OpenAI Vision integration:
    
    const fs = require('fs');
    const screenshot = fs.readFileSync(screenshotPath, { encoding: 'base64' });
    
    const openai = new OpenAI({ apiKey: this.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this test failure screenshot and logs: ${logs.join('\\n')}` 
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${screenshot}` }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    
    return response.choices[0]?.message?.content || 'AI analysis failed';
    */
    
    // Placeholder return - replace with actual AI analysis
    return 'AI analysis: Visual inspection suggests element may be hidden by overlay or animation in progress.';
  }
}
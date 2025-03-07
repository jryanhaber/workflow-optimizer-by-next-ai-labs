// GPT analyzer for workflow items
class GPTAnalyzer {
  constructor() {
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.apiKey = null; // User will need to provide via settings
    this.promptTemplates = {
      categorize: (item) =>
        `Analyze this item and suggest categories: ${item.title} - ${item.text || ''}`,
      'suggest-tags': (item) => `Suggest tags for this item: ${item.title} - ${item.text || ''}`,
      'next-actions': (item) =>
        `What are possible next actions for: ${item.title} - ${item.text || ''}`
    };
  }

  /**
   * Set the API key for GPT calls
   * @param {string} key - OpenAI API key
   */
  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('gptApiKey', key);
  }

  /**
   * Get API key from storage
   */
  async getApiKey() {
    if (this.apiKey) return this.apiKey;

    this.apiKey = localStorage.getItem('gptApiKey');
    return this.apiKey;
  }

  /**
   * Analyze a workflow item with GPT
   * @param {WorkflowItem} item - The item to analyze
   * @param {string} analysisType - Type of analysis to perform
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeItem(item, analysisType = 'categorize') {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('GPT API key not configured');
    }

    // Get the appropriate prompt template
    const promptTemplate = this.promptTemplates[analysisType];
    if (!promptTemplate) {
      throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    // Generate prompt with item data
    const prompt = promptTemplate(item);

    // Call GPT API
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an AI assistant analyzing workflow items.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`GPT API error: ${data.error?.message || 'Unknown error'}`);
      }

      return this.parseResponse(data, analysisType);
    } catch (error) {
      console.error('GPT analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse the GPT response based on analysis type
   * @param {Object} response - The raw API response
   * @param {string} analysisType - Type of analysis performed
   * @returns {Object} Parsed results
   */
  parseResponse(response, analysisType) {
    // Extract the content from the response
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from GPT');
    }

    // Parse based on analysis type
    switch (analysisType) {
      case 'categorize':
        return { type: 'categories', content: content.split('\n').filter((line) => line.trim()) };

      case 'suggest-tags':
        return {
          type: 'tags',
          content: content
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        };

      case 'next-actions':
        return { type: 'actions', content: content.split('\n').filter((line) => line.trim()) };

      default:
        return { type: 'raw', content };
    }
  }
}

// Create global instance
window.GPTAnalyzer = new GPTAnalyzer();

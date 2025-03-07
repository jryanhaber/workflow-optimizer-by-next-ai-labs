/**
 * Handles capturing current page state
 */
class Capture {
  /**
   * Captures the current tab
   * @param {string} captureType - Type of capture (todo, inprogress, completed)
   * @param {string} text - Optional description text
   * @param {Array} tags - Optional tags to apply
   */
  static async captureCurrentTab(captureType = 'todo', text = '', tags = []) {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Take screenshot
      const screenshotUrl = await chrome.tabs.captureVisibleTab();

      // Create capture object
      const captureData = {
        id: Date.now(),
        type: captureType,
        text: text,
        url: tab.url,
        title: tab.title,
        screenshot: screenshotUrl,
        tags: tags,
        systemTags: [`status:${captureType}`],
        gtdStage: captureType === 'completed' ? 'completed' : 'inbox',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewedAt: null,
        nextAction: null
      };

      console.log('Saving capture data:', captureData);

      // Save using window.DataStore
      if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
        await window.DataStore.saveItem(captureData);
        console.log('Item saved successfully');
        return captureData;
      } else {
        console.error('DataStore.saveItem is not available');
        throw new Error('DataStore.saveItem is not available');
      }
    } catch (error) {
      console.error('Capture failed:', error);
      throw error;
    }
  }
}

// Export the class
window.Capture = Capture;

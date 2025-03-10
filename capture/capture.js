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

      // Add direct fallback - use the chrome.storage API directly if DataStore fails
      try {
        if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
          if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
            await window.DataStore.saveItem(captureData);
            console.log('Item saved successfully via DataStore');
          } else {
            console.error('DataStore object:', window.DataStore);
            throw new Error('DataStore.saveItem is not available');
          }
          console.log('Item saved successfully via DataStore');
          return captureData;
        } else {
          throw new Error('DataStore.saveItem not available, using fallback');
        }
      } catch (storeError) {
        console.warn('Using storage fallback:', storeError.message);
        // Fallback to direct chrome.storage
        const result = await chrome.storage.local.get('capturedItems');
        const items = result.capturedItems || [];
        items.push(captureData);
        await chrome.storage.local.set({ capturedItems: items });
        console.log('Item saved via direct storage API');
        return captureData;
      }
    } catch (error) {
      console.error('Capture failed:', error);
      throw error;
    }
  }
}

// Export the class
window.Capture = Capture;

// Perform immediate initialization check
console.log('Capture module loaded, DataStore available:', !!window.DataStore);

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command.startsWith('capture-')) {
    const captureType = command.replace('capture-', '');
    await captureCurrentTab(captureType);
  }
});

// Function to capture the current tab
async function captureCurrentTab(captureType) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Capture screenshot
    const screenshotUrl = await chrome.tabs.captureVisibleTab();

    // Create capture data
    const captureData = {
      type: captureType,
      url: tab.url,
      title: tab.title,
      screenshot: screenshotUrl,
      text: '',
      tags: [],
      systemTags: [`status:${captureType}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: Date.now()
    };

    // Store the capture
    await storeCapture(captureData);

    // Optional: Show notification (if you have icons)
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Captured!',
        message: `Saved "${tab.title}" as ${captureType}`
      });
    } catch (e) {
      console.log('Notification failed, but capture succeeded');
    }
  } catch (error) {
    console.error('Capture failed:', error);
  }
}

// Store capture in chrome.storage
async function storeCapture(captureData) {
  try {
    // Get existing items
    const result = await chrome.storage.local.get('capturedItems');
    const items = result.capturedItems || [];

    // Add new item
    items.push(captureData);

    // Save back to storage
    await chrome.storage.local.set({ capturedItems: items });
    console.log('Item stored successfully:', captureData);
  } catch (error) {
    console.error('Storage failed:', error);
  }
}

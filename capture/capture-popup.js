document.addEventListener('DOMContentLoaded', () => {
  console.log('Capture popup initialization started');

  // Check if required components are available
  if (!window.DataStore) {
    console.error('DataStore not found, this will cause capture to fail');
  }

  if (!window.TagManager) {
    console.error('TagManager not found, this will affect tag functionality');
  }

  if (!window.Capture) {
    console.error('Capture not found, capture functionality will not work');
  }

  initializeCapture();
});

// Track current tab info
let currentTab = null;

// Preview current tab
async function initializeCapture() {
  try {
    console.log('Getting current tab info');
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Preview tab info
    document.getElementById('page-title').textContent = tab.title;
    document.getElementById('page-url').textContent = tab.url;

    // Take screenshot for preview
    console.log('Capturing screenshot');
    const screenshot = await chrome.tabs.captureVisibleTab();
    const previewEl = document.getElementById('screenshot-preview');
    previewEl.style.backgroundImage = `url(${screenshot})`;

    // Initialize tag manager
    console.log('Initializing tag manager');
    const tagContainer = document.getElementById('tag-container');
    let tagManager;

    try {
      tagManager = new TagManager(tagContainer);
    } catch (error) {
      console.error('Error initializing TagManager:', error);
      // Fallback simple tag manager
      tagManager = {
        getTags: () => [],
        setTags: () => {}
      };
    }

    // Setup capture buttons
    setupCaptureButtons(tagManager);

    // Set up view all button
    document.getElementById('view-all-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: '../review/review.html' });
    });

    // Add debug button
    addDebugButton();

    console.log('Capture popup initialized successfully');
  } catch (error) {
    console.error('Capture popup initialization failed:', error);
    showError('Failed to initialize capture popup: ' + error.message);
  }
}

function setupCaptureButtons(tagManager) {
  console.log('Setting up capture buttons');

  // Replace capture buttons with simpler versions
  document.querySelector('.capture-type').innerHTML = `
    <button class="capture-btn todo" data-type="todo">Todo</button>
    <button class="capture-btn inprogress" data-type="inprogress">In Progress</button>
    <button class="capture-btn waiting" data-type="waiting">Waiting For</button>
    <button class="capture-btn completed" data-type="completed">Completed</button>
  `;

  // Set up capture buttons (after replacing HTML)
  const captureButtons = document.querySelectorAll('.capture-btn');
  captureButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const type = button.getAttribute('data-type');
      const text = document.getElementById('capture-text').value;
      const tags = tagManager.getTags();

      try {
        // Pre-capture diagnostics
        console.log('Capture attempt with:', { type, text, tagCount: tags.length });
        console.log('DataStore available:', !!window.DataStore);
        console.log('Capture available:', !!window.Capture);

        // Show loading state
        button.classList.add('loading');
        button.textContent = 'Saving...';

        // Perform capture
        if (window.Capture && typeof window.Capture.captureCurrentTab === 'function') {
          console.log('Calling Capture.captureCurrentTab');
          await window.Capture.captureCurrentTab(type, text, tags);
          console.log('Capture successful');
        } else {
          console.error('Capture.captureCurrentTab is not available');
          throw new Error('Capture functionality is not available');
        }

        // Show success message
        button.classList.remove('loading');
        button.classList.add('success');
        button.textContent = 'Saved!';

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1000);
      } catch (error) {
        console.error('Capture failed:', error);
        button.classList.remove('loading');
        button.classList.add('error');
        button.textContent = 'Error!';

        // Show error message
        showError('Capture failed: ' + error.message);
      }
    });
  });
}

function showError(message) {
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.style.backgroundColor = '#ffdddd';
  errorDiv.style.color = '#ff0000';
  errorDiv.style.padding = '10px';
  errorDiv.style.margin = '10px 0';
  errorDiv.style.borderRadius = '4px';
  errorDiv.textContent = message;

  // Add to container
  const container = document.querySelector('.capture-container');
  container.insertBefore(errorDiv, container.firstChild);
}

function addDebugButton() {
  // Create a debug button that will log diagnostics
  const debugBtn = document.createElement('button');
  debugBtn.textContent = 'Debug';
  debugBtn.style.position = 'absolute';
  debugBtn.style.bottom = '5px';
  debugBtn.style.right = '5px';
  debugBtn.style.fontSize = '10px';
  debugBtn.style.padding = '2px 5px';
  debugBtn.style.backgroundColor = 'white';
  debugBtn.style.border = '.5px solid lightgray';

  debugBtn.addEventListener('click', () => {
    // Log diagnostic info
    console.log('--- Debug Info ---');
    console.log('DataStore exists:', !!window.DataStore);
    console.log('TagManager exists:', !!window.TagManager);
    console.log('Capture exists:', !!window.Capture);

    if (window.DataStore) {
      console.log('DataStore methods:');
      console.log('- saveItem:', typeof window.DataStore.saveItem === 'function');
      console.log('- getAllItems:', typeof window.DataStore.getAllItems === 'function');
    }

    // Log scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    console.log(
      'Loaded scripts:',
      scripts.map((s) => s.src)
    );

    // Create a temporary hidden text element with debug info
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'fixed';
    debugInfo.style.top = '10px';
    debugInfo.style.left = '10px';
    debugInfo.style.right = '10px';
    debugInfo.style.backgroundColor = 'white';
    debugInfo.style.border = '1px solid black';
    debugInfo.style.padding = '10px';
    debugInfo.style.zIndex = '9999';
    debugInfo.style.maxHeight = '80vh';
    debugInfo.style.overflow = 'auto';

    debugInfo.innerHTML = `
      <h3>Debug Info</h3>
      <p>DataStore exists: ${!!window.DataStore}</p>
      <p>TagManager exists: ${!!window.TagManager}</p>
      <p>Capture exists: ${!!window.Capture}</p>
      <button id="close-debug">Close</button>
    `;

    document.body.appendChild(debugInfo);
    document.getElementById('close-debug').addEventListener('click', () => {
      document.body.removeChild(debugInfo);
    });
  });

  document.body.appendChild(debugBtn);
}

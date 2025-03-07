// Initialize the capture popup
document.addEventListener('DOMContentLoaded', () => {
  initializeCapture();
});

// Track current tab info
let currentTab = null;

// Preview current tab
async function initializeCapture() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Preview tab info
    document.getElementById('page-title').textContent = tab.title;
    document.getElementById('page-url').textContent = tab.url;

    // Take screenshot for preview
    const screenshot = await chrome.tabs.captureVisibleTab();
    const previewEl = document.getElementById('screenshot-preview');
    previewEl.style.backgroundImage = `url(${screenshot})`;

    // Initialize tag manager
    const tagContainer = document.getElementById('tag-container');
    const tagManager = new TagManager(tagContainer);

    // Replace capture buttons with simpler versions
    document.querySelector('.capture-type').innerHTML = `
      <button class="capture-btn todo" data-type="todo">
        Todo
      </button>
      <button class="capture-btn inprogress" data-type="inprogress">
        In Progress
      </button>
       <button class="capture-btn waiting" data-type="waiting">
    Waiting For
  </button>
      <button class="capture-btn completed" data-type="completed">
        Completed
      </button>
    `;

    // Set up capture buttons (after replacing HTML)
    const captureButtons = document.querySelectorAll('.capture-btn');
    captureButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const type = button.getAttribute('data-type');
        const text = document.getElementById('capture-text').value;
        const tags = tagManager.getTags();

        try {
          // Show loading state
          button.classList.add('loading');
          button.textContent = 'Saving...';

          // Perform capture
          if (window.Capture && typeof window.Capture.captureCurrentTab === 'function') {
            await window.Capture.captureCurrentTab(type, text, tags);
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
        }
      });
    });

    // Set up view all button
    document.getElementById('view-all-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: '../review/review.html' });
    });
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

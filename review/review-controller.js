/**
 * Review controller that manages the review page functionality
 */
class ReviewController {
  constructor() {
    // Get saved filter from localStorage or default to 'all'
    this.currentFilter = localStorage.getItem('currentFilter') || 'all';
    this.currentGtdStage = localStorage.getItem('currentGtdStage') || 'inbox';
    this.currentView = localStorage.getItem('preferredView') || 'card';
    this.allItems = [];
    this.filteredItems = [];
  }

  /**
   * Initializes the review controller with proper state restoration
   * Restores the user's previous view context (filters, GTD stage) from localStorage
   */
  async initialize() {
    console.log('Review controller initializing...');

    try {
      // Set up event listeners
      this.setupEventListeners();

      // Load and render items
      await this.loadItems();

      // Restore the correct view based on saved state
      if (this.currentGtdStage) {
        // If we were in a GTD stage view, restore it
        this.filterByGTDStage(this.currentGtdStage);
      } else {
        // Otherwise apply normal filters
        this.applyFilters();
      }

      // Load tags for sidebar
      await this.loadTags();

      // Set up real-time updates
      this.setupRealTimeUpdates();

      // Update GTD counts
      this.updateGTDCounts();

      console.log('Review controller initialized successfully');
    } catch (error) {
      console.error('Error initializing review controller:', error);
    }
  }

  async processInbox() {
    // Get all inbox items
    const inboxItems = this.allItems.filter((item) => {
      const itemStage = item.gtdStage || 'inbox';
      return itemStage === 'inbox';
    });

    if (inboxItems.length === 0) {
      this.showToast('No inbox items to process', 'info');
      return;
    }

    // Create a fullscreen process view
    this.showProcessInboxView(inboxItems);
  }

  setupEventListeners() {
    // Set up filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        // Update active state
        filterButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        // Apply filter
        this.currentFilter = button.getAttribute('data-filter');
        this.applyFilters();
      });
    });
    const processInboxBtn = document.getElementById('process-inbox-btn');
    if (processInboxBtn) {
      processInboxBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the parent GTD menu item
        this.processInbox();
      });
    }

    // Massive Action button
    const massiveActionBtn = document.getElementById('massive-action-btn');
    if (massiveActionBtn) {
      massiveActionBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the parent GTD menu item
        this.startMassiveAction();
      });
    }

    // Set up view toggle buttons
    const cardViewBtn = document.getElementById('card-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (cardViewBtn && listViewBtn) {
      // Set initial active state
      if (this.currentView === 'list') {
        cardViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
      }

      cardViewBtn.addEventListener('click', () => {
        this.currentView = 'card';
        localStorage.setItem('preferredView', 'card');
        cardViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        this.renderItems(this.filteredItems);
      });

      listViewBtn.addEventListener('click', () => {
        this.currentView = 'list';
        localStorage.setItem('preferredView', 'list');
        listViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
        this.renderItems(this.filteredItems);
      });
    }

    // Set up search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.applyFilters();
      });
    }

    // Set up GTD menu items
    const gtdMenuItems = document.querySelectorAll('.gtd-menu-item');
    gtdMenuItems.forEach((item) => {
      item.addEventListener('click', () => {
        // Update active state
        gtdMenuItems.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');

        // Apply GTD filter
        const stage = item.getAttribute('data-gtd-stage');
        this.filterByGTDStage(stage);
      });
    });

    // Set up modal close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Add item click handling for item details
    document.addEventListener('click', (e) => {
      // Find closest item-card or list-item
      const itemEl = e.target.closest('.item-card') || e.target.closest('.list-item');

      // If clicked on an item but not on a button
      if (itemEl && !e.target.closest('button')) {
        const itemId = parseInt(itemEl.getAttribute('data-id'), 10);
        const item = this.allItems.find((i) => i.id === itemId);
        if (item) {
          this.showFullscreenDetail(item);
        }
      }
    });
  }

  async loadItems() {
    try {
      if (window.DataStore && typeof window.DataStore.getAllItems === 'function') {
        this.allItems = await window.DataStore.getAllItems();
        this.filteredItems = [...this.allItems];
        return this.allItems;
      } else {
        console.error('DataStore.getAllItems is not available');
        this.allItems = [];
        this.filteredItems = [];
        return [];
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      return [];
    }
  }

  // After: In review/review-controller.js (applyFilters method)
  applyFilters() {
    // Start with all items
    let filtered = [...this.allItems];

    // Apply type filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === this.currentFilter);
    }

    // Apply search filter if present
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(searchTerm)) ||
          (item.text && item.text.toLowerCase().includes(searchTerm)) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Save current filter to localStorage
    localStorage.setItem('currentFilter', this.currentFilter);

    // If we're in a GTD workflow view, save that we're not in a specific stage
    if (this.activeWorkflowView === 'gtd') {
      this.currentGtdStage = null;
      localStorage.removeItem('currentGtdStage');
    }

    // Update filtered items and render
    this.filteredItems = filtered;
    this.renderItems(filtered);
  }
  /**
   * Filters items to display only those in a specific GTD stage
   * Saves the stage selection to localStorage for persistence across navigation
   * Updates UI to reflect the selected GTD stage
   *
   * @param {string} stage - The GTD stage to filter by (inbox, next-actions, etc.)
   */
  filterByGTDStage(stage) {
    // Save current GTD stage to localStorage for persistence
    localStorage.setItem('currentGtdStage', stage);
    this.currentGtdStage = stage;

    // Update visual indication in the UI
    const gtdMenuItems = document.querySelectorAll('.gtd-menu-item');
    gtdMenuItems.forEach((item) => {
      if (item.getAttribute('data-gtd-stage') === stage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Filter items to show only those in the selected GTD stage
    const filtered = this.allItems.filter((item) => {
      // Default to inbox if no GTD stage is set
      const itemStage = item.gtdStage || 'inbox';
      return itemStage === stage;
    });

    this.filteredItems = filtered;
    this.renderItems(filtered);
  }

  renderItems(items) {
    const container = document.getElementById('items-grid');
    const emptyState = document.getElementById('empty-state');

    if (!container) return;

    // Show empty state if no items
    if (!items || items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    // Hide empty state
    if (emptyState) emptyState.classList.add('hidden');

    // Set container class based on view
    container.className = this.currentView === 'list' ? 'items-list' : 'items-grid';
    container.innerHTML = '';

    // Render items
    items.forEach((item) => {
      let element;
      if (this.currentView === 'list') {
        element = this.createListItem(item);
      } else {
        element = this.createCardItem(item);
      }
      container.appendChild(element);
    });
  }

  createCardItem(item) {
    // Use ItemRenderer if available
    if (window.ItemRenderer && typeof window.ItemRenderer.createItemCard === 'function') {
      return window.ItemRenderer.createItemCard(item, this.handleItemAction.bind(this));
    }

    // Fallback implementation
    const card = document.createElement('div');
    card.className = `item-card ${item.type}-type`;
    card.setAttribute('data-id', item.id);

    // Basic card structure with action buttons
    card.innerHTML = `
      <div class="item-screenshot">
        <img src="${item.screenshot || ''}" alt="Screenshot">
      </div>
      <div class="item-details">
        <h3 class="item-title">${item.title || 'No Title'}</h3>
        <p class="item-text">${item.text || 'No description'}</p>
        <div class="item-actions">
          <button class="btn btn-open" data-action="open" data-id="${item.id}">Open</button>
          <button class="btn btn-edit" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="btn btn-delete" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;

    // Add event listeners
    card.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'), 10);
        this.handleItemAction(action, id, item);
      });
    });

    return card;
  }

  createListItem(item) {
    const listItem = document.createElement('div');
    listItem.className = `list-item ${item.type}-type`;
    listItem.setAttribute('data-id', item.id);

    // Create list item HTML
    listItem.innerHTML = `
      <div class="item-thumbnail">
        <img src="${item.screenshot || ''}" alt="">
      </div>
      <div class="item-summary">
        <div class="item-title">${item.title || 'No Title'}</div>
        <div class="item-text">${item.text || 'No description'}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-open" data-action="open" data-id="${item.id}">Open</button>
        <button class="btn btn-edit" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-delete" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;

    // Add event listeners
    listItem.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'), 10);
        this.handleItemAction(action, id, item);
      });
    });

    return listItem;
  }

  async handleItemAction(action, id, item) {
    switch (action) {
      case 'open':
        if (item.url) {
          chrome.tabs.create({ url: item.url });
        }
        break;

      case 'edit':
        this.showFullscreenDetail(item);
        break;

      case 'delete':
        if (confirm('Are you sure you want to delete this item?')) {
          if (window.DataStore && typeof window.DataStore.deleteItem === 'function') {
            await window.DataStore.deleteItem(id);
            await this.loadItems();
            this.applyFilters();
          }
        }
        break;

      case 'process':
        if (window.GTDProcessor && typeof window.GTDProcessor.showProcessingDialog === 'function') {
          window.GTDProcessor.showProcessingDialog(item);
        }
        break;
    }
  }

  showFullscreenDetail(item) {
    // Create or get full-screen detail view
    let detailView = document.getElementById('fullscreen-detail-view');

    if (!detailView) {
      detailView = document.createElement('div');
      detailView.id = 'fullscreen-detail-view';
      detailView.className = 'fullscreen-detail';
      document.querySelector('.app-content').appendChild(detailView);
    }

    // Content similar to modal but fullscreen
    detailView.innerHTML = `
      <div class="detail-header">
        <h2>${item.title || 'Item Detail'}</h2>
        <button class="close-detail-btn">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-left">
          <div class="detail-screenshot">
            <img src="${item.screenshot || ''}" alt="Screenshot">
          </div>
          <div class="detail-url">
            <a href="${item.url || '#'}" target="_blank" class="open-url-btn">
              ${item.url || 'No URL'}</a>
          </div>
        </div>
        <div class="detail-right">
          <div class="detail-section">
            <label for="detail-text">Description</label>
            <textarea id="detail-text" class="detail-text">${item.text || ''}</textarea>
          </div>
          <div class="detail-section">
            <label for="detail-status">Status</label>
            <select id="detail-status">
              <option value="todo" ${item.type === 'todo' ? 'selected' : ''}>Todo</option>
              <option value="inprogress" ${
                item.type === 'inprogress' ? 'selected' : ''
              }>In Progress</option>
              <option value="waiting" ${
                item.type === 'waiting' ? 'selected' : ''
              }>Waiting For</option>
              <option value="completed" ${
                item.type === 'completed' ? 'selected' : ''
              }>Completed</option>
            </select>
          </div>
          <div class="detail-section">
            <label>Tags</label>
            <div id="detail-tags"></div>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button id="save-detail-btn" class="btn btn-primary">Save Changes</button>
        <button id="process-detail-btn" class="btn btn-process">Process (GTD)</button>
        <button id="close-detail-btn" class="btn">Close</button>
      </div>
    `;

    // Tag management
    if (window.TagManager) {
      const tagContainer = document.getElementById('detail-tags');
      const tagManager = new window.TagManager(tagContainer);
      tagManager.setTags(item.tags || []);
    }

    // Show detail view
    detailView.classList.add('active');

    // Set up event listeners
    document.querySelector('.close-detail-btn').addEventListener('click', () => {
      detailView.classList.remove('active');
    });

    document.getElementById('close-detail-btn').addEventListener('click', () => {
      detailView.classList.remove('active');
    });

    document.getElementById('save-detail-btn').addEventListener('click', async () => {
      const updatedItem = { ...item };
      updatedItem.text = document.getElementById('detail-text').value;
      updatedItem.type = document.getElementById('detail-status').value;

      if (window.TagManager) {
        const tagManager = new window.TagManager(document.getElementById('detail-tags'));
        updatedItem.tags = tagManager.getTags();
      }

      if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
        await window.DataStore.saveItem(updatedItem);
        await this.loadItems();
        this.applyFilters();
        detailView.classList.remove('active');
      } else {
        console.error('DataStore.saveItem is not available');
        alert('Error: Could not save changes. DataStore.saveItem is not available.');
      }
    });

    document.getElementById('process-detail-btn').addEventListener('click', () => {
      if (window.GTDProcessor && typeof window.GTDProcessor.showProcessingDialog === 'function') {
        window.GTDProcessor.showProcessingDialog(item);
        detailView.classList.remove('active');
      } else {
        console.error('GTDProcessor.showProcessingDialog is not available');
        alert('GTD Processing is not available');
      }
    });

    // Make the URL button work correctly
    const urlBtn = document.querySelector('.open-url-btn');
    if (urlBtn && item.url) {
      urlBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        chrome.tabs.create({ url: item.url });
      });
    }
  }

  /**
   * Processes all inbox items sequentially through the GTD workflow
   * Creates a full-screen interactive processing view for the user
   */
  processInbox() {
    // Get all inbox items
    const inboxItems = this.allItems.filter((item) => {
      const itemStage = item.gtdStage || 'inbox';
      return itemStage === 'inbox';
    });

    if (inboxItems.length === 0) {
      this.showToast('No inbox items to process', 'info');
      return;
    }

    // Create and show the full-screen processing view
    this.showProcessInboxView(inboxItems);
  }

  /**
   * Creates and displays a full-screen view for processing inbox items
   * @param {Array} items - Array of inbox items to process
   */
  showProcessInboxView(items) {
    // Create or get the fullscreen view container
    let processView = document.getElementById('process-inbox-view');

    if (!processView) {
      processView = document.createElement('div');
      processView.id = 'process-inbox-view';
      processView.className = 'fullscreen-detail';
      document.querySelector('.app-content').appendChild(processView);
    }

    // Set up the initial content for the first item
    this.setupProcessItemView(processView, items, 0);

    // Show the view
    processView.classList.add('active');
  }

  /**
   * Configures the process view for a specific inbox item
   * @param {HTMLElement} container - The process view container
   * @param {Array} items - All items to process
   * @param {number} index - Current item index
   */
  setupProcessItemView(container, items, index) {
    if (index >= items.length) {
      // All items processed, show completion screen
      container.innerHTML = `
      <div class="detail-header">
        <h2>Processing Complete</h2>
        <button class="close-detail-btn">×</button>
      </div>
      <div class="process-completion">
        <p>All inbox items have been processed!</p>
        <button id="close-process-btn" class="btn btn-primary">Close</button>
      </div>
    `;

      document.querySelector('.close-detail-btn').addEventListener('click', () => {
        container.classList.remove('active');
      });

      document.getElementById('close-process-btn').addEventListener('click', () => {
        container.classList.remove('active');
      });

      return;
    }

    const item = items[index];

    // Create the GTD processing view for this item
    container.innerHTML = `
  <div class="detail-header">
    <h2>Process Inbox Item ${index + 1} of ${items.length}</h2>
    <button class="close-process-btn">×</button>
  </div>
  <div class="gtd-processing-content">
    <div class="gtd-processing-step">
      <h3>Is this item actionable?</h3>
      <div class="gtd-coaching">
        <p>In GTD, an item is <strong>actionable</strong> if it requires you to do something. Ask yourself:</p>
        <ul>
          <li>Does this require me to take action?</li>
          <li>Do I need to do something with this information?</li>
          <li>Will this lead to a concrete next step?</li>
        </ul>
        <p>If yes, select "Actionable" - otherwise, choose "Not Actionable" for items you just want to reference or discard.</p>
      </div>
      
      <div class="gtd-question-main-content">
        <div class="preview-screenshot-large">
          <img src="${item.screenshot}" alt="Screenshot">
        </div>
        <div class="preview-info-detailed">
          <div class="preview-title-large">${item.title}</div>
          <div class="preview-url">${item.url || ''}</div>
          <div class="preview-text-scrollable">${item.text || 'No description'}</div>
          
          <div class="item-notes-section">
            <label for="item-processing-notes">Processing Notes:</label>
            <textarea id="item-processing-notes" placeholder="Add your processing thoughts here..."></textarea>
          </div>
        </div>
      </div>
      
      <div class="gtd-decision-actions">
        <div class="decision-main-options">
          <button class="gtd-btn yes-btn" id="actionable-yes">
            <span class="btn-icon">✓</span>
            <span class="btn-label">Actionable</span>
            <span class="btn-desc">I need to do something with this</span>
          </button>
          <button class="gtd-btn no-btn" id="actionable-no">
            <span class="btn-icon">✗</span>
            <span class="btn-label">Not Actionable</span>
            <span class="btn-desc">Just reference or discard</span>
          </button>
        </div>
        
        <div class="quick-file-options">
          <p>Quick file:</p>
          <button class="quick-file-btn" data-target="next-actions">Next Action</button>
          <button class="quick-file-btn" data-target="reference">Reference</button>
          <button class="quick-file-btn" data-target="brainstorm">Brainstorm</button>
          <button class="quick-file-btn" data-target="delegate">Delegate</button>
          <button class="quick-file-btn" data-target="someday">Someday</button>
          <button class="quick-file-btn" data-target="trash">Trash</button>
        </div>
      </div>
    </div>
  </div>
  <div class="process-navigation">
    <div class="process-progress">
      <div class="progress-bar" style="width: ${(index / items.length) * 100}%"></div>
    </div>
    <span class="process-count">${index + 1} of ${items.length}</span>
    <button class="skip-btn" id="skip-item-btn">Skip Item</button>
  </div>
`;

    // Set up event listeners
    document.querySelector('.close-process-btn').addEventListener('click', () => {
      container.classList.remove('active');
    });

    document.getElementById('actionable-yes').addEventListener('click', () => {
      this.showActionableOptions(container, items, index, item);
    });

    document.getElementById('actionable-no').addEventListener('click', () => {
      this.showNonActionableOptions(container, items, index, item);
    });

    // Set up quick-file buttons
    document.querySelectorAll('.quick-file-btn').forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const target = button.getAttribute('data-target');
        const notes = document.getElementById('item-processing-notes')?.value || '';

        switch (target) {
          case 'next-actions':
            await this.processAsNextAction(item);
            break;
          case 'reference':
            await this.processAsReference(item);
            break;
          case 'brainstorm':
            // Get notes if present
            await this.saveItemWithBrainstormNotes(item, notes);
            break;
          case 'delegate':
            // We need more info, so show the delegation form
            this.showDelegationOptions(container, items, index, item);
            return; // Don't advance to next item yet
          case 'someday':
            await this.processAsSomeday(item);
            break;
          case 'trash':
            await this.processAsTrash(item);
            break;
        }

        // Move to next item
        this.setupProcessItemView(container, items, index + 1);
      });
    });

    // Set up skip button
    document.getElementById('skip-item-btn').addEventListener('click', () => {
      this.setupProcessItemView(container, items, index + 1);
    });

    document.querySelectorAll('.quick-file-btn').forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling

        const target = button.getAttribute('data-target');
        const notes = document.getElementById('item-processing-notes')?.value || '';

        try {
          switch (target) {
            case 'next-actions':
              await this.processAsNextAction(item);
              break;
            case 'reference':
              await this.processAsReference(item);
              break;
            case 'brainstorm':
              // Get notes if present
              await this.saveItemWithBrainstormNotes(item, notes);
              break;
            case 'delegate':
              // We need more info, so show the delegation form
              this.showDelegationOptions(container, items, index, item);
              return; // Don't advance to next item yet
            case 'someday':
              await this.processAsSomeday(item);
              break;
            case 'trash':
              await this.processAsTrash(item);
              break;
          }

          // Show confirmation
          this.showToast(`Item filed as ${target.replace('-', ' ')}`, 'success');

          // Move to next item
          this.setupProcessItemView(container, items, index + 1);
        } catch (error) {
          console.error(`Error quick-filing to ${target}:`, error);
          this.showToast(`Error filing item: ${error.message}`, 'error');
        }
      });
    });

    // Set up skip button
    document.getElementById('skip-item-btn').addEventListener('click', () => {
      this.setupProcessItemView(container, items, index + 1);
    });
  }

  /**
   * Shows options for actionable items (Next Action, Delegate, etc)
   * Guides user through the GTD decision process for actionable items
   */
  showActionableOptions(container, items, index, item) {
    container.querySelector('.gtd-processing-content').innerHTML = `
  <div class="gtd-processing-step">
    <h3>What's the next step?</h3>
    
    <div class="gtd-coaching">
      <p>Now that you've determined this is actionable, decide on the appropriate next step:</p>
      <ul>
        <li><strong>Next Action</strong>: A concrete, specific task that you can do</li>
        <li><strong>Brainstorm</strong>: This needs more thought before you can determine actions</li>
        <li><strong>Delegate</strong>: Someone else should handle this</li>
        <li><strong>Defer</strong>: You'll deal with this later (Someday/Maybe)</li>
      </ul>
    </div>
    
    <div class="gtd-question-main-content">
      <div class="preview-screenshot-large">
        <img src="${item.screenshot}" alt="Screenshot">
      </div>
      <div class="preview-info-detailed">
        <div class="preview-title-large">${item.title}</div>
        <div class="preview-url">${item.url || ''}</div>
        <div class="preview-text-scrollable">${item.text || 'No description'}</div>
        
        <!-- Display processing notes if they exist -->
        <div class="processing-notes-display" id="processing-notes-display">
          ${
            document.getElementById('item-processing-notes')?.value
              ? `<div class="notes-label">Your processing notes:</div>
             <div class="notes-content">${
               document.getElementById('item-processing-notes').value
             }</div>`
              : ''
          }
        </div>
      </div>
    </div>
    
    <div class="next-step-options">
      <div class="next-step-option" id="option-next-action">
        <span class="option-icon">✓</span>
        <span class="option-title">Next Action</span>
        <span class="option-desc">I need to do this</span>
      </div>
      
      <div class="next-step-option" id="option-brainstorm">
        <span class="option-icon">💭</span>
        <span class="option-title">Brainstorm</span>
        <span class="option-desc">Need to think about this</span>
      </div>
      
      <div class="next-step-option" id="option-delegate">
        <span class="option-icon">👥</span>
        <span class="option-title">Delegate</span>
        <span class="option-desc">Someone else should do it</span>
      </div>
      
      <div class="next-step-option" id="option-defer">
        <span class="option-icon">⏱️</span>
        <span class="option-title">Defer</span>
        <span class="option-desc">Do it later (Someday)</span>
      </div>
    </div>
    
    <button class="gtd-btn back-btn" id="back-to-actionable">← Back</button>
  </div>
`;

    // Set up event listeners
    document.getElementById('option-next-action').addEventListener('click', async () => {
      await this.processAsNextAction(item);
      this.setupProcessItemView(container, items, index + 1);
    });

    // In showActionableOptions function in review-controller.js
    document.getElementById('option-brainstorm').addEventListener('click', async () => {
      try {
        // Show a brainstorming interface first
        this.showBrainstormInterface(container, items, index, item);
      } catch (error) {
        console.error('Error showing brainstorm interface:', error);
        // Fallback - just process as brainstorm directly
        await this.processAsBrainstorm(item);
        this.setupProcessItemView(container, items, index + 1);
      }
    });

    document.getElementById('option-delegate').addEventListener('click', () => {
      this.showDelegationOptions(container, items, index, item);
    });

    document.getElementById('option-defer').addEventListener('click', async () => {
      await this.processAsSomeday(item);
      this.setupProcessItemView(container, items, index + 1);
    });

    document.getElementById('back-to-actionable').addEventListener('click', () => {
      this.setupProcessItemView(container, items, index);
    });
  }

  /**
   * Shows options for non-actionable items (Reference, Trash, etc)
   * Guides user through the GTD decision process for non-actionable items
   */
  showNonActionableOptions(container, items, index, item) {
    container.querySelector('.gtd-processing-content').innerHTML = `

  <div class="gtd-processing-step">
    <h3>What's the next step?</h3>
    
    <div class="gtd-question-preview">
      <div class="preview-info">
        <div class="preview-title">${item.title}</div>
      </div>
    </div>
    
    <div class="gtd-actions">
      <button class="gtd-btn next-action-btn" id="option-next-action">
        <span class="btn-icon">▶️</span>
        <span class="btn-label">Next Action</span>
        <span class="btn-desc">I need to do this</span>
      </button>
      
      <button class="gtd-btn brainstorm-btn" id="option-brainstorm">
        <span class="btn-icon">🧠</span>
        <span class="btn-label">Brainstorm</span>
        <span class="btn-desc">Need to think about this</span>
      </button>
      
      <button class="gtd-btn delegate-btn" id="option-delegate">
        <span class="btn-icon">👥</span>
        <span class="btn-label">Delegate</span>
        <span class="btn-desc">Someone else should do it</span>
      </button>
      
      <button class="gtd-btn defer-btn" id="option-defer">
        <span class="btn-icon">📅</span>
        <span class="btn-label">Defer</span>
        <span class="btn-desc">Do it later (Someday)</span>
      </button>
    </div>
    
    <button class="gtd-btn back-btn" id="back-to-actionable">← Back</button>
  </div>




  `;

    // Set up event listeners
    document.getElementById('option-reference').addEventListener('click', async () => {
      await this.processAsReference(item);
      this.setupProcessItemView(container, items, index + 1);
    });

    document.getElementById('option-trash').addEventListener('click', async () => {
      await this.processAsTrash(item);
      this.setupProcessItemView(container, items, index + 1);
    });

    document.getElementById('back-to-actionable').addEventListener('click', () => {
      this.setupProcessItemView(container, items, index);
    });
  }

  /**
   * Shows delegation options with form fields
   * Allows user to specify who to delegate to and follow-up date
   */
  showDelegationOptions(container, items, index, item) {
    container.querySelector('.gtd-processing-content').innerHTML = `
    <div class="gtd-processing-step">
      <h3>Delegate to someone</h3>
      
      <div class="delegation-form">
        <div class="form-group">
          <label for="delegate-to">Who should do this?</label>
          <input type="text" id="delegate-to" placeholder="Enter name or email">
        </div>
        
        <div class="form-group">
          <label for="delegate-date">Follow up date</label>
          <input type="date" id="delegate-date">
        </div>
        
        <div class="form-group">
          <label for="delegate-notes">Notes (optional)</label>
          <textarea id="delegate-notes" placeholder="Notes about what needs to be done"></textarea>
        </div>
      </div>
      
      <div class="gtd-actions">
        <button class="gtd-btn delegate-save-btn" id="save-delegation">Save as To Delegate</button>
      </div>
      
      <button class="gtd-btn back-btn" id="back-to-options">← Back</button>
    </div>
  `;

    // Set current date as default
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('delegate-date').value = formattedDate;

    // Set up event listeners
    document.getElementById('save-delegation').addEventListener('click', async () => {
      const delegateTo = document.getElementById('delegate-to').value;
      const delegateDate = document.getElementById('delegate-date').value;
      const delegateNotes = document.getElementById('delegate-notes').value;

      if (!delegateTo) {
        alert('Please enter who this should be delegated to');
        return;
      }

      await this.processAsDelegate(item, delegateTo, delegateDate, delegateNotes);
      this.setupProcessItemView(container, items, index + 1);
    });

    document.getElementById('back-to-options').addEventListener('click', () => {
      this.showActionableOptions(container, items, index, item);
    });
  }

  /**
   * Processes an item as a Next Action
   * Updates its GTD stage and relevant tags
   */
  async processAsNextAction(item) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'next-actions';
      updatedItem.type = 'inprogress';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:next-action');

      await window.DataStore.saveItem(updatedItem);
      this.showToast('Item moved to Next Actions', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error processing as Next Action:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  /**
   * Processes an item for Brainstorming
   * Updates its GTD stage and relevant tags
   */
  async processAsBrainstorm(item) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'brainstorm';
      updatedItem.type = 'inprogress';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:brainstorm');

      await window.DataStore.saveItem(updatedItem);
      this.showToast('Item moved to Brainstorm', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error processing as Brainstorm:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  /**
   * Displays an interface for brainstorming about an item
   * Provides a focused environment for thinking and note-taking
   *
   * @param {HTMLElement} container - The container element
   * @param {Array} items - All items being processed
   * @param {number} index - Current item index
   * @param {Object} item - The current item
   */
  showBrainstormInterface(container, items, index, item) {
    container.querySelector('.gtd-processing-content').innerHTML = `
    <div class="gtd-processing-step">
      <h3>Brainstorm: ${item.title}</h3>
      
      <div class="gtd-coaching">
        <p>Take some time to think about this item. Brainstorming helps you:</p>
        <ul>
          <li>Clarify what this item means to you</li>
          <li>Think through possible approaches</li>
          <li>Generate ideas for how to tackle it</li>
        </ul>
      </div>
      
      <div class="brainstorm-content">
        <div class="preview-screenshot-medium">
          <img src="${item.screenshot}" alt="Screenshot">
        </div>
        
        <div class="brainstorm-note-area">
          <label for="brainstorm-notes">Your Brainstorming Notes:</label>
          <textarea id="brainstorm-notes" placeholder="Write your thoughts, ideas, and approaches here..." rows="10"></textarea>
        </div>
      </div>
      
      <div class="brainstorm-actions">
        <button id="save-brainstorm" class="gtd-btn primary-btn">Save as Brainstorm Item</button>
        <button id="convert-to-actions" class="gtd-btn secondary-btn">Convert to Next Actions</button>
        <button id="back-to-options" class="gtd-btn back-btn">← Back</button>
      </div>
    </div>
  `;

    // Save brainstorm
    document.getElementById('save-brainstorm').addEventListener('click', async () => {
      const notes = document.getElementById('brainstorm-notes').value;
      await this.saveItemWithBrainstormNotes(item, notes);
      this.setupProcessItemView(container, items, index + 1);
    });

    // Convert to actions
    document.getElementById('convert-to-actions').addEventListener('click', () => {
      const notes = document.getElementById('brainstorm-notes').value;
      this.showNextActionsFromBrainstorm(container, items, index, item, notes);
    });

    // Back button
    document.getElementById('back-to-options').addEventListener('click', () => {
      this.showActionableOptions(container, items, index, item);
    });
  }

  /**
   * Saves an item with brainstorming notes to the brainstorm category
   *
   * @param {Object} item - The item being processed
   * @param {string} notes - Brainstorming notes
   */
  async saveItemWithBrainstormNotes(item, notes) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'brainstorm';
      updatedItem.type = 'inprogress';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:brainstorm');

      // Add brainstorm notes to the item
      if (notes) {
        updatedItem.brainstormNotes = notes;

        // Also update the regular text field for compatibility
        updatedItem.text = updatedItem.text
          ? `${updatedItem.text}\n\n--- Brainstorm Notes ---\n${notes}`
          : `--- Brainstorm Notes ---\n${notes}`;
      }

      await window.DataStore.saveItem(updatedItem);
      this.showToast('Item saved to Brainstorm with your notes', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error saving brainstorm notes:', error);
      this.showToast('Error saving your notes', 'error');
      return false;
    }
  }

  /**
   * Shows an interface for converting brainstorm notes into next actions
   *
   * @param {HTMLElement} container - The container element
   * @param {Array} items - All items being processed
   * @param {number} index - Current item index
   * @param {Object} item - The current item
   * @param {string} notes - Brainstorming notes
   */
  showNextActionsFromBrainstorm(container, items, index, item, notes) {
    container.querySelector('.gtd-processing-content').innerHTML = `
    <div class="gtd-processing-step">
      <h3>Create Next Actions from Brainstorm</h3>
      
      <div class="gtd-coaching">
        <p>Great brainstorming! Now break this down into concrete next actions.</p>
        <p>Each next action should be a specific, physical task you can complete.</p>
      </div>
      
      <div class="brainstorm-to-actions">
        <div class="brainstorm-notes-display">
          <h4>Your Brainstorm Notes</h4>
          <div class="notes-display">${notes || 'No notes provided'}</div>
        </div>
        
        <div class="next-actions-input">
          <h4>Next Actions</h4>
          <div id="next-actions-list">
            <div class="next-action-item">
              <input type="text" class="next-action-input" placeholder="Enter a concrete next action...">
              <button class="remove-action-btn">×</button>
            </div>
          </div>
          <button id="add-next-action" class="add-action-btn">+ Add Another Action</button>
        </div>
      </div>
      
      <div class="brainstorm-actions">
        <button id="save-next-actions" class="gtd-btn primary-btn">Save Next Actions</button>
        <button id="back-to-brainstorm" class="gtd-btn back-btn">← Back to Brainstorm</button>
      </div>
    </div>
  `;

    // Add next action button
    document.getElementById('add-next-action').addEventListener('click', () => {
      const actionsList = document.getElementById('next-actions-list');
      const newActionItem = document.createElement('div');
      newActionItem.className = 'next-action-item';
      newActionItem.innerHTML = `
      <input type="text" class="next-action-input" placeholder="Enter a concrete next action...">
      <button class="remove-action-btn">×</button>
    `;
      actionsList.appendChild(newActionItem);

      // Add event listener to the new remove button
      newActionItem.querySelector('.remove-action-btn').addEventListener('click', () => {
        actionsList.removeChild(newActionItem);
      });
    });

    // Set up existing remove buttons
    document.querySelectorAll('.remove-action-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const actionItem = button.closest('.next-action-item');
        if (actionItem.parentNode.children.length > 1) {
          actionItem.parentNode.removeChild(actionItem);
        } else {
          actionItem.querySelector('.next-action-input').value = '';
        }
      });
    });

    // Save next actions
    document.getElementById('save-next-actions').addEventListener('click', async () => {
      const actionInputs = document.querySelectorAll('.next-action-input');
      const nextActions = Array.from(actionInputs)
        .map((input) => input.value.trim())
        .filter((text) => text.length > 0);

      if (nextActions.length === 0) {
        this.showToast('Please enter at least one next action', 'error');
        return;
      }

      await this.saveNextActionsFromBrainstorm(item, notes, nextActions);
      this.setupProcessItemView(container, items, index + 1);
    });

    // Back button
    document.getElementById('back-to-brainstorm').addEventListener('click', () => {
      this.showBrainstormInterface(container, items, index, item);
    });
  }

  /**
   * Saves next actions created from a brainstorming session
   *
   * @param {Object} item - The original item
   * @param {string} notes - Brainstorming notes
   * @param {Array} nextActions - List of next actions
   */
  async saveNextActionsFromBrainstorm(item, notes, nextActions) {
    try {
      // Save the original item as a reference with brainstorm notes
      const referenceItem = { ...item };
      referenceItem.gtdStage = 'reference';
      referenceItem.systemTags = referenceItem.systemTags || [];
      referenceItem.systemTags.push('gtd:reference');
      referenceItem.systemTags.push('brainstorm-source');

      if (notes) {
        referenceItem.brainstormNotes = notes;
        referenceItem.text = referenceItem.text
          ? `${referenceItem.text}\n\n--- Brainstorm Notes ---\n${notes}`
          : `--- Brainstorm Notes ---\n${notes}`;
      }

      await window.DataStore.saveItem(referenceItem);

      // Create next action items
      let actionsCreated = 0;

      for (const actionText of nextActions) {
        const actionItem = {
          id: Date.now() + actionsCreated, // Ensure unique IDs
          title: `Next Action: ${actionText.substring(0, 50)}${
            actionText.length > 50 ? '...' : ''
          }`,
          text: actionText,
          type: 'inprogress',
          gtdStage: 'next-actions',
          url: item.url,
          screenshot: item.screenshot,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          systemTags: ['gtd:next-action', 'from-brainstorm'],
          sourceItemId: item.id // Reference to original item
        };

        await window.DataStore.saveItem(actionItem);
        actionsCreated++;
      }

      this.showToast(`Created ${actionsCreated} next actions from your brainstorm`, 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error saving next actions:', error);
      this.showToast('Error creating next actions', 'error');
      return false;
    }
  }

  /**
   * Processes an item for Delegation
   * Updates its GTD stage, adds delegation details, and relevant tags
   */
  async processAsDelegate(item, delegateTo, delegateDate, delegateNotes) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'to-delegate';
      updatedItem.type = 'waiting';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:to-delegate');
      updatedItem.delegateTo = delegateTo;
      updatedItem.delegateDate = delegateDate;

      // Add notes if provided
      if (delegateNotes) {
        updatedItem.text = updatedItem.text
          ? `${updatedItem.text}\n\n--- Delegation Notes ---\n${delegateNotes}`
          : delegateNotes;
      }

      await window.DataStore.saveItem(updatedItem);
      this.showToast(`Item delegated to ${delegateTo}`, 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error processing as Delegate:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  /**
   * Processes an item as Someday/Maybe
   * Updates its GTD stage and relevant tags
   */
  async processAsSomeday(item) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'someday';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:someday');

      await window.DataStore.saveItem(updatedItem);
      this.showToast('Item deferred to Someday/Maybe', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error processing as Someday:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  /**
   * Processes an item as Reference material
   * Updates its GTD stage and relevant tags
   */
  async processAsReference(item) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = 'reference';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:reference');

      await window.DataStore.saveItem(updatedItem);
      this.showToast('Item saved as Reference', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error processing as Reference:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  /**
   * Processes an item as Trash (deletes the item)
   * Removes it from storage completely
   */
  async processAsTrash(item) {
    try {
      await window.DataStore.deleteItem(item.id);
      this.showToast('Item moved to trash', 'success');
      await this.loadItems();
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      this.showToast('Error processing item', 'error');
      return false;
    }
  }

  async loadTags() {
    try {
      if (window.DataStore && typeof window.DataStore.getAllTags === 'function') {
        const tags = await window.DataStore.getAllTags();
        const tagList = document.getElementById('tag-list');

        if (!tagList) return;

        if (!tags || tags.length === 0) {
          tagList.innerHTML = '<div class="empty-tags">No tags yet</div>';
          return;
        }

        tagList.innerHTML = '';
        tags.forEach((tag) => {
          const tagEl = document.createElement('div');
          tagEl.className = 'sidebar-tag';
          tagEl.textContent = tag;
          tagEl.addEventListener('click', () => {
            // Toggle active class
            tagEl.classList.toggle('active');

            // Filter by active tags
            const activeTags = Array.from(document.querySelectorAll('.sidebar-tag.active')).map(
              (el) => el.textContent
            );

            if (activeTags.length > 0) {
              const filtered = this.allItems.filter(
                (item) => item.tags && item.tags.some((tag) => activeTags.includes(tag))
              );
              this.filteredItems = filtered;
              this.renderItems(filtered);
            } else {
              // No active tags, show all (filtered by current filter)
              this.applyFilters();
            }
          });
          tagList.appendChild(tagEl);
        });
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  setupRealTimeUpdates() {
    if (window.DataStore && typeof window.DataStore.on === 'function') {
      window.DataStore.on('items-changed', async () => {
        await this.loadItems();
        this.applyFilters();
        this.updateGTDCounts();
      });
    }
  }

  async updateGTDCounts() {
    if (!window.DataStore || typeof window.DataStore.getAllItems !== 'function') return;

    try {
      const items = await window.DataStore.getAllItems();

      // Count items for each GTD stage
      const counts = {
        inbox: 0,
        'next-actions': 0,
        'waiting-for': 0,
        someday: 0,
        reference: 0,
        completed: 0
      };

      items.forEach((item) => {
        // Default to inbox if no GTD stage
        const stage = item.gtdStage || 'inbox';
        if (counts[stage] !== undefined) {
          counts[stage]++;
        }
      });

      // Update counts in UI
      Object.keys(counts).forEach((stage) => {
        const countEl = document.getElementById(`${stage}-count`);
        if (countEl) {
          countEl.textContent = counts[stage];
        }
      });
    } catch (error) {
      console.error('Error updating GTD counts:', error);
    }
  }
}

// Create global instance
window.reviewController = new ReviewController();

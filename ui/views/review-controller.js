class ReviewController {
  constructor() {
    this.currentFilter = 'all';
    this.allItems = [];
    this.currentItems = [];
  }

  // Main initialization function
  async initialize() {
    try {
      // Load items
      await this.loadItems();

      // Set up view toggle
      window.viewController.setupViewToggle();

      // Set up filter buttons
      this.setupFilterButtons();

      // Set up search
      this.setupSearch();

      // Set up capture button
      this.setupCaptureButton();

      // Set up modal close button
      this.setupModalCloseButton();

      // Set up real-time updates
      this.setupRealTimeUpdates();

      // Set up GTD functionality
      this.setupGTDFunctionality();

      // Load tags for sidebar
      await this.loadTags();
    } catch (error) {
      console.error('Error initializing review page:', error);
    }
  }

  // Set up filter buttons
  setupFilterButtons() {
    var filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach((btn) => {
          btn.classList.remove('active');
        });
        button.classList.add('active');

        // Apply filter
        this.currentFilter = button.getAttribute('data-filter');
        this.filterItems();
      });
    });
  }

  // Set up search functionality
  setupSearch() {
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        var searchTerm = e.target.value.toLowerCase();
        this.filterItems(searchTerm);
      });
    }
  }

  // Set up capture button
  setupCaptureButton() {
    var captureButton = document.getElementById('capture-current-btn');
    if (captureButton) {
      captureButton.addEventListener('click', () => {
        // Open capture popup
        chrome.windows.create({
          url: chrome.runtime.getURL('capture/capture-popup.html'),
          type: 'popup',
          width: 500,
          height: 600
        });
      });
    }
  }

  // Set up modal close button
  setupModalCloseButton() {
    var closeButton = document.querySelector('.close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        var modal = document.getElementById('item-detail-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    }
  }

  // Set up real-time updates
  setupRealTimeUpdates() {
    if (window.DataStore && typeof window.DataStore.on === 'function') {
      window.DataStore.on('items-changed', async () => {
        await this.loadItems();
        this.filterItems();
        this.updateGTDCounts();
      });
    } else {
      console.warn('Real-time updates not available - DataStore.on method missing');
    }
  }

  // Set up GTD functionality
  setupGTDFunctionality() {
    // Add event listeners to GTD menu items
    var gtdMenuItems = document.querySelectorAll('.gtd-menu-item');
    gtdMenuItems.forEach((menuItem) => {
      menuItem.addEventListener('click', () => {
        // Update active status
        gtdMenuItems.forEach((item) => {
          item.classList.remove('active');
        });
        menuItem.classList.add('active');

        // Get the GTD stage
        var stage = menuItem.getAttribute('data-gtd-stage');

        // Filter items by GTD stage
        this.filterItemsByGTDStage(stage);
      });
    });

    // Setup processing modal close button
    var processingModalCloseBtn = document.querySelector('#gtd-processing-modal .close-btn');
    if (processingModalCloseBtn) {
      processingModalCloseBtn.addEventListener('click', () => {
        document.getElementById('gtd-processing-modal').classList.add('hidden');
      });
    }

    // Update GTD item counts
    this.updateGTDCounts();
  }

  // Filter items by GTD stage
  filterItemsByGTDStage(stage) {
    var filteredItems = this.allItems.filter((item) => {
      return item.gtdStage === stage;
    });

    // If it's inbox items, we want to show processing button
    var isInbox = stage === 'inbox';

    // Store current items
    this.currentItems = filteredItems;

    // Render the filtered items with special handling for inbox
    this.renderItems(filteredItems, isInbox);
  }

  // Update GTD item counts in sidebar
  async updateGTDCounts() {
    if (!window.DataStore || typeof window.DataStore.getAllItems !== 'function') {
      console.error('DataStore not available for counting GTD items');
      return;
    }

    try {
      // Get all items
      const items = await window.DataStore.getAllItems();

      // Count items by GTD stage
      const counts = {
        inbox: 0,
        'next-actions': 0,
        'waiting-for': 0,
        someday: 0,
        reference: 0,
        completed: 0
      };

      items.forEach((item) => {
        if (item.gtdStage && counts[item.gtdStage] !== undefined) {
          counts[item.gtdStage]++;
        } else if (!item.gtdStage && item.type === 'completed') {
          // Default for completed items without explicit GTD stage
          counts['completed']++;
        } else if (!item.gtdStage) {
          // Default for items without GTD stage
          counts['inbox']++;
        }
      });

      // Update the counts in the UI
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

  // Process an inbox item
  processInboxItem(item) {
    if (window.GTDProcessor && typeof window.GTDProcessor.showProcessingDialog === 'function') {
      window.GTDProcessor.showProcessingDialog(item);
    } else {
      console.error('GTDProcessor not available');
      alert('GTD Processing functionality is not available');
    }
  }

  // Load all items
  async loadItems() {
    try {
      if (window.DataStore && typeof window.DataStore.getAllItems === 'function') {
        this.allItems = await window.DataStore.getAllItems();
        this.currentItems = this.allItems;
        this.renderItems(this.allItems);
      } else {
        console.error('DataStore.getAllItems is not available');
        this.allItems = [];
        this.currentItems = [];
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }

  // Load tags for sidebar
  async loadTags() {
    try {
      if (window.DataStore && typeof window.DataStore.getAllTags === 'function') {
        var tags = await window.DataStore.getAllTags();
        var tagList = document.getElementById('tag-list');

        if (!tagList) return;

        if (!tags || tags.length === 0) {
          tagList.innerHTML = '<div class="empty-tags">No tags yet</div>';
          return;
        }

        tagList.innerHTML = '';
        tags.forEach((tag) => {
          var tagEl = document.createElement('div');
          tagEl.className = 'sidebar-tag';
          tagEl.textContent = tag;
          tagEl.addEventListener('click', () => {
            const isAlreadyActive = tagEl.classList.contains('active');

            // Clear all active tags if this is already active (toggle off)
            if (isAlreadyActive) {
              document.querySelectorAll('.sidebar-tag').forEach((t) => {
                t.classList.remove('active');
              });
              // Show all items (filtered by current filter)
              this.filterItems();
            } else {
              // Set this tag as active
              document.querySelectorAll('.sidebar-tag').forEach((t) => {
                t.classList.remove('active');
              });
              tagEl.classList.add('active');
              // Filter by tag
              this.filterItemsByTag(tag);
            }
          });
          tagList.appendChild(tagEl);
        });
      } else {
        console.error('DataStore.getAllTags is not available');
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  // Filter items by tag
  filterItemsByTag(tagName) {
    var filteredItems = this.allItems.filter((item) => {
      return item.tags && item.tags.includes(tagName);
    });
    this.currentItems = filteredItems;
    this.renderItems(filteredItems);
  }

  // Filter items by current filter and search term
  filterItems(searchTerm) {
    if (!searchTerm) searchTerm = '';

    var filtered = [].concat(this.allItems);

    // Apply type filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((item) => {
        return item.type === this.currentFilter;
      });
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.title && item.title.toLowerCase().includes(searchTerm)) ||
          (item.text && item.text.toLowerCase().includes(searchTerm)) ||
          (item.tags &&
            item.tags.some((tag) => {
              return tag.toLowerCase().includes(searchTerm);
            }))
        );
      });
    }

    this.currentItems = filtered;
    this.renderItems(filtered);
  }

  // Render the currently filtered items
  renderCurrentItems() {
    this.renderItems(this.currentItems);
  }

  // Render items based on current view mode
  renderItems(items, isInboxView = false) {
    var itemsContainer = document.getElementById('items-grid');
    var emptyState = document.getElementById('empty-state');

    if (!itemsContainer || !items || items.length === 0) {
      if (itemsContainer) itemsContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    itemsContainer.innerHTML = '';

    // Get current view mode
    const currentViewMode = window.viewController.getCurrentViewMode();

    // Class for container depends on view mode
    itemsContainer.className = currentViewMode === 'list' ? 'items-list' : 'items-grid';

    items.forEach((item) => {
      var element;
      if (currentViewMode === 'list') {
        element = window.viewController.createListItem(item, isInboxView, this.handleItemAction);
      } else {
        element = window.viewController.createCardItem(item, isInboxView, this.handleItemAction);
      }
      itemsContainer.appendChild(element);
    });
  }

  // Handle item action clicks
  async handleItemAction(action, id, item) {
    switch (action) {
      case 'open':
        chrome.tabs.create({ url: item.url });
        break;

      case 'edit':
        window.reviewController.showItemDetail(item);
        break;

      case 'delete':
        if (confirm('Are you sure you want to delete this item?')) {
          if (window.DataStore && typeof window.DataStore.deleteItem === 'function') {
            await window.DataStore.deleteItem(id);
            await window.reviewController.loadItems();
          } else {
            console.error('DataStore.deleteItem is not available');
          }
        }
        break;
    }
  }

  // Show item detail in modal
  showItemDetail(item) {
    var modal = document.getElementById('item-detail-modal');
    var modalContent = modal.querySelector('.modal-content');
    var modalBody = modal.querySelector('.modal-body');
    var modalTitle = document.getElementById('modal-title');

    // Make modal full screen
    modalContent.classList.add('fullscreen-modal');

    modalTitle.textContent = item.title || 'No Title';

    // Build modal content
    var content = document.createElement('div');
    content.className = 'detail-container';

    // Two-column layout
    content.innerHTML = `
      <div class="detail-layout">
        <div class="detail-left-column">
          <div class="detail-screenshot">
            <img src="${item.screenshot || ''}" alt="Screenshot">
          </div>
          <div class="detail-url">
            <a href="${item.url}" target="_blank">${item.url}</a>
          </div>
        </div>
        <div class="detail-right-column">
          <div class="detail-section">
            <label for="edit-text">Description</label>
            <textarea id="edit-text" class="detail-text">${item.text || ''}</textarea>
          </div>
          <div class="detail-section">
            <label>Tags</label>
            <div id="detail-tag-container"></div>
          </div>
          <div class="detail-section">
            <label for="edit-status">Status</label>
            <select id="edit-status" class="modern-select">
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
          <div class="detail-meta">
            <div>Created: ${
              item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'
            }</div>
            <div>Updated: ${
              item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown'
            }</div>
          </div>
        </div>
      </div>
    `;

    // Actions
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'detail-actions';

    var saveBtn = document.createElement('button');
    saveBtn.id = 'save-item';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save Changes';

    var cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit';
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    content.appendChild(actionsDiv);

    // Replace modal content
    modalBody.innerHTML = '';
    modalBody.appendChild(content);

    // Initialize tag manager
    var tagContainer = document.getElementById('detail-tag-container');
    var tagManager = new TagManager(tagContainer);
    tagManager.setTags(item.tags || []);

    // Set up save button
    saveBtn.addEventListener('click', async () => {
      // Get updated values
      var updatedItem = Object.assign({}, item, {
        text: document.getElementById('edit-text').value,
        type: document.getElementById('edit-status').value,
        tags: tagManager.getTags(),
        updatedAt: new Date().toISOString()
      });

      // Update GTD stage based on type if needed
      if (
        updatedItem.type === 'waiting' &&
        (!updatedItem.gtdStage || updatedItem.gtdStage === 'inbox')
      ) {
        updatedItem.gtdStage = 'waiting-for';
      } else if (
        updatedItem.type === 'completed' &&
        (!updatedItem.gtdStage || updatedItem.gtdStage === 'inbox')
      ) {
        updatedItem.gtdStage = 'completed';
      }

      // Save changes
      if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
        await window.DataStore.saveItem(updatedItem);
      } else {
        console.error('DataStore.saveItem is not available');
      }

      // Reload items and close modal
      await this.loadItems();
      modal.classList.add('hidden');
      modalContent.classList.remove('fullscreen-modal');
    });

    // Set up cancel button
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modalContent.classList.remove('fullscreen-modal');
    });

    // Show the modal
    modal.classList.remove('hidden');
  }

  // Show toast notification
  showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : '!'}</span>
      <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 500);
    }, 3000);
  }
}

// Create global instance
window.reviewController = new ReviewController();

/**
 * Review controller that manages the review page functionality
 */
class ReviewController {
  constructor() {
    this.currentFilter = 'all';
    this.currentView = localStorage.getItem('preferredView') || 'card';
    this.allItems = [];
    this.filteredItems = [];
  }

  async initialize() {
    console.log('Review controller initializing...');

    try {
      // Set up event listeners
      this.setupEventListeners();

      // Load and render items
      await this.loadItems();
      this.renderItems(this.allItems);

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

    // Update filtered items and render
    this.filteredItems = filtered;
    this.renderItems(filtered);
  }

  filterByGTDStage(stage) {
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
        this.showItemDetail(item);
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

  showItemDetail(item) {
    const modal = document.getElementById('item-detail-modal');
    if (!modal) return;

    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = modal.querySelector('#modal-title');

    modalTitle.textContent = item.title || 'Item Details';

    // Create detail content
    const detailContent = `
      <div class="detail-container">
        <div class="detail-section">
          <label>Screenshot</label>
          <div class="detail-screenshot">
            <img src="${item.screenshot || ''}" alt="Screenshot">
          </div>
        </div>
        
        <div class="detail-section">
          <label>URL</label>
          <div class="detail-url">
            <a href="${item.url || '#'}" target="_blank">${item.url || 'No URL'}</a>
          </div>
        </div>
        
        <div class="detail-section">
          <label for="edit-text">Description</label>
          <textarea id="edit-text" class="detail-text">${item.text || ''}</textarea>
        </div>
        
        <div class="detail-section">
          <label>Status</label>
          <select id="edit-status" class="detail-select">
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
          <div id="edit-tags"></div>
        </div>
        
        <div class="detail-actions">
          <button id="save-item-btn" class="btn btn-primary">Save Changes</button>
          <button id="cancel-edit-btn" class="btn">Cancel</button>
        </div>
      </div>
    `;

    modalBody.innerHTML = detailContent;

    // Initialize tag manager if available
    if (window.TagManager) {
      const tagContainer = document.getElementById('edit-tags');
      const tagManager = new TagManager(tagContainer);
      tagManager.setTags(item.tags || []);

      // Save button handler
      document.getElementById('save-item-btn').addEventListener('click', async () => {
        const updatedItem = { ...item };
        updatedItem.text = document.getElementById('edit-text').value;
        updatedItem.type = document.getElementById('edit-status').value;
        updatedItem.tags = tagManager.getTags();
        updatedItem.updatedAt = new Date().toISOString();

        if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
          await window.DataStore.saveItem(updatedItem);
          await this.loadItems();
          this.applyFilters();
          modal.classList.add('hidden');
        }
      });
    }

    // Cancel button handler
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Show the modal
    modal.classList.remove('hidden');
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

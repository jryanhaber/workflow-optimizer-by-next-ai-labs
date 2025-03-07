// Main dashboard controller
class Dashboard {
  constructor() {
    // DOM elements
    this.container = document.getElementById('dashboard-container');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.tagList = document.getElementById('tag-list');
    this.searchInput = document.getElementById('search-input');
    this.viewToggle = document.getElementById('view-toggle');

    // State
    this.currentFilter = 'all';
    this.activeWorkflow = localStorage.getItem('activeWorkflow') || 'default';

    // Initialize view controller
    this.viewController = window.viewController || {
      loadItems: async () => [],
      render: () => {}
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  async init() {
    await this.loadTags();
    this.setupWorkflowView();
  }

  setupEventListeners() {
    // Filter buttons
    this.filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.filterButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        this.currentFilter = button.getAttribute('data-filter');
        this.applyFilters();
      });
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.applyFilters();
      });
    }

    // Workflow selector if it exists
    const workflowSelector = document.getElementById('workflow-selector');
    if (workflowSelector) {
      workflowSelector.addEventListener('change', (e) => {
        this.activeWorkflow = e.target.value;
        localStorage.setItem('activeWorkflow', this.activeWorkflow);
        this.setupWorkflowView();
      });
    }

    // Tag clicks
    if (this.tagList) {
      this.tagList.addEventListener('click', (e) => {
        if (e.target.classList.contains('sidebar-tag')) {
          const tagName = e.target.textContent;
          this.toggleTagFilter(tagName, e.target);
        }
      });
    }

    // Real-time updates
    if (window.DataStore && typeof window.DataStore.on === 'function') {
      window.DataStore.on('items-changed', () => {
        this.applyFilters();
        this.loadTags();
      });
    }
  }

  async loadTags() {
    if (!this.tagList || !window.DataStore || !window.DataStore.getAllTags) return;

    try {
      const tags = await window.DataStore.getAllTags();

      if (!tags || tags.length === 0) {
        this.tagList.innerHTML = '<div class="empty-tags">No tags yet</div>';
        return;
      }

      this.tagList.innerHTML = '';
      tags.forEach((tag) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'sidebar-tag';
        tagEl.textContent = tag;
        this.tagList.appendChild(tagEl);
      });
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  toggleTagFilter(tagName, element) {
    // Toggle active class
    element.classList.toggle('active');

    // Apply filters
    this.applyFilters();
  }

  async applyFilters() {
    if (!window.DataStore) return;

    // Get search term
    const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase() : '';

    // Get active tags
    const activeTags = Array.from(document.querySelectorAll('.sidebar-tag.active')).map(
      (el) => el.textContent
    );

    // Build filter object
    const filters = {};

    if (this.currentFilter !== 'all') {
      filters.type = this.currentFilter;
    }

    try {
      // Get items directly
      const items = await window.DataStore.getAllItems(filters);

      // Filter locally
      let filteredItems = [...items];

      // Apply search filter
      if (searchTerm) {
        filteredItems = filteredItems.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.text && item.text.toLowerCase().includes(searchTerm)) ||
            (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
        );
      }

      // Apply tag filter
      if (activeTags.length > 0) {
        filteredItems = filteredItems.filter(
          (item) => item.tags && activeTags.some((tag) => item.tags.includes(tag))
        );
      }

      // Render items
      this.renderItems(filteredItems);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }

  renderItems(items) {
    // Implement rendering logic
    console.log(`Rendering ${items.length} items`);

    // Use view controller if available
    if (this.viewController && typeof this.viewController.render === 'function') {
      this.viewController.items = items;
      this.viewController.render();
    }
  }

  setupWorkflowView() {
    // Implementation details...
    console.log('Setting up workflow view:', this.activeWorkflow);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
  if (window.dashboard.init) {
    window.dashboard.init();
  }
});

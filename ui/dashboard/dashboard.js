// Main dashboard controller
import ViewController from '../views/view-controller.js';
import dataStore from '../../core/storage/data-store.js';
import gtdWorkflow from '../../gtd/gtd-workflow.js';

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
    this.viewController = new ViewController(document.getElementById('items-container'));

    // Set up event listeners
    this.setupEventListeners();
  }

  async init() {
    await this.viewController.init();
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
    this.searchInput.addEventListener('input', () => {
      this.applyFilters();
    });

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
    dataStore.on('items-changed', () => {
      this.applyFilters();
      this.loadTags();
    });
  }

  async loadTags() {
    if (!this.tagList) return;

    const tags = await dataStore.getAllTags();

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
  }

  toggleTagFilter(tagName, element) {
    // Toggle active class
    element.classList.toggle('active');

    // Apply filters
    this.applyFilters();
  }

  async applyFilters() {
    // Get search term
    const searchTerm = this.searchInput.value.toLowerCase();

    // Get active tags
    const activeTags = Array.from(document.querySelectorAll('.sidebar-tag.active')).map(
      (el) => el.textContent
    );

    // Build filter object
    const filters = {};

    if (this.currentFilter !== 'all') {
      filters.type = this.currentFilter;
    }

    // Load filtered items
    await this.viewController.loadItems(filters);

    // Apply search term filter in memory
    if (searchTerm) {
      this.viewController.items = this.viewController.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.text.toLowerCase().includes(searchTerm) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Apply tag filters in memory
    if (activeTags.length > 0) {
      this.viewController.items = this.viewController.items.filter(
        (item) => item.tags && activeTags.some((tag) => item.tags.includes(tag))
      );
    }

    // Re-render with filtered items
    this.viewController.render();
  }

  setupWorkflowView() {
    // Clear previous workflow UI
    const workflowContainer = document.getElementById('workflow-container');
    if (!workflowContainer) return;

    workflowContainer.innerHTML = '';

    // Setup specific workflow UI
    switch (this.activeWorkflow) {
      case 'gtd':
        this.setupGTDWorkflow(workflowContainer);
        break;

      case 'custom':
        this.setupCustomWorkflow(workflowContainer);
        break;

      default:
        // Default workflow view (standard filters)
        break;
    }
  }

  async setupGTDWorkflow(container) {
    container.innerHTML = `
      <div class="gtd-stages">
        <div class="gtd-stage" data-stage="inbox">
          <h3>Inbox</h3>
          <div class="stage-items" id="gtd-inbox"></div>
        </div>
        <div class="gtd-stage" data-stage="next-actions">
          <h3>Next Actions</h3>
          <div class="stage-items" id="gtd-next-actions"></div>
        </div>
        <div class="gtd-stage" data-stage="waiting-for">
          <h3>Waiting For</h3>
          <div class="stage-items" id="gtd-waiting-for"></div>
        </div>
        <div class="gtd-stage" data-stage="someday">
          <h3>Someday/Maybe</h3>
          <div class="stage-items" id="gtd-someday"></div>
        </div>
      </div>
    `;

    // Load items for each stage
    Object.values(gtdWorkflow.stages).forEach(async (stage) => {
      const items = await gtdWorkflow.getItemsByStage(stage);
      const stageContainer = document.getElementById(`gtd-${stage}`);

      if (stageContainer && items.length > 0) {
        // Render compact view of items
        items.forEach((item) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'gtd-item';
          itemEl.innerHTML = `
            <div class="item-title">${item.title}</div>
            <div class="item-actions">
              <button class="process-btn" data-id="${item.id}">Process</button>
            </div>
          `;
          stageContainer.appendChild(itemEl);
        });
      } else if (stageContainer) {
        stageContainer.innerHTML = '<div class="empty-stage">No items</div>';
      }
    });

    // Add event listeners for process buttons
    container.querySelectorAll('.process-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const itemId = parseInt(e.target.getAttribute('data-id'));
        const items = await dataStore.getAllItems();
        const item = items.find((i) => i.id === itemId);

        if (item) {
          this.showGTDProcessDialog(item);
        }
      });
    });
  }

  showGTDProcessDialog(item) {
    // Implementation of GTD processing dialog
  }

  // Additional methods for workflow management...
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new Dashboard();
  dashboard.init();
});

export default Dashboard;

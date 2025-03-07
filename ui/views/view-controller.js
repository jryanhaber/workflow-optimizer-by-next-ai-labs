// View Controller to manage different view types (card, list)
import dataStore from '../../core/storage/data-store.js';

class ViewController {
  constructor(container) {
    this.container = container;
    this.viewMode = localStorage.getItem('preferredView') || 'card';
    this.items = [];

    // Set up view toggle buttons if they exist
    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', this.toggleView.bind(this));
    }

    // Listen for data changes
    dataStore.on('items-changed', this.refreshItems.bind(this));
  }

  async init() {
    await this.loadItems();
    this.render();
  }

  async loadItems(filters = {}) {
    this.items = await dataStore.getAllItems(filters);
    return this.items;
  }

  refreshItems(items) {
    this.items = items;
    this.render();
  }

  toggleView() {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
    localStorage.setItem('preferredView', this.viewMode);
    this.render();
  }

  render() {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    if (this.items.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Render appropriate view
    if (this.viewMode === 'list') {
      this.renderListView();
    } else {
      this.renderCardView();
    }
  }

  renderCardView() {
    const grid = document.createElement('div');
    grid.className = 'items-grid';

    this.items.forEach((item) => {
      const card = this.createCardElement(item);
      grid.appendChild(card);
    });

    this.container.appendChild(grid);
  }

  renderListView() {
    const list = document.createElement('div');
    list.className = 'items-list';

    this.items.forEach((item) => {
      const listItem = this.createListElement(item);
      list.appendChild(listItem);
    });

    this.container.appendChild(list);
  }

  // Create a card element for the grid view
  createCardElement(item) {
    // Implementation of card creation...
  }

  // Create a list item for the list view
  createListElement(item) {
    const listItem = document.createElement('div');
    listItem.className = `list-item ${item.type}-type`;
    listItem.setAttribute('data-id', item.id);

    // Create a compact version with small thumbnail
    listItem.innerHTML = `
      <div class="item-thumbnail">
        <img src="${item.screenshot}" alt="">
      </div>
      <div class="item-summary">
        <div class="item-title">${item.title}</div>
        <div class="item-text">${item.text || 'No description'}</div>
      </div>
      <div class="item-meta">
        <div class="item-type">${item.type}</div>
        <div class="item-tags">${this.renderTagBadges(item.tags)}</div>
      </div>
      <div class="item-actions">
        <button class="btn-action" data-action="open">Open</button>
        <button class="btn-action" data-action="edit">Edit</button>
      </div>
    `;

    // Add event listeners
    this.attachItemEventListeners(listItem, item);

    return listItem;
  }

  // Other helper methods...
}

export default ViewController;

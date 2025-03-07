// View controller for the review page
class ViewController {
  constructor() {
    this.currentViewMode = localStorage.getItem('preferredView') || 'card';
    console.log('ViewController initialized with mode:', this.currentViewMode);
  }

  setupViewToggle() {
    console.log('Setting up view toggle buttons');
    const cardViewBtn = document.getElementById('card-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (!cardViewBtn || !listViewBtn) {
      console.error('View toggle buttons not found');
      return;
    }

    // Set initial active state
    if (this.currentViewMode === 'list') {
      cardViewBtn.classList.remove('active');
      listViewBtn.classList.add('active');
    } else {
      cardViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    }

    // Add click handlers
    cardViewBtn.addEventListener('click', () => {
      this.currentViewMode = 'card';
      localStorage.setItem('preferredView', 'card');
      cardViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');

      // Refresh the view if reviewController is available
      if (window.reviewController && typeof window.reviewController.renderItems === 'function') {
        window.reviewController.renderItems(window.reviewController.filteredItems);
      }
    });

    listViewBtn.addEventListener('click', () => {
      this.currentViewMode = 'list';
      localStorage.setItem('preferredView', 'list');
      listViewBtn.classList.add('active');
      cardViewBtn.classList.remove('active');

      // Refresh the view if reviewController is available
      if (window.reviewController && typeof window.reviewController.renderItems === 'function') {
        window.reviewController.renderItems(window.reviewController.filteredItems);
      }
    });

    console.log('View toggle setup complete');
  }

  getCurrentViewMode() {
    return this.currentViewMode;
  }

  createCardItem(item, handleItemAction) {
    // Use ItemRenderer if available
    if (window.ItemRenderer && typeof window.ItemRenderer.createItemCard === 'function') {
      return window.ItemRenderer.createItemCard(item, handleItemAction);
    }

    // Fallback implementation
    const card = document.createElement('div');
    card.className = `item-card ${item.type || 'todo'}-type`;
    card.setAttribute('data-id', item.id);

    card.innerHTML = `
      <div class="item-screenshot">
        <img src="${item.screenshot || ''}" alt="Screenshot">
      </div>
      <div class="item-details">
        <h3 class="item-title">${item.title || 'No title'}</h3>
        <p class="item-text">${item.text || 'No description'}</p>
        <div class="item-actions">
          <button class="btn btn-open" data-action="open" data-id="${item.id}">Open</button>
          <button class="btn btn-edit" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="btn btn-delete" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;

    // Add event listeners
    const buttons = card.querySelectorAll('.btn');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        const id = parseInt(button.getAttribute('data-id'), 10);
        if (typeof handleItemAction === 'function') {
          handleItemAction(action, id, item);
        }
      });
    });

    return card;
  }

  createListItem(item, handleItemAction) {
    const listItem = document.createElement('div');
    listItem.className = `list-item ${item.type || 'todo'}-type`;
    listItem.setAttribute('data-id', item.id);

    listItem.innerHTML = `
      <div class="item-thumbnail">
        <img src="${item.screenshot || ''}" alt="">
      </div>
      <div class="item-summary">
        <div class="item-title">${item.title || 'No title'}</div>
        <div class="item-text">${item.text || 'No description'}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-open" data-action="open" data-id="${item.id}">Open</button>
        <button class="btn btn-edit" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-delete" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;

    // Add event listeners
    const buttons = listItem.querySelectorAll('.btn');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        const id = parseInt(button.getAttribute('data-id'), 10);
        if (typeof handleItemAction === 'function') {
          handleItemAction(action, id, item);
        }
      });
    });

    return listItem;
  }
}

// Create and expose the global instance
window.viewController = new ViewController();
console.log('ViewController global instance created');

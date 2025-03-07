// Handle view modes and rendering
class ViewController {
  constructor() {
    this.currentViewMode = localStorage.getItem('preferredView') || 'card';
  }

  setupViewToggle() {
    var cardViewBtn = document.getElementById('card-view-btn');
    var listViewBtn = document.getElementById('list-view-btn');

    if (!cardViewBtn || !listViewBtn) return;

    if (this.currentViewMode === 'list') {
      cardViewBtn.classList.remove('active');
      listViewBtn.classList.add('active');
    }

    cardViewBtn.addEventListener('click', () => {
      this.currentViewMode = 'card';
      localStorage.setItem('preferredView', 'card');
      cardViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      window.reviewController.renderCurrentItems();
    });

    listViewBtn.addEventListener('click', () => {
      this.currentViewMode = 'list';
      localStorage.setItem('preferredView', 'list');
      listViewBtn.classList.add('active');
      cardViewBtn.classList.remove('active');
      window.reviewController.renderCurrentItems();
    });
  }

  getCurrentViewMode() {
    return this.currentViewMode;
  }

  // Create card item with optional process button
  createCardItem(item, showProcessButton = false, handleItemAction) {
    // Use ItemRenderer if available, otherwise create a basic card
    if (window.ItemRenderer && typeof window.ItemRenderer.createItemCard === 'function') {
      const card = window.ItemRenderer.createItemCard(item, handleItemAction);

      // Add process button if this is an inbox view
      if (showProcessButton && item.gtdStage === 'inbox') {
        const actionDiv = card.querySelector('.item-actions');
        if (actionDiv) {
          const processBtn = document.createElement('button');
          processBtn.className = 'btn btn-process';
          processBtn.setAttribute('data-action', 'process');
          processBtn.setAttribute('data-id', item.id);
          processBtn.innerHTML = '<span class="process-icon">📋</span> Process';
          processBtn.addEventListener('click', () =>
            window.reviewController.processInboxItem(item)
          );
          actionDiv.prepend(processBtn);
        }
      }

      return card;
    } else {
      // Fallback card creation logic
      const card = document.createElement('div');
      card.className = `item-card ${item.type}-type`;
      card.setAttribute('data-id', item.id);

      // Basic card structure
      card.innerHTML = `
        <div class="item-screenshot">
          <img src="${item.screenshot || ''}" alt="Screenshot">
        </div>
        <div class="item-details">
          <div class="item-header">
            <span class="status-badge ${item.type}">${this.getStatusLabel(item.type)}</span>
            <h3 class="item-title">${this.truncateText(item.title, 50)}</h3>
          </div>
          <p class="item-text">${item.text || 'No description'}</p>
          <div class="item-meta">
            <div class="item-tags">${this.renderTagChips(item.tags)}</div>
            <div class="item-date">${new Date(item.createdAt).toLocaleString()}</div>
          </div>
          <div class="item-actions">
            <button class="btn btn-open" data-action="open" data-id="${item.id}">Open URL</button>
            <button class="btn btn-edit" data-action="edit" data-id="${item.id}">Edit</button>
            <button class="btn btn-delete" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `;

      // Add event listeners
      const actionButtons = card.querySelectorAll('.item-actions button');
      actionButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
          const action = button.getAttribute('data-action');
          const id = parseInt(button.getAttribute('data-id'));
          handleItemAction(action, id, item);
        });
      });

      return card;
    }
  }

  // Create list item with optional process button
  createListItem(item, showProcessButton = false, handleItemAction) {
    var listItem = document.createElement('div');
    listItem.className = 'list-item ' + (item.type || 'todo') + '-type';
    listItem.setAttribute('data-id', item.id);

    var truncatedTitle =
      item.title && item.title.length > 60
        ? item.title.substring(0, 60) + '...'
        : item.title || 'No title';

    var tagChipsHtml = '';
    if (item.tags && Array.isArray(item.tags)) {
      tagChipsHtml = item.tags
        .map(function (tag) {
          return '<span class="tag-chip">' + tag + '</span>';
        })
        .join('');
    }

    var dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date';
    var itemText = item.text || 'No description';

    // Process button for inbox items
    var processButtonHtml = '';
    if (showProcessButton && item.gtdStage === 'inbox') {
      processButtonHtml = `<button class="btn-action btn-process" data-action="process" data-id="${item.id}">Process</button>`;
    }

    // Build HTML
    listItem.innerHTML =
      '<div class="item-thumbnail">' +
      '  <img src="' +
      (item.screenshot || '') +
      '" alt="">' +
      '</div>' +
      '<div class="item-summary">' +
      '  <div class="item-title">' +
      truncatedTitle +
      '</div>' +
      '  <div class="item-text">' +
      itemText +
      '</div>' +
      '</div>' +
      '<div class="item-meta">' +
      '  <div class="item-tags">' +
      tagChipsHtml +
      '</div>' +
      '  <div class="item-date">' +
      dateStr +
      '</div>' +
      '</div>' +
      '<div class="item-actions">' +
      processButtonHtml +
      '  <button class="btn-action" data-action="open" data-id="' +
      item.id +
      '">Open</button>' +
      '  <button class="btn-action" data-action="edit" data-id="' +
      item.id +
      '">Edit</button>' +
      '  <button class="btn-action" data-action="delete" data-id="' +
      item.id +
      '">×</button>' +
      '</div>';

    // Add click listeners
    var buttons = listItem.querySelectorAll('.btn-action');
    for (var i = 0; i < buttons.length; i++) {
      (function (button) {
        button.addEventListener('click', function (e) {
          var action = button.getAttribute('data-action');
          var id = parseInt(button.getAttribute('data-id'), 10);

          if (action === 'process') {
            window.reviewController.processInboxItem(item);
          } else {
            handleItemAction(action, id, item);
          }
        });
      })(buttons[i]);
    }

    return listItem;
  }

  getStatusLabel(type) {
    switch (type) {
      case 'todo':
        return 'To Do';
      case 'inprogress':
        return 'In Progress';
      case 'waiting':
        return 'Waiting For';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  renderTagChips(tags) {
    if (!tags || tags.length === 0) {
      return '<span class="no-tags">No tags</span>';
    }
    return tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join('');
  }

  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}

// Create global instance
window.viewController = new ViewController();

/**
 * Renders todo items in different views
 */
class ItemRenderer {
  /**
   * Create a card element for an item
   * @param {Object} item - The item to render
   * @param {Function} onActionClick - Action button handler
   * @returns {HTMLElement} Card element
   */
  static createItemCard(item, onActionClick) {
    console.log('Rendering item:', item); // Add this line for debugging

    const card = document.createElement('div');
    card.className = `item-card ${item.type}-type`;
    card.setAttribute('data-id', item.id);

    // Create status label
    const statusLabel = this.getStatusLabel(item.type);

    // Create tag chips
    const tagChips = this.renderTagChips(item.tags);

    // Format date
    const date = new Date(item.createdAt).toLocaleString();

    card.innerHTML = `
      <div class="item-screenshot">
        <img src="${item.screenshot}" alt="Screenshot">
      </div>
      <div class="item-details">
        <div class="item-header">
          <span class="status-badge ${item.type}">${statusLabel}</span>
          <h3 class="item-title">${this.truncateText(item.title, 50)}</h3>
        </div>
        <p class="item-text">${item.text || 'No description'}</p>
        <div class="item-meta">
          <div class="item-tags">${tagChips}</div>
          <div class="item-date">${date}</div>
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
        onActionClick(action, id, item);
      });
    });

    return card;
  }

  /**
   * Get status label for item type
   * @param {string} type - Item type
   * @returns {string} Status label
   */
  static getStatusLabel(type) {
    switch (type) {
      case 'todo':
        return 'To Do';
      case 'inprogress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  /**
   * Render tag chips HTML
   * @param {Array} tags - Tags array
   * @returns {string} HTML string
   */
  static renderTagChips(tags) {
    if (!tags || tags.length === 0) {
      return '<span class="no-tags">No tags</span>';
    }

    return tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join('');
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}

// Export the class
window.ItemRenderer = ItemRenderer;

// Initialize the review page
document.addEventListener('DOMContentLoaded', function () {
  initializeReview();
});

// State variables
var currentFilter = 'all';
var allItems = [];
var currentViewMode = localStorage.getItem('preferredView') || 'card';

// Main initialization function
async function initializeReview() {
  try {
    // Load items
    await loadItems();

    // Set up view toggle
    setupViewToggle();

    // Set up filter buttons
    setupFilterButtons();

    // Set up search
    setupSearch();

    // Set up capture button
    setupCaptureButton();

    // Set up modal close button
    setupModalCloseButton();

    // Set up real-time updates
    setupRealTimeUpdates();

    // Load tags for sidebar
    await loadTags();
  } catch (error) {
    console.error('Error initializing review page:', error);
  }
}

// Set up filter buttons
function setupFilterButtons() {
  var filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      // Update active button
      filterButtons.forEach(function (btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Apply filter
      currentFilter = button.getAttribute('data-filter');
      filterItems();
    });
  });
}

// Set up search functionality
function setupSearch() {
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      var searchTerm = e.target.value.toLowerCase();
      filterItems(searchTerm);
    });
  }
}

// Set up capture button
function setupCaptureButton() {
  var captureButton = document.getElementById('capture-current-btn');
  if (captureButton) {
    captureButton.addEventListener('click', function () {
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
function setupModalCloseButton() {
  var closeButton = document.querySelector('.close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      var modal = document.getElementById('item-detail-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

function setupRealTimeUpdates() {
  if (window.DataStore && typeof window.DataStore.on === 'function') {
    window.DataStore.on('items-changed', async function () {
      await loadItems();
      filterItems();
    });
  } else {
    console.warn('Real-time updates not available - DataStore.on method missing');
  }
}

// Initialize UI based on preferred view
function setupViewToggle() {
  var cardViewBtn = document.getElementById('card-view-btn');
  var listViewBtn = document.getElementById('list-view-btn');

  if (!cardViewBtn || !listViewBtn) return;

  if (currentViewMode === 'list') {
    cardViewBtn.classList.remove('active');
    listViewBtn.classList.add('active');
  }

  cardViewBtn.addEventListener('click', function () {
    currentViewMode = 'card';
    localStorage.setItem('preferredView', 'card');
    cardViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    renderItems(allItems);
  });

  listViewBtn.addEventListener('click', function () {
    currentViewMode = 'list';
    localStorage.setItem('preferredView', 'list');
    listViewBtn.classList.add('active');
    cardViewBtn.classList.remove('active');
    renderItems(allItems);
  });
}

// Load all items
async function loadItems() {
  try {
    if (window.DataStore && typeof window.DataStore.getAllItems === 'function') {
      allItems = await window.DataStore.getAllItems();
      renderItems(allItems);
    } else {
      console.error('DataStore.getAllItems is not available');
      allItems = [];
    }
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}

// Load tags for sidebar
async function loadTags() {
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
      tags.forEach(function (tag) {
        var tagEl = document.createElement('div');
        tagEl.className = 'sidebar-tag';
        tagEl.textContent = tag;
        tagEl.addEventListener('click', function () {
          document.querySelectorAll('.sidebar-tag').forEach(function (t) {
            t.classList.remove('active');
          });
          tagEl.classList.add('active');

          // Apply tag filter to items
          filterItemsByTag(tag);
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
function filterItemsByTag(tagName) {
  var filteredItems = allItems.filter(function (item) {
    return item.tags && item.tags.includes(tagName);
  });
  renderItems(filteredItems);
}

// Filter items by current filter and search term
function filterItems(searchTerm) {
  if (!searchTerm) searchTerm = '';

  var filtered = [].concat(allItems);

  // Apply type filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(function (item) {
      return item.type === currentFilter;
    });
  }

  // Apply search term
  if (searchTerm) {
    filtered = filtered.filter(function (item) {
      return (
        (item.title && item.title.toLowerCase().includes(searchTerm)) ||
        (item.text && item.text.toLowerCase().includes(searchTerm)) ||
        (item.tags &&
          item.tags.some(function (tag) {
            return tag.toLowerCase().includes(searchTerm);
          }))
      );
    });
  }

  renderItems(filtered);
}

// Render items based on current view mode
function renderItems(items) {
  var itemsContainer = document.getElementById('items-grid');
  var emptyState = document.getElementById('empty-state');

  if (!itemsContainer || !items || items.length === 0) {
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  itemsContainer.innerHTML = '';

  // Class for container depends on view mode
  itemsContainer.className = currentViewMode === 'list' ? 'items-list' : 'items-grid';

  items.forEach(function (item) {
    var element;
    if (currentViewMode === 'list') {
      element = createListItem(item);
    } else {
      element = ItemRenderer.createItemCard(item, handleItemAction);
    }
    itemsContainer.appendChild(element);
  });
}

// Create list item for list view
function createListItem(item) {
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

  // Build HTML without template literals
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
        handleItemAction(action, id, item);
      });
    })(buttons[i]);
  }

  return listItem;
}

// Handle item action clicks
async function handleItemAction(action, id, item) {
  switch (action) {
    case 'open':
      chrome.tabs.create({ url: item.url });
      break;

    case 'edit':
      showItemDetail(item);
      break;

    case 'delete':
      if (confirm('Are you sure you want to delete this item?')) {
        if (window.DataStore && typeof window.DataStore.deleteItem === 'function') {
          await window.DataStore.deleteItem(id);
          await loadItems();
        } else {
          console.error('DataStore.deleteItem is not available');
        }
      }
      break;
  }
}

// Show item detail in modal
function showItemDetail(item) {
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
  saveBtn.addEventListener('click', async function () {
    // Get updated values
    var updatedItem = Object.assign({}, item, {
      text: document.getElementById('edit-text').value,
      type: document.getElementById('edit-status').value,
      tags: tagManager.getTags(),
      updatedAt: new Date().toISOString()
    });

    // Save changes
    if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
      await window.DataStore.saveItem(updatedItem);
    } else {
      console.error('DataStore.saveItem is not available');
    }

    // Reload items and close modal
    await loadItems();
    modal.classList.add('hidden');
    modalContent.classList.remove('fullscreen-modal');
  });

  // Set up cancel button
  cancelBtn.addEventListener('click', function () {
    modal.classList.add('hidden');
    modalContent.classList.remove('fullscreen-modal');
  });

  // Show the modal
  modal.classList.remove('hidden');
}

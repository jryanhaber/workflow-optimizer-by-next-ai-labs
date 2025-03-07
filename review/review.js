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

// Set up real-time updates
function setupRealTimeUpdates() {
  if (typeof DataStore.on === 'function') {
    DataStore.on('items-changed', async function () {
      await loadItems();
      filterItems();
    });
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
    allItems = await DataStore.getAllItems();
    renderItems(allItems);
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}

// Load tags for sidebar
async function loadTags() {
  try {
    var tags = await DataStore.getAllTags();
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
        await DataStore.deleteItem(id);
        await loadItems();
      }
      break;
  }
}

// Show item detail in modal
function showItemDetail(item) {
  var modal = document.getElementById('item-detail-modal');
  var modalBody = modal.querySelector('.modal-body');
  var modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = item.title || 'No Title';

  // Build modal content
  var content = document.createElement('div');

  // Screenshot section
  var screenshotDiv = document.createElement('div');
  screenshotDiv.className = 'detail-screenshot';
  var img = document.createElement('img');
  img.src = item.screenshot || '';
  img.alt = 'Screenshot';
  screenshotDiv.appendChild(img);
  content.appendChild(screenshotDiv);

  // Info section
  var infoDiv = document.createElement('div');
  infoDiv.className = 'detail-info';

  // URL
  var urlDiv = document.createElement('div');
  urlDiv.className = 'detail-url';
  var urlLink = document.createElement('a');
  urlLink.href = item.url;
  urlLink.target = '_blank';
  urlLink.textContent = item.url;
  urlDiv.appendChild(urlLink);
  infoDiv.appendChild(urlDiv);

  // Description
  var descDiv = document.createElement('div');
  descDiv.className = 'detail-section';
  var descLabel = document.createElement('label');
  descLabel.textContent = 'Description';
  var textarea = document.createElement('textarea');
  textarea.id = 'edit-text';
  textarea.className = 'detail-text';
  textarea.value = item.text || '';
  descDiv.appendChild(descLabel);
  descDiv.appendChild(textarea);
  infoDiv.appendChild(descDiv);

  // Tags
  var tagsDiv = document.createElement('div');
  tagsDiv.className = 'detail-section';
  var tagsLabel = document.createElement('label');
  tagsLabel.textContent = 'Tags';
  var tagContainer = document.createElement('div');
  tagContainer.id = 'detail-tag-container';
  tagsDiv.appendChild(tagsLabel);
  tagsDiv.appendChild(tagContainer);
  infoDiv.appendChild(tagsDiv);

  // Status
  var statusDiv = document.createElement('div');
  statusDiv.className = 'detail-section';
  var statusLabel = document.createElement('label');
  statusLabel.textContent = 'Status';
  var select = document.createElement('select');
  select.id = 'edit-status';

  var todoOption = document.createElement('option');
  todoOption.value = 'todo';
  todoOption.textContent = 'Todo';
  if (item.type === 'todo') todoOption.selected = true;

  var inProgressOption = document.createElement('option');
  inProgressOption.value = 'inprogress';
  inProgressOption.textContent = 'In Progress';
  if (item.type === 'inprogress') inProgressOption.selected = true;

  var waitingOption = document.createElement('option');
  waitingOption.value = 'waiting';
  waitingOption.textContent = 'Waiting For';
  if (item.type === 'waiting') waitingOption.selected = true;

  var completedOption = document.createElement('option');
  completedOption.value = 'completed';
  completedOption.textContent = 'Completed';
  if (item.type === 'completed') completedOption.selected = true;

  select.appendChild(todoOption);
  select.appendChild(inProgressOption);
  select.appendChild(waitingOption);
  select.appendChild(completedOption);

  statusDiv.appendChild(statusLabel);
  statusDiv.appendChild(select);
  infoDiv.appendChild(statusDiv);

  // Metadata
  var metaDiv = document.createElement('div');
  metaDiv.className = 'detail-meta';

  var createdDiv = document.createElement('div');
  createdDiv.textContent =
    'Created: ' + (item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown');

  var updatedDiv = document.createElement('div');
  updatedDiv.textContent =
    'Updated: ' + (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown');

  metaDiv.appendChild(createdDiv);
  metaDiv.appendChild(updatedDiv);
  infoDiv.appendChild(metaDiv);

  content.appendChild(infoDiv);

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
    await DataStore.saveItem(updatedItem);

    // Reload items and close modal
    await loadItems();
    modal.classList.add('hidden');
  });

  // Set up cancel button
  cancelBtn.addEventListener('click', function () {
    modal.classList.add('hidden');
  });

  // Show the modal
  modal.classList.remove('hidden');
}

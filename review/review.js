// Initialize the review page
document.addEventListener('DOMContentLoaded', () => {
  initializeReview();
});

// Track current filter
let currentFilter = 'all';
let allItems = [];

// Initialize the review interface
async function initializeReview() {
  // Load items
  await loadItems();

  // Set up filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Apply filter
      currentFilter = button.getAttribute('data-filter');
      filterItems();
    });
  });

  // Set up search
  document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterItems(searchTerm);
  });

  // Set up capture button
  document.getElementById('capture-current-btn').addEventListener('click', () => {
    // Open capture popup
    chrome.windows.create({
      url: chrome.runtime.getURL('capture/capture-popup.html'),
      type: 'popup',
      width: 500,
      height: 600
    });
  });

  // Set up modal close button
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('item-detail-modal').classList.add('hidden');
  });

  // Load tags for sidebar
  await loadTags();
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
    const tags = await DataStore.getAllTags();
    const tagList = document.getElementById('tag-list');

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
        document.querySelectorAll('.sidebar-tag').forEach((t) => t.classList.remove('active'));
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
  const filteredItems = allItems.filter((item) => item.tags && item.tags.includes(tagName));
  renderItems(filteredItems);
}

// Filter items by current filter and search term
function filterItems(searchTerm = '') {
  let filtered = [...allItems];

  // Apply type filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter((item) => item.type === currentFilter);
  }

  // Apply search term
  if (searchTerm) {
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.text.toLowerCase().includes(searchTerm) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );
  }

  renderItems(filtered);
}

// Render items in the grid
function renderItems(items) {
  const itemsGrid = document.getElementById('items-grid');
  const emptyState = document.getElementById('empty-state');

  if (!items || items.length === 0) {
    itemsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  itemsGrid.innerHTML = '';

  items.forEach((item) => {
    const card = ItemRenderer.createItemCard(item, handleItemAction);
    itemsGrid.appendChild(card);
  });
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
  const modal = document.getElementById('item-detail-modal');
  const modalBody = modal.querySelector('.modal-body');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = item.title;

  modalBody.innerHTML = `
    <div class="detail-screenshot">
      <img src="${item.screenshot}" alt="Screenshot">
    </div>
    
    <div class="detail-info">
      <div class="detail-url">
        <a href="${item.url}" target="_blank">${item.url}</a>
      </div>
      
      <div class="detail-section">
        <label>Description</label>
        <textarea id="edit-text" class="detail-text">${item.text || ''}</textarea>
      </div>
      
      <div class="detail-section">
        <label>Tags</label>
        <div id="detail-tag-container"></div>
      </div>
      
      <div class="detail-section">
        <label>Status</label>
        <select id="edit-status">
          <option value="todo" ${item.type === 'todo' ? 'selected' : ''}>Todo</option>
          <option value="inprogress" ${
            item.type === 'inprogress' ? 'selected' : ''
          }>In Progress</option>
          <option value="completed" ${
            item.type === 'completed' ? 'selected' : ''
          }>Completed</option>
        </select>
      </div>
      
      <div class="detail-meta">
        <div>Created: ${new Date(item.createdAt).toLocaleString()}</div>
        <div>Updated: ${new Date(item.updatedAt).toLocaleString()}</div>
      </div>
    </div>
    
    <div class="detail-actions">
      <button id="save-item" class="btn btn-primary">Save Changes</button>
      <button id="cancel-edit" class="btn">Cancel</button>
    </div>
  `;

  // Initialize tag manager
  const tagContainer = document.getElementById('detail-tag-container');
  const tagManager = new TagManager(tagContainer);
  tagManager.setTags(item.tags || []);

  // Set up save button
  document.getElementById('save-item').addEventListener('click', async () => {
    // Get updated values
    const updatedItem = {
      ...item,
      text: document.getElementById('edit-text').value,
      type: document.getElementById('edit-status').value,
      tags: tagManager.getTags(),
      updatedAt: new Date().toISOString()
    };

    // Save changes
    await DataStore.saveItem(updatedItem);

    // Reload items and close modal
    await loadItems();
    modal.classList.add('hidden');
  });

  // Set up cancel button
  document.getElementById('cancel-edit').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Show the modal
  modal.classList.remove('hidden');
}

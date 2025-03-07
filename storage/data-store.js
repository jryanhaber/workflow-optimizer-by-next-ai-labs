class DataStore {
  constructor() {
    this.events = typeof EventEmitter !== 'undefined' ? new EventEmitter() : null;
  }

  on(event, callback) {
    if (this.events) {
      return this.events.on(event, callback);
    }
    return null;
  }

  async getAllItems(filters = {}) {
    try {
      const result = await chrome.storage.local.get('capturedItems');
      let items = result.capturedItems || [];

      // Apply filters if any
      if (filters.type) {
        items = items.filter((item) => item.type === filters.type);
      }

      if (filters.tag) {
        items = items.filter((item) => item.tags && item.tags.includes(filters.tag));
      }

      // Sort by date descending (newest first)
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Retrieval failed:', error);
      return [];
    }
  }

  async saveItem(item) {
    try {
      // Get existing items
      const result = await chrome.storage.local.get('capturedItems');
      const items = result.capturedItems || [];

      // Check if it's an update or new item
      const existingIndex = items.findIndex((i) => i.id === item.id);

      if (existingIndex >= 0) {
        // Update existing item
        items[existingIndex] = {
          ...items[existingIndex],
          ...item,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new item with required fields
        items.push({
          id: item.id || Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...item
        });
      }

      // Save back to storage
      await chrome.storage.local.set({ capturedItems: items });

      // Emit change event
      if (this.events) {
        this.events.emit('items-changed', items);
      }

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  async deleteItem(id) {
    try {
      const result = await chrome.storage.local.get('capturedItems');
      const items = result.capturedItems || [];

      const newItems = items.filter((item) => item.id !== id);

      await chrome.storage.local.set({ capturedItems: newItems });

      // Emit change event
      if (this.events) {
        this.events.emit('items-changed', newItems);
      }

      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  async getAllTags() {
    try {
      const items = await this.getAllItems();

      // Collect all tags
      const tagSet = new Set();

      items.forEach((item) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag) => {
            if (tag) tagSet.add(tag);
          });
        }
      });

      return Array.from(tagSet);
    } catch (error) {
      console.error('Tag retrieval failed:', error);
      return [];
    }
  }
}

// Export the class
window.DataStore = new DataStore();

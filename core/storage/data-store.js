// Enhanced data store with real-time updates
class DataStore {
  constructor() {
    // Check and create EventEmitter if not available
    if (typeof window.EventEmitter === 'undefined') {
      console.warn('EventEmitter not found, creating a simple implementation');
      window.EventEmitter = class SimpleEventEmitter {
        constructor() {
          this.events = {};
        }

        on(event, callback) {
          if (!this.events[event]) {
            this.events[event] = [];
          }
          this.events[event].push(callback);
          return () => this.off(event, callback);
        }

        off(event, callback) {
          if (!this.events[event]) return;
          this.events[event] = this.events[event].filter((cb) => cb !== callback);
        }

        emit(event, ...args) {
          if (!this.events[event]) return;
          this.events[event].forEach((callback) => {
            try {
              callback(...args);
            } catch (e) {
              console.error(`Error in event listener for ${event}:`, e);
            }
          });
        }
      };
    }

    this.events = new window.EventEmitter();
    this.ready = Promise.resolve(true);
  }

  async init() {
    // Initialize storage and load initial data
    try {
      return true;
    } catch (error) {
      console.error('DataStore initialization failed:', error);
      return false;
    }
  }

  on(event, callback) {
    if (this.events) {
      return this.events.on(event, callback);
    }
    return null;
  }

  /**
   * Save an item to storage
   * @param {WorkflowItem} item - The item to save
   */
  async saveItem(item) {
    try {
      await this.ready;

      const result = await chrome.storage.local.get('capturedItems');
      const items = result.capturedItems || [];

      // Check if it's an update or new item
      const existingIndex = items.findIndex((i) => i.id === item.id);

      // Add GTD stage if not present
      if (!item.gtdStage) {
        item.gtdStage = item.type === 'completed' ? 'completed' : 'inbox';
      }

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

      // Add system tags if not present
      item.systemTags = item.systemTags || [];
      if (!item.systemTags.includes(`gtd:${item.gtdStage}`)) {
        item.systemTags.push(`gtd:${item.gtdStage}`);
      }

      // Save back to storage
      await chrome.storage.local.set({ capturedItems: items });

      // Emit change event for real-time updates
      if (this.events) {
        this.events.emit('items-changed', items);
      }

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  /**
   * Get all captured items
   * @param {Object} filters - Optional filters
   */
  async getAllItems(filters = {}) {
    await this.ready;
    try {
      const result = await chrome.storage.local.get('capturedItems');
      let items = result.capturedItems || [];

      // Apply filters if any
      if (filters.type) {
        items = items.filter((item) => item.type === filters.type);
      }

      if (filters.tag) {
        items = items.filter(
          (item) =>
            (item.tags && item.tags.includes(filters.tag)) ||
            (item.systemTags && item.systemTags.includes(filters.tag))
        );
      }

      if (filters.gtdStage) {
        items = items.filter((item) => item.gtdStage === filters.gtdStage);
      }

      // Sort by date descending (newest first)
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Retrieval failed:', error);
      return [];
    }
  }

  /**
   * Delete an item by ID
   * @param {number} id - Item ID to delete
   */
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

  /**
   * Get all unique tags from all items
   */
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

// Create singleton instance
window.DataStore = new DataStore();

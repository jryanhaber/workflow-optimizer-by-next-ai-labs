// Enhanced data store with real-time updates
import { EventEmitter } from '../utils/events.js';

class DataStore {
  constructor() {
    // Replace with window-based EventEmitter
    this.events = typeof window.EventEmitter !== 'undefined' ? new window.EventEmitter() : null;
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
    return this.events.on(event, callback);
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

      // Inside saveItem method before saving to storage
      // Add GTD status if not present
      if (!item.gtdStage) {
        // Assign GTD stage based on type
        switch (item.type) {
          case 'completed':
            item.gtdStage = 'completed';
            break;
          case 'waiting':
            item.gtdStage = 'waiting-for';
            break;
          default:
            item.gtdStage = 'inbox';
        }
      }

      // Add system tags if not present
      item.systemTags = item.systemTags || [];
      if (!item.systemTags.includes(`gtd:${item.gtdStage}`)) {
        item.systemTags.push(`gtd:${item.gtdStage}`);
      }

      // Save back to storage
      await chrome.storage.local.set({ capturedItems: items });

      // Emit change event for real-time updates
      this.emit('items-changed', items);

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

  // Additional methods...
}
// Create singleton instance
window.DataStore = new DataStore();

/**
 * Handles tag creation and management
 */
class TagManager {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.tags = [];
    this.init();
  }

  /**
   * Initialize the tag manager
   */
  init() {
    // Create tag input container
    this.container.innerHTML = `
      <div class="tag-input-container">
        <div class="tag-chips"></div>
        <input type="text" class="tag-input" placeholder="Add tags...">
      </div>
    `;

    this.tagChips = this.container.querySelector('.tag-chips');
    this.tagInput = this.container.querySelector('.tag-input');

    // Set up event listeners
    this.tagInput.addEventListener('keydown', this.handleTagInput.bind(this));
    this.tagChips.addEventListener('click', this.handleTagRemove.bind(this));

    // Load existing tags for autocomplete
    this.loadTags();
  }

  /**
   * Load existing tags from storage
   */
  async loadTags() {
    try {
      if (window.DataStore && typeof window.DataStore.getAllTags === 'function') {
        this.allTags = await window.DataStore.getAllTags();
      } else {
        console.log('DataStore.getAllTags not available, using empty tags array');
        this.allTags = [];
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      this.allTags = [];
    }
  }

  /**
   * Handle tag input
   * @param {Event} event - Keyboard event
   */
  handleTagInput(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();

      // Get tag text
      const tagText = this.tagInput.value.trim().replace(/,/g, '');

      if (tagText && !this.tags.includes(tagText)) {
        this.addTag(tagText);
        this.tagInput.value = '';

        // Notify change
        if (this.onChange) {
          this.onChange(this.tags);
        }
      }
    }
  }

  /**
   * Add a new tag
   * @param {string} tagText - Tag text
   */
  addTag(tagText) {
    if (!tagText || this.tags.includes(tagText)) return;

    this.tags.push(tagText);
    this.renderTags();
  }

  /**
   * Handle tag removal
   * @param {Event} event - Click event
   */
  handleTagRemove(event) {
    if (event.target.classList.contains('tag-remove')) {
      const tagEl = event.target.closest('.tag-chip');
      if (tagEl) {
        const tagText = tagEl.getAttribute('data-tag');
        this.removeTag(tagText);

        // Notify change
        if (this.onChange) {
          this.onChange(this.tags);
        }
      }
    }
  }

  /**
   * Remove a tag
   * @param {string} tagText - Tag to remove
   */
  removeTag(tagText) {
    this.tags = this.tags.filter((tag) => tag !== tagText);
    this.renderTags();
  }

  /**
   * Render all tags
   */
  renderTags() {
    this.tagChips.innerHTML = '';

    this.tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-chip';
      tagEl.setAttribute('data-tag', tag);
      tagEl.innerHTML = `${tag} <span class="tag-remove">×</span>`;
      this.tagChips.appendChild(tagEl);
    });
  }

  /**
   * Set tags
   * @param {Array} tags - Tags to set
   */
  setTags(tags) {
    this.tags = Array.isArray(tags) ? [...tags] : [];
    this.renderTags();
  }

  /**
   * Get current tags
   * @returns {Array} Current tags
   */
  getTags() {
    return [...this.tags];
  }
}

// Export the class
window.TagManager = TagManager;

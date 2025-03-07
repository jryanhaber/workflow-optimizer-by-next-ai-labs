/**
 * GTD Processing Flow Manager
 */
class GTDProcessor {
  constructor() {
    this.stages = {
      INBOX: 'inbox',
      NEXT_ACTIONS: 'next-actions',
      WAITING_FOR: 'waiting-for',
      SOMEDAY: 'someday',
      REFERENCE: 'reference',
      COMPLETED: 'completed'
    };
  }

  /**
   * Show the GTD processing dialog for an inbox item
   * @param {Object} item - The item to process
   */
  /**
   * Show the GTD processing dialog for an inbox item
   * @param {Object} item - The item to process
   */
  showProcessingDialog(item) {
    const modal = document.getElementById('gtd-processing-modal');
    const contentContainer = modal.querySelector('.gtd-processing-content');

    // Start with first question
    this.showActionableQuestion(item, contentContainer, modal);

    // Show the modal
    modal.classList.remove('hidden');
  }
  /**
   * Show the "Is it actionable?" question
   */
  showActionableQuestion(item, container, modal) {
    container.innerHTML = `
      <div class="gtd-processing-step">
        <h2>Is this item actionable?</h2>
        <p>Does "${item.title}" require any action to be taken?</p>
        
        <div class="gtd-question-preview">
          <div class="preview-screenshot">
            <img src="${item.screenshot}" alt="Screenshot">
          </div>
          <div class="preview-info">
            <div class="preview-title">${item.title}</div>
            <div class="preview-text">${item.text || 'No description'}</div>
          </div>
        </div>
        
        <div class="gtd-actions">
          <button class="gtd-btn yes-btn" id="actionable-yes">Yes, it's actionable</button>
          <button class="gtd-btn no-btn" id="actionable-no">No, it's not actionable</button>
        </div>
      </div>
    `;

    // Set up event listeners
    document.getElementById('actionable-yes').addEventListener('click', () => {
      this.showTwoMinuteQuestion(item, container, modal);
    });

    document.getElementById('actionable-no').addEventListener('click', () => {
      this.showNonActionableOptions(item, container, modal);
    });
  }

  /**
   * Show non-actionable options (trash, reference, someday)
   */
  showNonActionableOptions(item, container, modal) {
    container.innerHTML = `
      <div class="gtd-processing-step">
        <h2>What should be done with this non-actionable item?</h2>
        
        <div class="gtd-question-preview">
          <div class="preview-info">
            <div class="preview-title">${item.title}</div>
          </div>
        </div>
        
        <div class="gtd-actions">
          <button class="gtd-btn trash-btn" id="option-trash">
            <span class="btn-icon">🗑️</span>
            <span class="btn-label">Trash it</span>
            <span class="btn-desc">No longer needed</span>
          </button>
          
          <button class="gtd-btn reference-btn" id="option-reference">
            <span class="btn-icon">📚</span>
            <span class="btn-label">Reference</span>
            <span class="btn-desc">Keep for information</span>
          </button>
          
          <button class="gtd-btn someday-btn" id="option-someday">
            <span class="btn-icon">🔮</span>
            <span class="btn-label">Someday/Maybe</span>
            <span class="btn-desc">Might do it later</span>
          </button>
        </div>
        
        <button class="gtd-btn back-btn" id="back-to-actionable">← Back</button>
      </div>
    `;

    // Set up event listeners
    document.getElementById('option-trash').addEventListener('click', () => {
      this.processNonActionable(item, 'trash', modal);
    });

    document.getElementById('option-reference').addEventListener('click', () => {
      this.processNonActionable(item, 'reference', modal);
    });

    document.getElementById('option-someday').addEventListener('click', () => {
      this.processNonActionable(item, 'someday', modal);
    });

    document.getElementById('back-to-actionable').addEventListener('click', () => {
      this.showActionableQuestion(item, container, modal);
    });
  }

  /**
   * Show the "Can it be done in less than 2 minutes?" question
   */
  showTwoMinuteQuestion(item, container, modal) {
    container.innerHTML = `
      <div class="gtd-processing-step">
        <h2>Can it be done in less than 2 minutes?</h2>
        
        <div class="gtd-question-preview">
          <div class="preview-info">
            <div class="preview-title">${item.title}</div>
          </div>
        </div>
        
        <div class="gtd-actions">
          <button class="gtd-btn yes-btn" id="twominute-yes">
            Yes, do it now
          </button>
          
          <button class="gtd-btn no-btn" id="twominute-no">
            No, will take longer
          </button>
        </div>
        
        <button class="gtd-btn back-btn" id="back-to-actionable">← Back</button>
      </div>
    `;

    // Set up event listeners
    document.getElementById('twominute-yes').addEventListener('click', () => {
      this.processTwoMinute(item, true, modal);
    });

    document.getElementById('twominute-no').addEventListener('click', () => {
      this.showDelegationQuestion(item, container, modal);
    });

    document.getElementById('back-to-actionable').addEventListener('click', () => {
      this.showActionableQuestion(item, container, modal);
    });
  }

  /**
   * Show the delegation question
   */
  showDelegationQuestion(item, container, modal) {
    container.innerHTML = `
      <div class="gtd-processing-step">
        <h2>Who needs to do it?</h2>
        
        <div class="gtd-question-preview">
          <div class="preview-info">
            <div class="preview-title">${item.title}</div>
          </div>
        </div>
        
        <div class="gtd-actions">
          <button class="gtd-btn me-btn" id="delegate-me">
            <span class="btn-icon">👤</span>
            <span class="btn-label">I need to do it</span>
          </button>
          
          <button class="gtd-btn delegate-btn" id="delegate-other">
            <span class="btn-icon">👥</span>
            <span class="btn-label">Delegate to someone</span>
          </button>
        </div>
        
        <button class="gtd-btn back-btn" id="back-to-twominute">← Back</button>
      </div>
    `;

    // Set up event listeners
    document.getElementById('delegate-me').addEventListener('click', () => {
      this.processNextAction(item, modal);
    });

    document.getElementById('delegate-other').addEventListener('click', () => {
      this.showDelegationDetails(item, container, modal);
    });

    document.getElementById('back-to-twominute').addEventListener('click', () => {
      this.showTwoMinuteQuestion(item, container, modal);
    });
  }

  /**
   * Show delegation details form
   */
  showDelegationDetails(item, container, modal) {
    container.innerHTML = `
      <div class="gtd-processing-step">
        <h2>Delegate to someone else</h2>
        
        <div class="delegation-form">
          <div class="form-group">
            <label for="delegate-name">Who are you waiting for?</label>
            <input type="text" id="delegate-name" placeholder="Enter name or email">
          </div>
          
          <div class="form-group">
            <label for="delegate-until">Follow up date</label>
            <input type="date" id="delegate-until">
          </div>
          
          <div class="form-group">
            <label for="delegate-notes">Notes (optional)</label>
            <textarea id="delegate-notes" placeholder="Notes about what you're waiting for"></textarea>
          </div>
        </div>
        
        <div class="gtd-actions">
          <button class="gtd-btn delegate-save-btn" id="save-delegation">Save as Waiting For</button>
        </div>
        
        <button class="gtd-btn back-btn" id="back-to-delegation">← Back</button>
      </div>
    `;

    // Set current date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('delegate-until').value = today;

    // Set up event listeners
    document.getElementById('save-delegation').addEventListener('click', () => {
      const personName = document.getElementById('delegate-name').value;
      const untilDate = document.getElementById('delegate-until').value;
      const notes = document.getElementById('delegate-notes').value;

      this.processDelegation(item, personName, untilDate, notes, modal);
    });

    document.getElementById('back-to-delegation').addEventListener('click', () => {
      this.showDelegationQuestion(item, container, modal);
    });
  }

  /**
   * Process non-actionable item (Trash, Reference, Someday)
   */
  async processNonActionable(item, option, modal) {
    try {
      const updatedItem = { ...item };

      switch (option) {
        case 'trash':
          // Just delete the item
          if (window.DataStore && typeof window.DataStore.deleteItem === 'function') {
            await window.DataStore.deleteItem(item.id);
            this.showSuccessMessage('Item moved to trash');
          }
          break;

        case 'reference':
          updatedItem.gtdStage = this.stages.REFERENCE;
          updatedItem.systemTags = updatedItem.systemTags || [];
          updatedItem.systemTags.push('gtd:reference');
          await this.saveItemUpdate(updatedItem);
          this.showSuccessMessage('Item saved as reference material');
          break;

        case 'someday':
          updatedItem.gtdStage = this.stages.SOMEDAY;
          updatedItem.systemTags = updatedItem.systemTags || [];
          updatedItem.systemTags.push('gtd:someday');
          await this.saveItemUpdate(updatedItem);
          this.showSuccessMessage('Item saved to Someday/Maybe list');
          break;
      }

      // Close modal
      modal.classList.add('hidden');

      // Refresh items list
      if (typeof loadItems === 'function') {
        await loadItems();
      }
    } catch (error) {
      console.error('Error processing non-actionable item:', error);
      this.showErrorMessage('Failed to process item');
    }
  }

  /**
   * Process two-minute task
   */
  async processTwoMinute(item, done, modal) {
    try {
      if (done) {
        // Mark as completed
        const updatedItem = { ...item };
        updatedItem.gtdStage = this.stages.COMPLETED;
        updatedItem.type = 'completed';
        updatedItem.systemTags = updatedItem.systemTags || [];
        updatedItem.systemTags.push('gtd:completed');
        updatedItem.systemTags.push('gtd:two-minute-rule');

        await this.saveItemUpdate(updatedItem);
        this.showSuccessMessage('Item marked as completed');
      }

      // Close modal
      modal.classList.add('hidden');

      // Refresh items list
      if (typeof loadItems === 'function') {
        await loadItems();
      }
    } catch (error) {
      console.error('Error processing two-minute item:', error);
      this.showErrorMessage('Failed to process item');
    }
  }

  /**
   * Process as next action
   */
  async processNextAction(item, modal) {
    try {
      const updatedItem = { ...item };
      updatedItem.gtdStage = this.stages.NEXT_ACTIONS;
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:next-action');

      await this.saveItemUpdate(updatedItem);
      this.showSuccessMessage('Item saved as Next Action');

      // Close modal
      modal.classList.add('hidden');

      // Refresh items list
      if (typeof loadItems === 'function') {
        await loadItems();
      }
    } catch (error) {
      console.error('Error processing next action:', error);
      this.showErrorMessage('Failed to process item');
    }
  }

  /**
   * Process delegation
   */
  async processDelegation(item, person, until, notes, modal) {
    try {
      if (!person) {
        alert('Please enter who you are waiting for');
        return;
      }

      const updatedItem = { ...item };
      updatedItem.gtdStage = this.stages.WAITING_FOR;
      updatedItem.type = 'waiting';
      updatedItem.systemTags = updatedItem.systemTags || [];
      updatedItem.systemTags.push('gtd:waiting-for');

      // Add delegation details
      updatedItem.waitingFor = person;
      updatedItem.waitingUntil = until;

      // Update text if notes provided
      if (notes) {
        updatedItem.text =
          (updatedItem.text ? updatedItem.text + '\n\n' : '') +
          `Waiting for: ${person}\nFollow up: ${until}\nNotes: ${notes}`;
      }

      await this.saveItemUpdate(updatedItem);
      this.showSuccessMessage(`Item delegated to ${person}`);

      // Close modal
      modal.classList.add('hidden');

      // Refresh items list
      if (typeof loadItems === 'function') {
        await loadItems();
      }
    } catch (error) {
      console.error('Error processing delegation:', error);
      this.showErrorMessage('Failed to process item');
    }
  }

  /**
   * Save item update
   */
  async saveItemUpdate(item) {
    if (window.DataStore && typeof window.DataStore.saveItem === 'function') {
      return await window.DataStore.saveItem(item);
    } else {
      throw new Error('DataStore.saveItem is not available');
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    // Implementation depends on your UI
    if (typeof showToast === 'function') {
      showToast(message, 'success');
    } else {
      console.log(message);
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    // Implementation depends on your UI
    if (typeof showToast === 'function') {
      showToast(message, 'error');
    } else {
      console.error(message);
    }
  }
}

// Create global instance
window.GTDProcessor = new GTDProcessor();

// GTD Workflow Manager
// import dataStore from '../core/storage/data-store.js';
// import { GTD_STAGES } from '../core/storage/models.js';

class GTDWorkflow {
  constructor() {
    this.stages = {
      INBOX: 'inbox',
      ACTIONABLE: 'actionable',
      NEXT_ACTIONS: 'next-actions',
      WAITING_FOR: 'waiting-for',
      SOMEDAY: 'someday',
      REFERENCE: 'reference',
      COMPLETED: 'completed'
    };
  }
  /**
   * Process an inbox item - first decision point
   * @param {WorkflowItem} item - The item to process
   * @param {boolean} isActionable - Whether the item is actionable
   */
  async processInboxItem(item, isActionable) {
    const updatedItem = { ...item };

    if (isActionable) {
      updatedItem.gtdStage = this.stages.ACTIONABLE;
      // Add system tag
      if (!updatedItem.systemTags) updatedItem.systemTags = [];
      updatedItem.systemTags.push('gtd:actionable');
    } else {
      // Non-actionable: decide if reference, someday, or trash
      await this.showNonActionableDialog(updatedItem);
    }

    return dataStore.saveItem(updatedItem);
  }

  /**
   * Process an actionable item - second decision point
   * @param {WorkflowItem} item - The item to process
   * @param {string} decision - Next action, project, delegate, defer
   * @param {Object} details - Additional details based on decision
   */
  async processActionableItem(item, decision, details = {}) {
    const updatedItem = { ...item };

    switch (decision) {
      case 'next-action':
        updatedItem.gtdStage = this.stages.NEXT_ACTIONS;
        updatedItem.systemTags = updatedItem.systemTags || [];
        updatedItem.systemTags.push('gtd:next-action');
        break;

      case 'waiting-for':
        updatedItem.gtdStage = this.stages.WAITING_FOR;
        updatedItem.type = 'waiting';
        updatedItem.waitingFor = details.person;
        updatedItem.waitingUntil = details.until;
        updatedItem.systemTags = updatedItem.systemTags || [];
        updatedItem.systemTags.push('gtd:waiting');
        break;

      case 'defer':
        updatedItem.gtdStage = this.stages.SOMEDAY;
        updatedItem.systemTags = updatedItem.systemTags || [];
        updatedItem.systemTags.push('gtd:someday');
        break;
    }

    return dataStore.saveItem(updatedItem);
  }

  /**
   * Get all items for a specific GTD stage
   * @param {string} stage - The GTD stage to filter by
   */
  async getItemsByStage(stage) {
    return window.dataStore.getAllItems({ gtdStage: stage });
  }

  // Additional GTD workflow methods...
}

window.GTDWorkflow = new GTDWorkflow();

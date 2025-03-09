// Define core data models with TypeScript-like type definitions

/**
 * @typedef {Object} WorkflowItem
 * @property {number} id - Unique identifier
 * @property {string} type - Item type (todo, inprogress, completed)
 * @property {string} text - Description
 * @property {string} url - Original source URL
 * @property {string} title - Page title
 * @property {string} screenshot - Screenshot data URL
 * @property {string[]} tags - User-defined tags
 * @property {string[]} systemTags - System-applied tags (GTD stage, etc)
 * @property {string} gtdStage - Current GTD workflow stage
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {string|null} reviewedAt - Last review timestamp
 * @property {Object|null} metadata - Additional structured data
 */

/**
 * @typedef {Object} ViewOptions
 * @property {string} viewMode - 'card' or 'list'
 * @property {string} sortBy - Field to sort by
 * @property {boolean} sortAsc - Sort direction
 * @property {string[]} activeTags - Currently active tag filters
 * @property {string} activeWorkflow - Current workflow view (gtd, custom, etc)
 */

// Export constants for system use
window.GTD_STAGES = {
  INBOX: 'inbox',
  NEXT_ACTIONS: 'next-actions',
  WAITING_FOR: 'waiting-for',
  TO_DELEGATE: 'to-delegate',
  DELEGATED: 'delegated',
  BRAINSTORM: 'brainstorm',
  SOMEDAY: 'someday',
  REFERENCE: 'reference',
  COMPLETED: 'completed'
};

window.STATUS_TO_GTD_STAGE = {
  todo: 'inbox',
  inprogress: 'next-actions',
  waiting: 'waiting-for',
  completed: 'completed'
};

// Add filter matching to ensure sync between filters and categories
window.GTD_FILTER_MAPPING = {
  inbox: 'todo',
  'next-actions': 'inprogress',
  'waiting-for': 'waiting',
  'to-delegate': 'waiting',
  delegated: 'waiting',
  completed: 'completed'
};

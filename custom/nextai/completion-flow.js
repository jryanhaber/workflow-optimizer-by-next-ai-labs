// Custom completion flow for NextAI Labs
import dataStore from '../../core/storage/data-store.js';

class CompletionFlow {
  constructor() {
    this.questions = {
      investor: {
        question: 'Would this be appropriate to update investors about?',
        tag: 'update:investors'
      },
      users: {
        question: 'Would this be appropriate to update users about?',
        tag: 'update:users',
        followUp: ['ad', 'email', 'blog', 'changelog']
      },
      ad: {
        question: 'Would this be appropriate content to turn into an ad?',
        tag: 'content:ad'
      },
      email: {
        question: 'Should this go into an email update to all users?',
        tag: 'content:email',
        note: 'If this is both substantial and high impact, it should'
      },
      blog: {
        question: 'Should this go into the blog?',
        tag: 'content:blog'
      },
      changelog: {
        question: 'Should this go into the change log?',
        tag: 'content:changelog'
      },
      team: {
        question: 'Would this be something you should notify your team about?',
        tag: 'update:team'
      }
    };
  }

  /**
   * Start the completion flow for an item
   * @param {WorkflowItem} item - The completed item to process
   * @returns {Promise<Object>} Flow UI configuration
   */
  async startFlow(item) {
    // Return question flow configuration for UI
    return {
      item,
      initialQuestions: ['investor', 'users', 'team'],
      questions: this.questions,
      onComplete: this.processCompletionAnswers.bind(this)
    };
  }

  /**
   * Process the answers from the completion questionnaire
   * @param {WorkflowItem} item - The item being processed
   * @param {Object} answers - The yes/no answers to questions
   */
  async processCompletionAnswers(item, answers) {
    const updatedItem = { ...item };

    // Initialize or get existing metadata
    updatedItem.metadata = updatedItem.metadata || {};
    updatedItem.metadata.completionFlow = answers;

    // Add tags based on answers
    updatedItem.systemTags = updatedItem.systemTags || [];

    // Process each answer and add appropriate tags
    Object.entries(answers).forEach(([key, value]) => {
      if (value && this.questions[key]) {
        updatedItem.systemTags.push(this.questions[key].tag);
      }
    });

    // Save the updated item
    return dataStore.saveItem(updatedItem);
  }
}

export default new CompletionFlow();

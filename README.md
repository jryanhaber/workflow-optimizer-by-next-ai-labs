# todo-extension

Complete Project Roadmap

0 restore functionality
Here are all the required steps to restore the app to operational status:

Fix utils/events.js by replacing the export statement with window.EventEmitter = class EventEmitter { to ensure it's properly exposed globally.
Update storage/data-store.js to use the global EventEmitter by changing the constructor to this.events = new window.EventEmitter() and verify it's emitting 'items-changed' events.
Correct script order in HTML files to ensure EventEmitter loads before DataStore, which loads before components that depend on it.
Fix reference errors in components/tag-manager.js by changing DataStore.getAllTags() to window.DataStore.getAllTags() with null-checks.
Update capture.js to use the global window objects instead of import/export by replacing await DataStore.saveItem() with await window.DataStore.saveItem().
Check capture/capture-popup.html paths to ensure scripts are referenced correctly as ../utils/events.js, ../storage/data-store.js, etc.
Verify review/review.js real-time update code uses if (typeof window.DataStore.on === 'function') with appropriate error handling.
Inspect the browser console for remaining errors and address specific missing method or property errors.
Validate Chrome storage access by checking chrome.storage.local calls in storage/data-store.js have proper error handling.
Test core functionality (capture, view, edit, delete) to verify the data flow is working properly.
Remove any duplicate files that may be causing conflicts, particularly check for multiple copies of data-store.js.
Ensure manifest.json has correct paths to HTML files, especially the default popup path.

1. Core Capture Functionality (COMPLETED)

Web Page Capture: Screenshot, URL, and title capture from any page using Chrome extension API
Capture Categorization: Ability to categorize captures as Todo, In Progress, Waiting, or Completed items
Basic Data Storage: Local storage with Chrome storage API for persistence across sessions
Tag Management: Creating, applying, and filtering by custom tags
View Management: Card and list views for captured items

2. Real-Time Update System (IN PROGRESS)

Event Emitter Implementation: Create a pub/sub system in /utils/events.js to broadcast data changes
DataStore Enhancement: Update /storage/data-store.js to emit events when data changes
UI Reactivity: Make all UI components listen for and respond to data change events
Storage Synchronization: Ensure data changes propagate immediately across all open views
Fix the event emission in DataStore.saveItem() to properly broadcast all data changes to listening components.
Implement event subscription in the review.js file to refresh items when storage changes occur.
Test cross-tab synchronization to verify updates made in one tab appear in all open views.

3. GTD Workflow Implementation (PLANNED)

GTD Data Model: Define GTD stages (Inbox, Actionable, Next Actions, Waiting For, Someday) in /core/storage/models.js
Stage Processing Logic: Create workflow rules for moving items between GTD stages in /gtd/gtd-workflow.js
Inbox Processing Interface: Build UI for quickly processing inbox items with single-question workflow
GTD Dashboard View: Implement kanban-style board showing items by GTD stage
Next Action Decision Trees: Create guided flows for determining next actions
Create the GTD stage model exactly as specified (Inbox, Actionable, Next Actions, Waiting For, Someday) in models.js.
Implement the inbox processing interface with the critical yes/no "Is this actionable?" decision point as first step.
Build the actionable item processing with three possible paths: next action (do now), waiting for (delegate), or someday (defer).

4. NextAI Labs Custom Features (PLANNED)

Completion Questionnaire Flow: Build specialized workflows for completed items in /custom/nextai/completion-flow.js
Stakeholder Update Tracking: Implement system to track which completed items should be shared with investors, users, or team
Content Repurposing Flow: Create workflow for marking items for blog, changelog, email updates, or ads
Business-Specific Tags: Add automated tagging based on business context
Project Association: Connect items to specific NextAI projects or initiatives
Create the completion questionnaire flow with the exact investor update question: "Would this be appropriate to update investors about?"
Implement the user update tracking question: "Would this be appropriate to update users about?"
Add the conditional follow-up questions when user updates are appropriate: ad content, email updates, blog content, and changelog.
Create the team notification question: "Would this be something you should notify your team about?"
Implement the note for email updates: "If this is both substantial and high impact, it should" be included.
Build the tagging system that automatically applies tags like "update:investors", "update:users", "content:ad", etc. based on answers.

5. User Experience Enhancements (PLANNED)

Expanded Item View: Create click-to-expand functionality for viewing details without modal dialogs
Real-Time Updates: Make dashboard automatically refresh when items change
Advanced Filtering: Implement multi-tag filtering and saved filter presets
List View Enhancement: Add customizable columns and sorting options to list view
Keyboard Shortcuts: Implement keyboard navigation and shortcuts for rapid workflow
Replace the modal dialog with inline expansion full screen for viewing item details directly in the flow.
Implement auto-refresh of dashboard when items are modified in any view.
Add multi-tag filtering to allow selecting multiple tags simultaneously.

6. Plugin Architecture (FUTURE)

Extension Points: Create system for plugging in custom workflows
User Customization: Allow users to define their own workflow rules
API Integration: Create hooks for connecting with external systems

Each of these areas has clear deliverables and requirements that build on each other to create a comprehensive workflow capture and management system.To fix the current issues, we should focus first on implementing the basic events system and fixing the review.js file to properly handle the list view toggle.

todo-extension/
├── core/
│ └── storage/
│ ├── data-store.js (MODIFY - fix import issues)
│ └── models.js
├── capture/
│ ├── capture-popup.html (MODIFY - fix script references)
│ ├── capture-popup.js
│ └── capture.js (MODIFY - fix DataStore references)
├── components/
│ ├── item-renderer.js
│ └── tag-manager.js (MODIFY - fix DataStore references)
├── gtd/
│ ├── gtd-processor.js (CREATE NEW)
│ └── gtd-workflow.js
├── review/
│ ├── review.html (MODIFY - add script references)
│ ├── review.js (MODIFY - simplify)
│ ├── review.css (MODIFY - add tag selection styles)
│ ├── review-controller.js (CREATE NEW)
│ └── view-controller.js (CREATE NEW)
├── storage/
│ └── data-store.js (DELETE - conflicting with core/storage/data-store.js)
├── styles/
│ ├── capture-popup.css
│ └── common.css
├── ui/
│ ├── dashboard/
│ │ └── dashboard.js
│ └── views/
│ └── view-controller.js (DELETE - will be replaced by review/view-controller.js)
├── utils/
│ └── events.js (MODIFY - fix to use window.EventEmitter)
├── background.js
└── manifest.json

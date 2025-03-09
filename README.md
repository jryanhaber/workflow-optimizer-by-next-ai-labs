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

update Mar 9, 2025

Remaining GTD Extension UI Improvements
Here's a detailed breakdown of what still needs to be implemented for the complete GTD workflow extension:

30. Fix broken icon display in GTD processing UI - The current UI shows raw Unicode instead of proper icons, causing display issues that create a poor user experience.
31. Implement responsive image viewing in process views - The screenshot needs to dynamically resize based on screen size while maintaining visibility of crucial UI elements and content.
32. Add showToast notification function - Create a function to display user feedback messages with success/error styling that disappears after a few seconds.
33. Enhance "What's the Next Step" screen rendering - Update the content and styling to provide clear GTD coaching with a more visually distinct presentation of options.
34. Complete brainstorm-to-actions conversion UI - Add functionality to convert brainstorming notes into discrete actionable items with proper categorization.
35. Implement delegation form with validation - Create a form to collect delegate name, date, and notes with proper validation and error handling.
36. Add skip functionality for inbox processing - Allow users to temporarily skip items they're not ready to process without losing their place in the queue.
37. Create media queries for mobile responsiveness - Ensure the GTD processing UI works well on smaller screens with appropriate layout adjustments.
38. Add CSS for better GTD option visualization - Make the action buttons more distinctive with consistent icon styling and visual hierarchy.
39. Implement keyboard shortcuts for GTD processing - Allow power users to quickly navigate the GTD workflow using keyboard shortcuts for common actions.

Manual Testing Checklist for GTD Extension UI Improvements
Here's a comprehensive list of manual tests needed to verify the functionality we've implemented: 30. Test Comprehensive GTD Processing Full-Screen Interface
Verify that the processing interface properly utilizes screen space with correct styling, icons, and layout.

Click the "Process" button next to "Inbox" in the GTD menu
Confirm the screenshot displays at an appropriate large size
Verify the GTD coaching information is visible and clearly formatted
Ensure all icons appear correctly (not as Unicode characters)
Check that the progress bar at the bottom shows correct progress

29. Test Actionable/Non-Actionable Decision Flow
    Verify that the first GTD decision point works correctly with proper options and navigation.

Process an inbox item and select "Actionable"
Verify you see the "What's the next step?" screen with options
Go back and select "Not Actionable" instead
Verify you see Reference/Trash options
Test that the Back button returns you to the initial question

28. Test Quick-File Options
    Verify that experienced users can bypass the full GTD flow with quick-file options.

On the first processing screen, use each quick-file option
Verify items are correctly filed to the appropriate category
Check that you advance to the next item automatically
Verify toast notifications appear confirming the filing action
Check that the process completes correctly when all items are processed

27. Test Brainstorm Functionality
    Verify that the brainstorm option works properly with notes and follow-up actions.

Process an item and select "Brainstorm" option
Verify the brainstorming interface appears with text area
Add brainstorming notes and click "Save as Brainstorm Item"
Verify the item appears in the Brainstorm category with notes
Try the "Convert to Next Actions" option and verify you can create multiple actions

26. Test Navigation Between Processing Steps
    Verify that users can navigate between steps in the GTD workflow.

Process an item and try navigating forward and backward through steps
Verify the Skip button works to move to the next item
Test that processing notes are preserved when moving between screens
Verify that completing or skipping all items shows a completion screen
Check that the close button returns you to the main view

25. Test UI on Different Screen Sizes
    Verify that the interface is responsive and works well on different devices.

Test the processing interface on a desktop browser
Resize the browser window to verify responsive behavior
Check that image scaling works correctly at different sizes
Verify button sizing and spacing remains usable on smaller screens
Ensure text remains readable at all viewport sizes

24. Test Error Handling in Processing Flow
    Verify that the system gracefully handles errors during processing.

Try processing with network connectivity issues
Test error handling when saving items fails
Verify appropriate error messages appear via toast notifications
Check that users can retry or continue after errors
Ensure the UI doesn't break when errors occur

23. Test Integration with Existing GTD Categories
    Verify that processed items appear in the correct GTD categories.

Process several items to different categories (Next Actions, Reference, etc.)
Navigate to each category in the GTD menu
Verify items appear in the expected categories with correct metadata
Check that count indicators in the GTD menu update correctly
Verify that the view filters work correctly with newly processed items

22. Test Toast Notification System
    Verify that the toast notification system provides clear user feedback.

Perform various actions that trigger notifications
Verify notifications appear with appropriate styling
Check that notifications automatically disappear after a few seconds
Verify multiple notifications stack correctly
Ensure notifications are visible but not intrusive

21. Test Processing Persistence
    Verify that processing state is maintained if the user navigates away.

Begin processing inbox items
Navigate to another view, then return to processing
Verify the processing continues from where you left off
Test refreshing the page during processing
Check that filter states are remembered between sessions

20. Test Item Notes and Additional Content
    Verify that notes and additional metadata are correctly saved with processed items.

Add processing notes to items
Check that notes are saved with the items
Verify notes appear when viewing the items later
Test that long notes are properly handled (scrolling, etc.)
Check formatting of notes in the item detail view

todo-extension/
├── background.js
├── capture/
│ ├── capture-popup.html
│ ├── capture-popup.js
│ └── capture.js
├── components/
│ ├── item-renderer.js
│ └── tag-manager.js
├── core/storage/
│ ├── data-store.js
│ └── models.js
├── custom/nextai/
│ └── completion-flow.js
├── gpt/
│ └── analyzer.js
├── gtd/
│ ├── gtd-processor.js
│ └── gtd-workflow.js
├── review/
│ ├── review-controller.js
│ ├── review.css
│ ├── review.html
│ └── review.js
├── styles/
│ └── styles.css
├── tests/
├── ui/
│ ├── dashboard/
│ │ └── dashboard.js
│ └── views/
│ └── view-controller.js
├── utils/
│ └── events.js
└── manifest.json

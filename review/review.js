// Initialize the review page
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded event fired in review.js');

  // Check if required components are available
  if (!window.EventEmitter) {
    console.error('EventEmitter not found! Check that utils/events.js is loaded.');
  }

  if (!window.DataStore) {
    console.error('DataStore not found! Check that core/storage/data-store.js is loaded.');
  }

  // Check for view controller
  if (!window.viewController) {
    console.error('View controller not found! Check that view-controller.js is loaded.');

    // Create a simple view controller to avoid errors
    window.viewController = {
      setupViewToggle: function () {
        console.log('Using fallback view toggle setup');
      },
      getCurrentViewMode: function () {
        return localStorage.getItem('preferredView') || 'card';
      },
      createCardItem: function (item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `<div>${item.title || 'No title'}</div>`;
        return card;
      },
      createListItem: function (item) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.innerHTML = `<div>${item.title || 'No title'}</div>`;
        return listItem;
      }
    };
  }

  // Initialize the review controller
  if (window.reviewController) {
    console.log('Review controller found, initializing...');
    window.reviewController.initialize();
  } else {
    console.error(
      'Review controller not found! Make sure review-controller.js is loaded before review.js.'
    );

    // Create error notification in UI
    const container = document.querySelector('.app-container');
    if (container) {
      const errorNotice = document.createElement('div');
      errorNotice.style.backgroundColor = '#ffdddd';
      errorNotice.style.color = '#ff0000';
      errorNotice.style.padding = '15px';
      errorNotice.style.margin = '15px';
      errorNotice.style.borderRadius = '5px';
      errorNotice.innerHTML = `
        <h3>Error: Review Controller Not Found</h3>
        <p>The review controller component couldn't be loaded. This may be due to script loading errors.</p>
        <p>Please check the console for more details.</p>
      `;
      container.prepend(errorNotice);
    }
  }
});

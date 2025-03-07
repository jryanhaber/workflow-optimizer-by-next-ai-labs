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

  // Set up view toggle if available
  if (window.viewController && typeof window.viewController.setupViewToggle === 'function') {
    console.log('Setting up view toggle...');
    window.viewController.setupViewToggle();
  } else {
    console.error('View controller not found or missing setupViewToggle method!');
    console.log('Creating minimal view controller...');

    // Create minimal view controller to avoid errors
    window.viewController = {
      setupViewToggle: function () {
        console.log('Minimal view toggle setup');
        const cardViewBtn = document.getElementById('card-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');

        if (cardViewBtn && listViewBtn) {
          const currentView = localStorage.getItem('preferredView') || 'card';

          if (currentView === 'list') {
            cardViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
          } else {
            cardViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
          }

          cardViewBtn.addEventListener('click', function () {
            localStorage.setItem('preferredView', 'card');
            cardViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            location.reload();
          });

          listViewBtn.addEventListener('click', function () {
            localStorage.setItem('preferredView', 'list');
            listViewBtn.classList.add('active');
            cardViewBtn.classList.remove('active');
            location.reload();
          });
        }
      },
      getCurrentViewMode: function () {
        return localStorage.getItem('preferredView') || 'card';
      }
    };

    window.viewController.setupViewToggle();
  }

  // Initialize the review controller
  if (window.reviewController && typeof window.reviewController.initialize === 'function') {
    console.log('Review controller found, initializing...');
    try {
      window.reviewController.initialize();
    } catch (e) {
      console.error('Error initializing review controller:', e);
      showErrorMessage('Failed to initialize review page: ' + e.message);
    }
  } else {
    console.error(
      'Review controller not found! Make sure review-controller.js is loaded before review.js.'
    );
    showErrorMessage('Error: Review controller not found');
  }

  function showErrorMessage(message) {
    const container = document.querySelector('.app-container');
    if (container) {
      const errorNotice = document.createElement('div');
      errorNotice.style.backgroundColor = '#ffdddd';
      errorNotice.style.color = '#ff0000';
      errorNotice.style.padding = '15px';
      errorNotice.style.margin = '15px';
      errorNotice.style.borderRadius = '5px';
      errorNotice.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <p>Please check the console for more details.</p>
      `;
      container.prepend(errorNotice);
    }
  }
});

<script src="../ui/views/view-controller.js"></script>;

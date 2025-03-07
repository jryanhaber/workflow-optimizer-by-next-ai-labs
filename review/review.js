// Initialize the review page
document.addEventListener('DOMContentLoaded', function () {
  // Initialize the review controller
  if (window.reviewController) {
    window.reviewController.initialize();
  } else {
    console.error('Review controller not found');
  }
});

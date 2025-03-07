document.addEventListener('DOMContentLoaded', function () {
  const testBtn = document.getElementById('test-datastore-btn');
  if (testBtn) {
    testBtn.addEventListener('click', function () {
      console.clear();
      console.log('Testing DataStore...');

      // Check if DataStore exists
      console.log('DataStore exists:', !!window.DataStore);

      // Check if specific methods exist
      if (window.DataStore) {
        console.log('saveItem method exists:', typeof window.DataStore.saveItem === 'function');
        console.log(
          'getAllItems method exists:',
          typeof window.DataStore.getAllItems === 'function'
        );
        console.log('on method exists:', typeof window.DataStore.on === 'function');

        // Try to execute a method
        if (typeof window.DataStore.getAllItems === 'function') {
          console.log('Trying to call getAllItems...');
          window.DataStore.getAllItems()
            .then((items) => console.log('Items retrieved:', items))
            .catch((err) => console.error('Error getting items:', err));
        }
      }

      // List all scripts that have been loaded
      console.log('Loaded scripts:');
      document.querySelectorAll('script').forEach((script, i) => {
        console.log(`${i + 1}. ${script.src || 'inline script'}`);
      });

      alert('DataStore test complete - check console for results');
    });
  }
});

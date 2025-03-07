console.log('Starting script loading');

// Define a console logger to track DataStore initialization
(function () {
  const originalConsoleLog = console.log;
  console.log = function (...args) {
    if (args[0] === 'DataStore initialized') {
      console.trace('DataStore initialization stack trace');
    }
    originalConsoleLog.apply(console, args);
  };
})();

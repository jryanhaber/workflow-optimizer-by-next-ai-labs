// This is a service worker that will run in the background
chrome.runtime.onInstalled.addListener(() => {
  console.log('Todo Manager extension installed');
});

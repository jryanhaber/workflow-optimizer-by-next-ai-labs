// Data structures
const state = {
  todos: [],
  tags: [],
  filter: 'all' // 'all', 'active', 'completed'
};

// Initialize the application
function initialize() {
  loadFromStorage();
  renderApp();
  setupEventListeners();
}

// Load data from chrome storage instead of localStorage
function loadFromStorage() {
  chrome.storage.sync.get(['todos', 'tags'], (result) => {
    if (result.todos) state.todos = result.todos;
    if (result.tags) state.tags = result.tags;
    renderTodos();
    renderTags();
  });
}

// Save data to chrome storage
function saveToStorage() {
  chrome.storage.sync.set({
    todos: state.todos,
    tags: state.tags
  });
}

// Create a new todo item
function createTodo(text) {
  const newTodo = {
    id: Date.now(),
    text,
    completed: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.todos.push(newTodo);
  saveToStorage();
  renderTodos();
}

// Toggle todo completion status
function toggleTodo(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    todo.updatedAt = new Date().toISOString();
    saveToStorage();
    renderTodos();
  }
}

// Add tag to a todo
function addTagToTodo(todoId, tagName) {
  // Create tag if it doesn't exist
  let tag = state.tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());

  if (!tag) {
    tag = { id: Date.now(), name: tagName };
    state.tags.push(tag);
  }

  const todo = state.todos.find((t) => t.id === todoId);
  if (todo && !todo.tags.includes(tag.id)) {
    todo.tags.push(tag.id);
    todo.updatedAt = new Date().toISOString();
    saveToStorage();
    renderTodos();
  }
}

// Remove tag from a todo
function removeTagFromTodo(todoId, tagId) {
  const todo = state.todos.find((t) => t.id === todoId);
  if (todo) {
    todo.tags = todo.tags.filter((t) => t !== tagId);
    todo.updatedAt = new Date().toISOString();
    saveToStorage();
    renderTodos();
  }
}

// Delete a todo
function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id);
  saveToStorage();
  renderTodos();
}

// Filter todos based on current filter
function getFilteredTodos() {
  switch (state.filter) {
    case 'active':
      return state.todos.filter((t) => !t.completed);
    case 'completed':
      return state.todos.filter((t) => t.completed);
    default:
      return state.todos;
  }
}

// Get todos filtered by tag
function getTodosByTag(tagId) {
  return state.todos.filter((todo) => todo.tags.includes(tagId));
}

// Render the entire application
function renderApp() {
  const appContainer = document.getElementById('todo-app');
  appContainer.innerHTML = `
    <div class="app-container">
      <header>
        <h1>Todo Manager</h1>
        <div class="input-group">
          <input type="text" id="new-todo" placeholder="Add a new task...">
          <button id="add-todo">Add</button>
        </div>
      </header>
      
      <div class="filters">
        <button data-filter="all" class="filter-btn ${
          state.filter === 'all' ? 'active' : ''
        }">All</button>
        <button data-filter="active" class="filter-btn ${
          state.filter === 'active' ? 'active' : ''
        }">Active</button>
        <button data-filter="completed" class="filter-btn ${
          state.filter === 'completed' ? 'active' : ''
        }">Completed</button>
      </div>
      
      <div class="tags-container">
        <h2>Tags</h2>
        <div class="tags-list" id="tags-list"></div>
        <div class="input-group">
          <input type="text" id="new-tag" placeholder="Create new tag...">
          <button id="add-tag">Add</button>
        </div>
      </div>
      
      <div class="todos-container">
        <ul id="todos-list"></ul>
      </div>
    </div>
  `;

  renderTags();
  renderTodos();
}

// Render the tags list
function renderTags() {
  const tagsList = document.getElementById('tags-list');
  if (!tagsList) return;

  tagsList.innerHTML = '';

  state.tags.forEach((tag) => {
    const tagEl = document.createElement('span');
    tagEl.classList.add('tag');
    tagEl.setAttribute('data-tag-id', tag.id);
    tagEl.textContent = tag.name;
    tagsList.appendChild(tagEl);
  });
}

// Render the todos list
function renderTodos() {
  const todosContainer = document.getElementById('todos-list');
  if (!todosContainer) return;

  todosContainer.innerHTML = '';

  const todos = getFilteredTodos();

  todos.forEach((todo) => {
    const todoEl = document.createElement('li');
    todoEl.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoEl.setAttribute('data-todo-id', todo.id);

    const todoTags = todo.tags
      .map((tagId) => {
        const tag = state.tags.find((t) => t.id === tagId);
        return tag ? `<span class="todo-tag" data-tag-id="${tagId}">${tag.name} ×</span>` : '';
      })
      .join('');

    todoEl.innerHTML = `
      <div class="todo-content">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${todo.text}</span>
        <div class="todo-tags">${todoTags}</div>
      </div>
      <div class="todo-actions">
        <button class="add-tag-btn">+Tag</button>
        <button class="delete-btn">×</button>
      </div>
    `;

    todosContainer.appendChild(todoEl);
  });
}

// Set up all event listeners
function setupEventListeners() {
  // Add todo
  document.getElementById('add-todo').addEventListener('click', () => {
    const input = document.getElementById('new-todo');
    const text = input.value.trim();
    if (text) {
      createTodo(text);
      input.value = '';
    }
  });

  // Enter key to add todo
  document.getElementById('new-todo').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) {
        createTodo(text);
        e.target.value = '';
      }
    }
  });

  // Add tag
  document.getElementById('add-tag').addEventListener('click', () => {
    const input = document.getElementById('new-tag');
    const name = input.value.trim();
    if (name && !state.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())) {
      state.tags.push({ id: Date.now(), name });
      saveToStorage();
      renderTags();
      input.value = '';
    }
  });

  // Enter key to add tag
  document.getElementById('new-tag').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const name = e.target.value.trim();
      if (name && !state.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())) {
        state.tags.push({ id: Date.now(), name });
        saveToStorage();
        renderTags();
        e.target.value = '';
      }
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filter = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderTodos();
    });
  });

  // Todo item interactions using event delegation
  document.getElementById('todos-list').addEventListener('click', (e) => {
    const todoEl = e.target.closest('.todo-item');
    if (!todoEl) return;

    const todoId = parseInt(todoEl.getAttribute('data-todo-id'));

    // Toggle completion
    if (e.target.classList.contains('todo-checkbox')) {
      toggleTodo(todoId);
    }

    // Delete todo
    if (e.target.classList.contains('delete-btn')) {
      deleteTodo(todoId);
    }

    // Add tag to todo
    if (e.target.classList.contains('add-tag-btn')) {
      const tagName = prompt('Enter tag name:');
      if (tagName && tagName.trim()) {
        addTagToTodo(todoId, tagName.trim());
      }
    }

    // Remove tag from todo
    if (e.target.classList.contains('todo-tag')) {
      const tagId = parseInt(e.target.getAttribute('data-tag-id'));
      removeTagFromTodo(todoId, tagId);
    }
  });

  // Filter by tag
  document.getElementById('tags-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
      const tagId = parseInt(e.target.getAttribute('data-tag-id'));
      // Toggle active class on the tag
      if (e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        state.filter = 'all';
      } else {
        document.querySelectorAll('.tag').forEach((t) => t.classList.remove('active'));
        e.target.classList.add('active');
        // Filter todos by this tag
        const filteredTodos = getTodosByTag(tagId);
        renderTodosWithCustomFilter(filteredTodos);
        return;
      }
      renderTodos();
    }
  });
}

// Render with a custom filter
function renderTodosWithCustomFilter(todos) {
  const todosContainer = document.getElementById('todos-list');
  if (!todosContainer) return;

  todosContainer.innerHTML = '';

  todos.forEach((todo) => {
    const todoEl = document.createElement('li');
    todoEl.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoEl.setAttribute('data-todo-id', todo.id);

    const todoTags = todo.tags
      .map((tagId) => {
        const tag = state.tags.find((t) => t.id === tagId);
        return tag ? `<span class="todo-tag" data-tag-id="${tagId}">${tag.name} ×</span>` : '';
      })
      .join('');

    todoEl.innerHTML = `
      <div class="todo-content">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${todo.text}</span>
        <div class="todo-tags">${todoTags}</div>
      </div>
      <div class="todo-actions">
        <button class="add-tag-btn">+Tag</button>
        <button class="delete-btn">×</button>
      </div>
    `;

    todosContainer.appendChild(todoEl);
  });
}

// Initialize application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

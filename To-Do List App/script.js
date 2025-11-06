
// Data and setup
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
tasks.forEach(task => {
    if (typeof task.createdAt === 'string') {
        task.createdAt = new Date(task.createdAt);
    }
});
let taskCounter = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;


// DOM elements
const taskInput = document.getElementById('taskInput');             // input tag
const prioritySelect = document.getElementById('prioritySelect');   // select tag for priority
const addTaskBtn = document.getElementById('addTaskBtn');           // "Add Task" Button
const tasksContainer = document.getElementById('tasksContainer');   // div tag for task container
const statsDisplay = document.getElementById('statsDisplay');       // Div tag for status
const clearAllBtn = document.getElementById('clearAllBtn');         // "Clear All" Button
const priorityFilter = document.getElementById('priorityFilter');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const closeEditModal = document.getElementById('closeEditModal');

let taskIdBeingEdited = null;


// 🔥 MASTER EVENT DELEGATION - ONE LISTENER TO RULE THEM ALL!
document.addEventListener('click', function(event) {
    const a = event.target;
    
    // Handle task completion
    if (a.classList.contains('complete-btn')) {
        const taskElement = a.closest('[data-task-id]');
        const taskId = parseInt(taskElement.dataset.taskId);
        toggleTaskComplete(taskId);
    }
    // Handle task deletion
    else if (a.classList.contains('delete-btn')) {
        const taskElement = a.closest('[data-task-id]');
        const taskId = parseInt(taskElement.dataset.taskId);
        deleteTask(taskId);
    }    
 
    // Handle add task button
    else if (a.id === 'addTaskBtn') {
        addTask();
    }     
    // Handle clear all button
    else if (a.id === 'clearAllBtn') {
        clearAllTasks();
    }

    else if (a.classList.contains('edit-btn')) {
        const taskElement = a.closest('[data-task-id]');
        const taskId = parseInt(taskElement.dataset.taskId);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            editTaskInput.value = task.text;
            editPrioritySelect.value = task.priority;
            taskIdBeingEdited = taskId;
            editModal.style.display = 'flex';
            editTaskInput.focus();
        }
    }
});

saveEditBtn.addEventListener('click', function() {
    if (taskIdBeingEdited !== null) {
        const idx = tasks.findIndex(t => t.id === taskIdBeingEdited);
        if (idx !== -1) {
            tasks[idx].text = editTaskInput.value.trim();
            tasks[idx].priority = editPrioritySelect.value;
            saveTasksToStorage();
            renderTasks();
        }
        taskIdBeingEdited = null;
        editModal.style.display = 'none';
    }
});

cancelEditBtn.addEventListener('click', function() {
    taskIdBeingEdited = null;
    editModal.style.display = 'none';
});
closeEditModal.addEventListener('click', function() {
    taskIdBeingEdited = null;
    editModal.style.display = 'none';
});
// Optional: Hide modal on click outside modal-content
editModal.addEventListener('click', function(e){
    if(e.target === editModal){
        editModal.style.display = 'none';
        taskIdBeingEdited = null;
    }
});


// 🎯 KEYBOARD EVENT DELEGATION
document.addEventListener('keydown', function(event) {
    // Enter key in task input
    if (event.target.id === 'taskInput' && event.key === 'Enter') {
        addTask();
    }    
    // Escape to clear input
    if (event.key === 'Escape' && event.target.id === 'taskInput') {
        event.target.value = '';
    }
});

function saveTasksToStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}


function createTask(options = {}) {
    return {
        id: taskCounter++,
        text: options.text || 'Untitled Task',
        priority: options.priority || 'medium',
        completed: options.completed || false,
        createdAt: options.createdAt || new Date()
    };
}

// Task management functions
function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    if (!text) {
        showSnackbar('Please enter a task!');
        return;
    }
    const newTask = createTask({
        text: text,
        priority: priority
    });
    showSnackbar('Task added!');
    tasks.push(newTask);
    taskInput.value = '';
    saveTasksToStorage();
    renderTasks();
    updateStats();
    taskInput.focus();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        showSnackbar('Task marked complete!');
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    showSnackbar('Task deleted!');
    saveTasksToStorage();
    renderTasks();
    updateStats();
}

function clearAllTasks() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        tasks = [];
        taskCounter = 1;
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

priorityFilter.addEventListener('change', handlePriorityFilter);

function handlePriorityFilter() {
    renderTasks();
}

// Rendering functions
function renderTasks() {
    let displayTasks = tasks;
    const filterValue = priorityFilter.value;
    if(filterValue !== 'all') {
        displayTasks = tasks.filter(task => task.priority === filterValue);
    }
    tasksContainer.innerHTML = '';
    // Create document fragment for efficient rendering
    const fragment = document.createDocumentFragment();
    
    displayTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        fragment.appendChild(taskElement);
    });
    
    tasksContainer.appendChild(fragment);
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority}`;
    taskDiv.setAttribute('data-task-id', task.id);
    
    if (task.completed) {
        taskDiv.classList.add('completed');
    }
    
    taskDiv.innerHTML = `
        <div class="task-content">
            <div class="task-text">${task.text}</div>
            <div class="task-meta" style="font-size: 12px; font-weight: bold; color: #555; margin-top: 10px;">
                Priority: ${task.priority.toUpperCase()} | Created: ${task.createdAt.toLocaleDateString()}
            </div>
        </div>
        <div class="task-actions">
            <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>`;
    return taskDiv;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    statsDisplay.innerHTML = `
        <strong>Total: ${total} | Completed: ${completed} | High Priority: ${highPriority}</strong>`;
}

// Initialize
updateStats();
console.log('🚀 Event Delegation Task Manager Ready!');
console.log('💡 Keyboard shortcuts: Ctrl+A (add random), Escape (clear input)');


toggleDarkModeBtn.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    toggleDarkModeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 1800); // Show for 1.8 seconds
}

import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask, deleteTask as deleteTaskFirebase, subscribeToCategories, addCategory as addCategoryFirebase, deleteCategory as deleteCategoryFirebase } from '../firebase/firestore'
import { X, Plus, Trash2, LayoutGrid, Briefcase, Home, Folder, Star, Heart, Zap, Target, BookOpen, Code, Palette, Music, Check, ChevronDown } from 'lucide-react'
import '../styles/AllTasks.css'

const iconOptions = {
  LayoutGrid: <LayoutGrid size={16} />,
  Briefcase: <Briefcase size={16} />,
  Home: <Home size={16} />,
  Folder: <Folder size={16} />,
  Star: <Star size={16} />,
  Heart: <Heart size={16} />,
  Zap: <Zap size={16} />,
  Target: <Target size={16} />,
  BookOpen: <BookOpen size={16} />,
  Code: <Code size={16} />,
  Palette: <Palette size={16} />,
  Music: <Music size={16} />,
}

const defaultCategories = [
  { id: 'all-tasks', name: 'All Tasks', icon: 'LayoutGrid', isDefault: true },
  { id: 'office', name: 'Office', icon: 'Briefcase', isDefault: true },
  { id: 'home', name: 'Home', icon: 'Home', isDefault: true },
  { id: 'projects', name: 'Projects', icon: 'Folder', isDefault: true },
]

export default function AllTasks() {
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState(defaultCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState('all-tasks')
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Folder')
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [expandedTasks, setExpandedTasks] = useState(new Set())


  useEffect(() => {
    if (!currentUser) return

    const unsubscribeTasks = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
      setTasks(fetchedTasks)
      setLoading(false)
    })

    const unsubscribeCategories = subscribeToCategories(currentUser.uid, (firebaseCategories) => {
      const defaultIds = defaultCategories.map(cat => cat.id)
      const customCategories = firebaseCategories.filter(cat => !defaultIds.includes(cat.id))
      const allCategories = [...defaultCategories, ...customCategories]
      setCategories(allCategories)
      if (!selectedCategoryId || selectedCategoryId === 'all-tasks') {
        setSelectedCategoryId('all-tasks')
      }
    })

    return () => {
      unsubscribeTasks()
      unsubscribeCategories()
    }
  }, [currentUser])

  const addTask = async () => {
    if (!newTask.trim() || !currentUser) return

    try {
      const categoryId = selectedCategoryId === 'all-tasks' ? null : selectedCategoryId
      await addTaskFirebase(currentUser.uid, {
        text: newTask.trim(),
        completed: false,
        category: categoryId
      })
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim() || !currentUser) return

    try {
      let baseId = newCategoryName.toLowerCase().replace(/\s+/g, '-')
      let uniqueId = baseId
      let counter = 1

      while (categories.some(cat => cat.id === uniqueId)) {
        uniqueId = `${baseId}-${counter}`
        counter++
      }

      const newCategory = {
        id: uniqueId,
        name: newCategoryName.trim(),
        icon: selectedIcon,
        isDefault: false
      }

      await addCategoryFirebase(currentUser.uid, newCategory)
      setNewCategoryName('')
      setSelectedIcon('Folder')
      setShowNewCategoryForm(false)
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to add category')
    }
  }

  const deleteCategory = async (categoryId) => {
    if (!currentUser || !confirm('Delete this category and all its tasks?')) return

    try {
      await deleteCategoryFirebase(currentUser.uid, categoryId)
      setSelectedCategoryId('all-tasks')
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const toggleTask = async (taskId, currentStatus) => {
    if (!currentUser) return

    try {
      await updateTask(currentUser.uid, taskId, { completed: !currentStatus })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (!currentUser || !confirm('Delete this task?')) return

    try {
      await deleteTaskFirebase(currentUser.uid, taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
    // Add a slight delay to allow the drag image to be created
    setTimeout(() => {
      e.target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (columnStatus) => {
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || !currentUser) return

    // Determine the new status and completed state
    let newStatus = targetStatus
    let newCompleted = false

    if (targetStatus === 'completed') {
      newStatus = 'done'
      newCompleted = true
    }

    // Only update if the status actually changed
    if (draggedTask.status !== newStatus || draggedTask.completed !== newCompleted) {
      try {
        await updateTask(currentUser.uid, draggedTask.id, {
          status: newStatus,
          completed: newCompleted
        })
      } catch (error) {
        console.error('Error updating task:', error)
      }
    }

    setDraggedTask(null)
  }

  // Toggle task card expansion
  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  // Filter tasks based on selected category
  const filteredTasks = selectedCategoryId === 'all-tasks'
    ? tasks
    : tasks.filter(t => t.category === selectedCategoryId)

  // Sort tasks by status priority: in-progress > new > done
  const sortTasksByStatus = (tasksToSort) => {
    const statusPriority = {
      'in-progress': 1,
      'new': 2,
      'done': 3
    }

    return [...tasksToSort].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999
      const priorityB = statusPriority[b.status] || 999
      return priorityA - priorityB
    })
  }

  const sortedTasks = sortTasksByStatus(filteredTasks)
  const activeTasks = sortedTasks.filter(t => !t.completed)
  const completedTasks = sortedTasks.filter(t => t.completed)
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  return (
    <main className="all-tasks-main">
      {/* Add New Category Button */}
      <button
        onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
        className="add-category-btn"
      >
        <Plus size={20} />
        Add Category
      </button>

      {/* New Category Form */}
      {showNewCategoryForm && (
        <div className="new-category-form">
          <h3 className="form-title">Create New Category</h3>

          <div>
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              placeholder="e.g., Shopping, Learning, Health"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Select Icon</label>
            <div className="icon-grid">
              {Object.keys(iconOptions).map(iconName => (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className={`icon-btn ${selectedIcon === iconName ? 'selected' : ''}`}
                  title={iconName}
                >
                  {iconOptions[iconName]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={addCategory}
              className="btn-primary"
            >
              Create Category
            </button>
            <button
              onClick={() => {
                setShowNewCategoryForm(false)
                setNewCategoryName('')
                setSelectedIcon('Folder')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="categories-and-content-wrapper">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`category-tab ${selectedCategoryId === cat.id ? 'active' : ''}`}
              >
                {iconOptions[cat.icon]}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Selected Category Content */}
          {selectedCategory && (
            <div className="category-content">
              {/* Header Section */}
              <div className="category-header">
                <div className="category-info">
                  <div className="category-icon">
                    {iconOptions[selectedCategory.icon]}
                  </div>
                  <div>
                    <h3 className="category-title">
                      {selectedCategory.name}
                    </h3>
                    <p className="category-stats">
                      {activeTasks.length} active • {completedTasks.length} completed
                    </p>
                  </div>
                </div>

                {/* Add Task & Delete Category Buttons */}
                <div className="header-actions">
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="btn-add-task"
                  >
                    <Plus size={18} />
                    Add Task
                  </button>
                  {!selectedCategory.isDefault && (
                    <button
                      onClick={() => deleteCategory(selectedCategory.id)}
                      className="btn-delete-category"
                      title="Delete category and all its tasks"
                    >
                      <Trash2 size={18} />
                      Delete Category
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks Kanban Board */}
              <div className="tasks-container">
                {loading ? (
                  <p className="loading-text">Loading tasks...</p>
                ) : (
                  <div className="kanban-board">
                    {/* New Tasks Column */}
                    <div className={`kanban-column ${dragOverColumn === 'new' ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter('new')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'new')}>
                      <h4>📝 New Task ({filteredTasks.filter(t => t.status === 'new' && !t.completed).length})</h4>
                      {filteredTasks.filter(t => t.status === 'new' && !t.completed).length === 0 ? (
                        <div className="kanban-empty">No new tasks</div>
                      ) : (
                        filteredTasks
                          .filter(t => t.status === 'new' && !t.completed)
                          .map(task => (
                            <div
                              key={task.id}
                              className={`task-card priority-${task.priority || 'medium'} ${expandedTasks.has(task.id) ? 'expanded' : ''}`} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}>
                              <div className="task-card-title">{task.text}</div>
                              {expandedTasks.has(task.id) && task.description && (
                                <div className="task-card-description">
                                  {task.description}
                                </div>
                              )}
                              <div className="task-card-footer">
                                <span className="task-card-due-date">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                </span>
                                {task.description && (
                                  <button
                                    onClick={() => toggleTaskExpand(task.id)}
                                    className="task-card-more"
                                    title="Show details"
                                  >
                                    <ChevronDown size={14} style={{ transform: expandedTasks.has(task.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="task-card-delete"
                                  title="Delete task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* In Progress Column */}
                    <div className={`kanban-column ${dragOverColumn === 'in-progress' ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter('in-progress')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'in-progress')}>
                      <h4>⏳ In Progress ({filteredTasks.filter(t => t.status === 'in-progress' && !t.completed).length})</h4>
                      {filteredTasks.filter(t => t.status === 'in-progress' && !t.completed).length === 0 ? (
                        <div className="kanban-empty">No tasks in progress</div>
                      ) : (
                        filteredTasks
                          .filter(t => t.status === 'in-progress' && !t.completed)
                          .map(task => (
                            <div
                              key={task.id}
                              className={`task-card priority-${task.priority || 'medium'} ${expandedTasks.has(task.id) ? 'expanded' : ''}`} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}>
                              <div className="task-card-title">{task.text}</div>
                              {expandedTasks.has(task.id) && task.description && (
                                <div className="task-card-description">
                                  {task.description}
                                </div>
                              )}
                              <div className="task-card-footer">
                                <span className="task-card-due-date">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                </span>
                                {task.description && (
                                  <button
                                    onClick={() => toggleTaskExpand(task.id)}
                                    className="task-card-more"
                                    title="Show details"
                                  >
                                    <ChevronDown size={14} style={{ transform: expandedTasks.has(task.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="task-card-delete"
                                  title="Delete task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Completed Column */}
                    <div className={`kanban-column ${dragOverColumn === 'completed' ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter('completed')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'completed')}>
                      <h4>✅ Completed ({filteredTasks.filter(t => t.completed || t.status === 'done').length})</h4>
                      {filteredTasks.filter(t => t.completed || t.status === 'done').length === 0 ? (
                        <div className="kanban-empty">No completed tasks</div>
                      ) : (
                        filteredTasks
                          .filter(t => t.completed || t.status === 'done')
                          .map(task => (
                            <div
                              key={task.id}
                              className={`task-card priority-${task.priority || 'medium'} ${expandedTasks.has(task.id) ? 'expanded' : ''}`}
                              style={{ opacity: 0.6, color: '#9ca3af' }}
                            >
                              <div className="task-card-title" style={{ textDecoration: 'line-through', color: '#9ca3af' }}>
                                {task.text}
                              </div>
                              {expandedTasks.has(task.id) && task.description && (
                                <div className="task-card-description">
                                  {task.description}
                                </div>
                              )}
                              <div className="task-card-footer">
                                <span className="task-card-due-date">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                </span>
                                {task.description && (
                                  <button
                                    onClick={() => toggleTaskExpand(task.id)}
                                    className="task-card-more"
                                    title="Show details"
                                  >
                                    <ChevronDown size={14} style={{ transform: expandedTasks.has(task.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="task-card-delete"
                                  title="Delete task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <>
          {/* Modal Overlay */}
          <div className="modal-overlay">
            <div className="modal-container">
              <AddTaskModal
                categoryId={selectedCategoryId}
                categoryName={selectedCategory?.name || 'All Tasks'}
                onSubmit={() => {
                  setShowAddTaskModal(false)
                  setNewTask('')
                }}
                onCancel={() => setShowAddTaskModal(false)}
              />
            </div>
          </div>
        </>
      )}
    </main>
  )
}

// Add Task Modal Component
function AddTaskModal({ categoryId, categoryName, onSubmit, onCancel }) {
  const { currentUser } = useAuth()
  const [taskText, setTaskText] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('new')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!taskText.trim() || !currentUser) return

    try {
      const selectedCategoryId = categoryId === 'all-tasks' ? null : categoryId
      await addTaskFirebase(currentUser.uid, {
        text: taskText.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        priority: priority,
        status: status,
        completed: false,
        category: selectedCategoryId,
        createdAt: new Date().toISOString()
      })
      onSubmit()
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      {/* Modal Header */}
      <div className="modal-header">
        <h3 className="modal-title">
          ✓ Add New Task
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-close"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Category Info */}
      <div className="category-badge">
        📁 <strong>Category:</strong> {categoryName}
      </div>

      {/* Task Title (Required) */}
      <div>
        <label className="form-label">Task Title *</label>
        <input
          type="text"
          placeholder="Enter task title..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="form-input"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="form-label">Description</label>
        <textarea
          placeholder="Enter task details (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="form-textarea"
        />
      </div>

      {/* Grid: Due Date, Priority, Status */}
      <div className="form-grid">
        {/* Due Date */}
        <div>
          <label className="form-label">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="form-label">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="form-input"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="form-label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input"
          >
            <option value="new">📝 New</option>
            <option value="in-progress">⏳ In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn-submit"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


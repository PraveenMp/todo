import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask, deleteTask as deleteTaskFirebase, subscribeToCategories, addCategory as addCategoryFirebase, deleteCategory as deleteCategoryFirebase } from '../firebase/firestore'
import { X, Plus, Trash2, LayoutGrid, Briefcase, Home, Folder, Star, Heart, Zap, Target, BookOpen, Code, Palette, Music, Check } from 'lucide-react'
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
      <div className="page-header">
        <h2 className="title page-title">My Tasks</h2>
        <p className="page-subtitle">Organize your tasks by categories and track progress</p>
      </div>

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
        <>
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

              {/* Tasks Table */}
              <div className="tasks-container">
                {loading ? (
                  <p className="loading-text">Loading tasks...</p>
                ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-title">No tasks yet</p>
                    <p className="empty-subtitle">Add your first task to get started!</p>
                  </div>
                ) : (
                  <>
                    {/* Active Tasks Table */}
                    {activeTasks.length > 0 && (
                      <div className="tasks-section">
                        <h4 className="section-title">
                          Active Tasks ({activeTasks.length})
                        </h4>
                        <div className="table-responsive">
                          <table className="tasks-table">
                            <thead>
                              <tr className="table-header">
                                <th className="th-cell">Task</th>
                                <th className="th-cell">Priority</th>
                                <th className="th-cell">Task Status</th>
                                <th className="th-cell">Due Date</th>
                                <th className="th-cell th-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeTasks.map((task, idx) => (
                                <tr
                                  key={task.id}
                                  className="task-row"
                                >
                                  <td className="td-cell task-text">
                                    {task.text}
                                  </td>
                                  <td className="td-cell">
                                    <select
                                      value={task.priority}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { priority: e.target.value })}
                                      className="status-select"
                                    >
                                      <option value="low">🟢 Low</option>
                                      <option value="medium">🟡 Medium</option>
                                      <option value="high">🔴 High</option>
                                    </select>
                                  </td>
                                  <td className="td-cell">
                                    <select
                                      value={task.status}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { status: e.target.value })}
                                      className="status-select"
                                    >
                                      <option value="new">📝 New</option>
                                      <option value="in-progress">⏳ In Progress</option>
                                      <option value="done">✅ Done</option>
                                    </select>
                                  </td>
                                  <td className="td-cell">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                  </td>
                                  <td className="td-cell th-center">
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="btn-delete-task"
                                      title="Delete task"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Completed Tasks Table */}
                    {completedTasks.length > 0 && (
                      <div>
                        <h4 className="section-title">
                          Completed Tasks ({completedTasks.length})
                        </h4>
                        <div className="table-responsive">
                          <table className="tasks-table">
                            <thead>
                              <tr className="table-header">
                                <th className="th-cell">Task</th>
                                <th className="th-cell">Priority</th>
                                <th className="th-cell">Task Status</th>
                                <th className="th-cell">Due Date</th>
                                <th className="th-cell th-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedTasks.map((task, idx) => (
                                <tr
                                  key={task.id}
                                  className="task-row"
                                >
                                  <td className="td-cell completed-text">
                                    {task.text}
                                  </td>
                                  <td className="td-cell completed-text">
                                    <select
                                      value={task.priority}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { priority: e.target.value })}
                                      className="status-select completed-text"
                                    >
                                      <option value="low">🟢 Low</option>
                                      <option value="medium">🟡 Medium</option>
                                      <option value="high">🔴 High</option>
                                    </select>
                                  </td>
                                  <td className="td-cell completed-text">
                                    <select
                                      value={task.status}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { status: e.target.value })}
                                      className="status-select completed-text"
                                    >
                                      <option value="new">📝 New</option>
                                      <option value="in-progress">⏳ In Progress</option>
                                      <option value="done">✅ Done</option>
                                    </select>
                                  </td>
                                  <td className="td-cell completed-text">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                  </td>
                                  <td className="td-cell th-center">
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="btn-delete-task"
                                      title="Delete task"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
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

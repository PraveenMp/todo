import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTasks, addTask as addTaskFirebase, updateTask, deleteTask as deleteTaskFirebase, subscribeToCategories, addCategory as addCategoryFirebase, deleteCategory as deleteCategoryFirebase } from '../firebase/firestore'
import { X, Plus, Trash2, LayoutGrid, Briefcase, Home, Folder, Star, Heart, Zap, Target, BookOpen, Code, Palette, Music, Check } from 'lucide-react'

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
  const isDarkMode = document.body.classList.contains('dark-mode')

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

  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = filteredTasks.filter(t => t.completed)
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  return (
    <main className="main" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 className="title" style={{ marginBottom: '8px' }}>My Tasks</h2>
        <p style={{ color: '#6b7280', marginBottom: '0' }}>Organize your tasks by categories and track progress</p>
      </div>

      {/* Add New Category Button */}
      <button
        onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
        style={{
          padding: '14px 24px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '15px',
          fontWeight: '600',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'}
        onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'}
      >
        <Plus size={20} />
        Add Category
      </button>

      {/* New Category Form */}
      {showNewCategoryForm && (
        <div style={{
          marginBottom: '30px',
          padding: '24px',
          background: isDarkMode ? '#111827' : '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Create New Category</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Category Name *</label>
            <input
              type="text"
              placeholder="e.g., Shopping, Learning, Health"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'inherit',
                background: isDarkMode ? '#1f2937' : '#ffffff',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>Select Icon</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.keys(iconOptions).map(iconName => (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  style={{
                    padding: '12px',
                    border: selectedIcon === iconName ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: selectedIcon === iconName 
                      ? isDarkMode ? '#1e40af' : '#dbeafe'
                      : isDarkMode ? '#1f2937' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedIcon === iconName ? '#3b82f6' : isDarkMode ? '#e5e7eb' : '#374151',
                    transition: 'all 0.3s ease'
                  }}
                  title={iconName}
                >
                  {iconOptions[iconName]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={addCategory}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                transition: 'background 0.3s ease',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              Create Category
            </button>
            <button
              onClick={() => {
                setShowNewCategoryForm(false)
                setNewCategoryName('')
                setSelectedIcon('Folder')
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                transition: 'background 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 0 && (
        <>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '12px',
            borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                style={{
                  padding: '12px 20px',
                  background: selectedCategoryId === cat.id 
                    ? '#3b82f6' 
                    : isDarkMode ? '#1f2937' : '#f3f4f6',
                  color: selectedCategoryId === cat.id 
                    ? 'white' 
                    : isDarkMode ? '#e5e7eb' : '#374151',
                  border: selectedCategoryId === cat.id 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: selectedCategoryId === cat.id ? '700' : '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategoryId !== cat.id) {
                    e.target.style.background = isDarkMode ? '#374151' : '#e5e7eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategoryId !== cat.id) {
                    e.target.style.background = isDarkMode ? '#1f2937' : '#f3f4f6'
                  }
                }}
              >
                {iconOptions[cat.icon]}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Selected Category Content */}
          {selectedCategory && (
            <div style={{
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Header Section */}
              <div style={{
                padding: '24px',
                background: isDarkMode ? '#111827' : '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    fontSize: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {iconOptions[selectedCategory.icon]}
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '24px', 
                      fontWeight: '700',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937'
                    }}>
                      {selectedCategory.name}
                    </h3>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                      {activeTasks.length} active • {completedTasks.length} completed
                    </p>
                  </div>
                </div>

                {/* Add Task & Delete Category Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    style={{
                      padding: '12px 20px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2563eb'
                      e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#3b82f6'
                      e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Plus size={18} />
                    Add Task
                  </button>
                  {!selectedCategory.isDefault && (
                    <button
                      onClick={() => deleteCategory(selectedCategory.id)}
                      style={{
                        padding: '12px 16px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#fecaca'
                        e.target.style.color = '#991b1b'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fee2e2'
                        e.target.style.color = '#dc2626'
                      }}
                      title="Delete category and all its tasks"
                    >
                      <Trash2 size={18} />
                      Delete Category
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks Table */}
              <div style={{ padding: '24px' }}>
                {loading ? (
                  <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading tasks...</p>
                ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#6b7280'
                  }}>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>No tasks yet</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Add your first task to get started!</p>
                  </div>
                ) : (
                  <>
                    {/* Active Tasks Table */}
                    {activeTasks.length > 0 && (
                      <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937'
                        }}>
                          Active Tasks ({activeTasks.length})
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                          }}>
                            <thead>
                              <tr style={{
                                background: isDarkMode ? '#111827' : '#f3f4f6',
                                borderBottom: '2px solid #e5e7eb'
                              }}>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Task</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Priority</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Task Status</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Due Date</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'center',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeTasks.map((task, idx) => (
                                <tr
                                  key={task.id}
                                  style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    background: idx % 2 === 0 
                                      ? isDarkMode ? '#1f2937' : '#ffffff'
                                      : isDarkMode ? '#111827' : '#f9fafb',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDarkMode ? '#374151' : '#eff6ff'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = idx % 2 === 0 
                                      ? isDarkMode ? '#1f2937' : '#ffffff'
                                      : isDarkMode ? '#111827' : '#f9fafb'
                                  }}
                                >
                                  <td style={{
                                    padding: '16px',
                                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                    fontWeight: '500'
                                  }}>
                                    {task.text}
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: isDarkMode ? '#f3f4f6' : '#1f2937'
                                  }}>
                                    <select
                                      value={task.priority}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { priority: e.target.value })}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid ' + (isDarkMode ? '#4b5563' : '#d1d5db'),
                                        background: isDarkMode ? '#2d3748' : '#ffffff',
                                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      <option value="low">🟢 Low</option>
                                      <option value="medium">🟡 Medium</option>
                                      <option value="high">🔴 High</option>
                                    </select>
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: isDarkMode ? '#f3f4f6' : '#1f2937'
                                  }}>
                                    <select
                                      value={task.status}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { status: e.target.value })}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid ' + (isDarkMode ? '#4b5563' : '#d1d5db'),
                                        background: isDarkMode ? '#2d3748' : '#ffffff',
                                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      <option value="new">📝 New</option>
                                      <option value="in-progress">⏳ In Progress</option>
                                      <option value="done">✅ Done</option>
                                    </select>
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: isDarkMode ? '#f3f4f6' : '#1f2937'
                                  }}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    textAlign: 'center'
                                  }}>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = '#fecaca'
                                        e.target.style.color = '#991b1b'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = '#fee2e2'
                                        e.target.style.color = '#dc2626'
                                      }}
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
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937'
                        }}>
                          Completed Tasks ({completedTasks.length})
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                          }}>
                            <thead>
                              <tr style={{
                                background: isDarkMode ? '#111827' : '#f3f4f6',
                                borderBottom: '2px solid #e5e7eb'
                              }}>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Task</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Priority</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Task Status</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'left',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Due Date</th>
                                <th style={{
                                  padding: '16px',
                                  textAlign: 'center',
                                  fontWeight: '700',
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedTasks.map((task, idx) => (
                                <tr
                                  key={task.id}
                                  style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    background: idx % 2 === 0 
                                      ? isDarkMode ? '#1f2937' : '#ffffff'
                                      : isDarkMode ? '#111827' : '#f9fafb',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDarkMode ? '#374151' : '#eff6ff'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = idx % 2 === 0 
                                      ? isDarkMode ? '#1f2937' : '#ffffff'
                                      : isDarkMode ? '#111827' : '#f9fafb'
                                  }}
                                >
                                  <td style={{
                                    padding: '16px',
                                    color: '#6b7280',
                                    textDecoration: 'line-through'
                                  }}>
                                    {task.text}
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: '#6b7280',
                                    textDecoration: 'line-through'
                                  }}>
                                    <select
                                      value={task.priority}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { priority: e.target.value })}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid ' + (isDarkMode ? '#4b5563' : '#d1d5db'),
                                        background: isDarkMode ? '#2d3748' : '#ffffff',
                                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        textDecoration: 'line-through'
                                      }}
                                    >
                                      <option value="low">🟢 Low</option>
                                      <option value="medium">🟡 Medium</option>
                                      <option value="high">🔴 High</option>
                                    </select>
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: '#6b7280',
                                    textDecoration: 'line-through'
                                  }}>
                                    <select
                                      value={task.status}
                                      onChange={(e) => updateTask(currentUser.uid, task.id, { status: e.target.value })}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid ' + (isDarkMode ? '#4b5563' : '#d1d5db'),
                                        background: isDarkMode ? '#2d3748' : '#ffffff',
                                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        textDecoration: 'line-through'
                                      }}
                                    >
                                      <option value="new">📝 New</option>
                                      <option value="in-progress">⏳ In Progress</option>
                                      <option value="done">✅ Done</option>
                                    </select>
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    color: '#6b7280',
                                    textDecoration: 'line-through'
                                  }}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                  </td>
                                  <td style={{
                                    padding: '16px',
                                    textAlign: 'center'
                                  }}>
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = '#fecaca'
                                        e.target.style.color = '#991b1b'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = '#fee2e2'
                                        e.target.style.color = '#dc2626'
                                      }}
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
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setShowAddTaskModal(false)}
          >
            {/* Modal Content */}
            <div
              style={{
                background: isDarkMode ? '#111827' : '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '500px',
                width: '100%',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
  const isDarkMode = document.body.classList.contains('dark-mode')

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

  const inputStyle = {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
    transition: 'border-color 0.3s ease'
  }

  const selectStyle = {
    ...inputStyle,
    width: '100%',
    boxSizing: 'border-box'
  }

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* Modal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: '0', fontSize: '22px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
          ✓ Add New Task
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Category Info */}
      <div style={{
        padding: '12px 16px',
        background: isDarkMode ? '#1f2937' : '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        fontSize: '14px',
        color: isDarkMode ? '#e5e7eb' : '#374151'
      }}>
        📁 <strong>Category:</strong> {categoryName}
      </div>

      {/* Task Title (Required) */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Task Title *</label>
        <input
          type="text"
          placeholder="Enter task title..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          style={{
            ...inputStyle,
            width: '100%',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
        <textarea
          placeholder="Enter task details (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            boxSizing: 'border-box',
            resize: 'vertical',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Grid: Due Date, Priority, Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        {/* Due Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={selectStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Priority */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={selectStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={selectStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <option value="new">📝 New</option>
            <option value="in-progress">⏳ In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '14px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#059669'
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#10b981'
            e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '14px 20px',
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
          onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

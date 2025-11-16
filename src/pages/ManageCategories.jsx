import React, { useState, useEffect } from 'react'
import { LayoutGrid, Briefcase, Home, Folder, Trash2, Edit2, Check, X, Star, Heart, Zap, Target, BookOpen, Code, Palette, Music } from 'lucide-react'
import { subscribeToCategories, addCategory as addCategoryFirebase, updateCategory as updateCategoryFirebase, deleteCategory as deleteCategoryFirebase } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'

const defaultCategories = [
  { id: 'all-tasks', name: 'All Tasks', icon: 'LayoutGrid', isDefault: true },
  { id: 'office', name: 'Office', icon: 'Briefcase', isDefault: true },
  { id: 'home', name: 'Home', icon: 'Home', isDefault: true },
  { id: 'projects', name: 'Projects', icon: 'Folder', isDefault: true },
]

const iconOptions = {
  LayoutGrid: <LayoutGrid size={18} />,
  Briefcase: <Briefcase size={18} />,
  Home: <Home size={18} />,
  Folder: <Folder size={18} />,
  Star: <Star size={18} />,
  Heart: <Heart size={18} />,
  Zap: <Zap size={18} />,
  Target: <Target size={18} />,
  BookOpen: <BookOpen size={18} />,
  Code: <Code size={18} />,
  Palette: <Palette size={18} />,
  Music: <Music size={18} />,
}

export default function ManageCategories() {
  const { currentUser } = useAuth()
  const [categories, setCategories] = useState(defaultCategories)
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Folder')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (!currentUser) return
    
    const unsubscribe = subscribeToCategories(currentUser.uid, (firebaseCategories) => {
      // Filter out items that match default IDs to prevent duplicates
      const defaultIds = defaultCategories.map(cat => cat.id)
      const customCategories = firebaseCategories.filter(cat => !defaultIds.includes(cat.id))
      const allCategories = [...defaultCategories, ...customCategories]
      setCategories(allCategories)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [currentUser])

  const addCategory = async () => {
    if (!newCategoryName.trim() || !currentUser) return
    
    try {
      // Generate unique ID
      let baseId = newCategoryName.toLowerCase().replace(/\s+/g, '-')
      let uniqueId = baseId
      let counter = 1
      
      // Check if ID already exists and make it unique
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
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to add category. Please try again.')
    }
  }

  const deleteCategory = async (id) => {
    if (!currentUser || !confirm('Are you sure you want to delete this category?')) return
    
    try {
      await deleteCategoryFirebase(currentUser.uid, id)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category. Please try again.')
    }
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  const saveEdit = async (id) => {
    if (!editName.trim() || !currentUser) return
    
    try {
      const category = categories.find(cat => cat.id === id)
      if (category) {
        await updateCategoryFirebase(currentUser.uid, id, { ...category, name: editName.trim() })
      }
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category. Please try again.')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  return (
    <main className="main">
      <h2 className="title">Manage Categories</h2>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Add New Category</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Category Name</label>
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Select Icon</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {Object.keys(iconOptions).map(iconName => (
              <button
                key={iconName}
                onClick={() => setSelectedIcon(iconName)}
                style={{
                  padding: '10px',
                  border: selectedIcon === iconName ? '2px solid #4F46E5' : '1px solid #ddd',
                  borderRadius: '4px',
                  background: selectedIcon === iconName ? '#EEF2FF' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {iconOptions[iconName]}
              </button>
            ))}
          </div>
        </div>

        <button onClick={addCategory} style={{ padding: '8px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Category
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Existing Categories</h3>
        
        {loading ? (
          <p>Loading categories...</p>
        ) : categories.map(category => (
          <div key={category.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px',
            marginBottom: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              {iconOptions[category.icon]}
              
              {editingId === category.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd',
                    flex: 1
                  }}
                  autoFocus
                />
              ) : (
                <span>{category.name}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId === category.id ? (
                <>
                  <button 
                    onClick={() => saveEdit(category.id)}
                    style={{ 
                      padding: '6px', 
                      background: '#10B981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={cancelEdit}
                    style={{ 
                      padding: '6px', 
                      background: '#6B7280', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => startEdit(category)}
                    style={{ 
                      padding: '6px', 
                      background: '#3B82F6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  {!category.isDefault && (
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      style={{ 
                        padding: '6px', 
                        background: '#EF4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

import React, { useState, useEffect } from 'react'
import { FileText, CreditCard, Trash2, Edit2, Check, X } from 'lucide-react'
import { subscribeToDocuments, addDocumentSection as addDocumentFirebase, updateDocumentSection as updateDocumentFirebase, deleteDocumentSection as deleteDocumentFirebase } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'

const defaultDocuments = [
  { id: 'driving-licence', name: 'Driving Licence', icon: 'FileText', isDefault: true },
  { id: 'pan-info', name: 'Pan Info', icon: 'CreditCard', isDefault: true },
]

const iconOptions = {
  FileText: <FileText size={18} />,
  CreditCard: <CreditCard size={18} />,
}

export default function ManageDocuments() {
  const { currentUser } = useAuth()
  const [documents, setDocuments] = useState(defaultDocuments)
  const [loading, setLoading] = useState(true)
  const [newDocumentName, setNewDocumentName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('FileText')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (!currentUser) return
    
    const unsubscribe = subscribeToDocuments(currentUser.uid, (firebaseDocuments) => {
      // Filter out items that match default IDs to prevent duplicates
      const defaultIds = defaultDocuments.map(doc => doc.id)
      const customDocuments = firebaseDocuments.filter(doc => !defaultIds.includes(doc.id))
      const allDocuments = [...defaultDocuments, ...customDocuments]
      setDocuments(allDocuments)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [currentUser])

  const addDocument = async () => {
    if (!newDocumentName.trim() || !currentUser) return
    
    try {
      // Generate unique ID
      let baseId = newDocumentName.toLowerCase().replace(/\s+/g, '-')
      let uniqueId = baseId
      let counter = 1
      
      // Check if ID already exists and make it unique
      while (documents.some(doc => doc.id === uniqueId)) {
        uniqueId = `${baseId}-${counter}`
        counter++
      }
      
      const newDocument = {
        id: uniqueId,
        name: newDocumentName.trim(),
        icon: selectedIcon,
        isDefault: false
      }
      
      await addDocumentFirebase(currentUser.uid, newDocument)
      setNewDocumentName('')
      setSelectedIcon('FileText')
    } catch (error) {
      console.error('Error adding document:', error)
      alert('Failed to add document section. Please try again.')
    }
  }

  const deleteDocument = async (id) => {
    if (!currentUser || !confirm('Are you sure you want to delete this document section?')) return
    
    try {
      await deleteDocumentFirebase(currentUser.uid, id)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document section. Please try again.')
    }
  }

  const startEdit = (document) => {
    setEditingId(document.id)
    setEditName(document.name)
  }

  const saveEdit = async (id) => {
    if (!editName.trim() || !currentUser) return
    
    try {
      const document = documents.find(doc => doc.id === id)
      if (document) {
        await updateDocumentFirebase(currentUser.uid, id, { ...document, name: editName.trim() })
      }
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Failed to update document section. Please try again.')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  return (
    <main className="main">
      <h2 className="title">Manage Documents</h2>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Add New Document Section</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Document Name</label>
          <input
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            placeholder="Enter document name..."
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

        <button onClick={addDocument} style={{ padding: '8px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Document Section
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Existing Document Sections</h3>
        
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.map(document => (
          <div key={document.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px',
            marginBottom: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              {iconOptions[document.icon]}
              
              {editingId === document.id ? (
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
                <span>{document.name}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId === document.id ? (
                <>
                  <button 
                    onClick={() => saveEdit(document.id)}
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
                    onClick={() => startEdit(document)}
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
                  {!document.isDefault && (
                    <button 
                      onClick={() => deleteDocument(document.id)}
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

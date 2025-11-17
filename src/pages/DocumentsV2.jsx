import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Download, Eye, EyeOff } from 'lucide-react'
import { subscribeToUserDocuments, addDocumentType, updateDocumentRecord, deleteDocumentRecord, deleteDocumentType } from '../firebase/firestore'
import { uploadFileToStorage } from '../firebase/storage'
import { useAuth } from '../contexts/AuthContext'

export default function DocumentsV2() {
  const { currentUser } = useAuth()
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [showNewRecordForm, setShowNewRecordForm] = useState(false)
  const isDarkMode = document.body.classList.contains('dark-mode')

  // Load documents from Firestore
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToUserDocuments(currentUser.uid, (docs) => {
      setDocumentTypes(docs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const handleAddDocumentType = async (typeData) => {
    if (!currentUser) return
    try {
      await addDocumentType(currentUser.uid, typeData)
      setShowNewTypeForm(false)
    } catch (error) {
      alert('Failed to add document type: ' + error.message)
    }
  }

  const handleAddRecord = async (typeId, recordData) => {
    if (!currentUser) return
    try {
      await updateDocumentRecord(currentUser.uid, typeId, recordData, 'add')
      setShowNewRecordForm(false)
    } catch (error) {
      alert('Failed to add record: ' + error.message)
    }
  }

  const handleUpdateRecord = async (typeId, recordData) => {
    if (!currentUser) return
    try {
      await updateDocumentRecord(currentUser.uid, typeId, recordData, 'update')
      setEditingRecord(null)
    } catch (error) {
      alert('Failed to update record: ' + error.message)
    }
  }

  const handleDeleteRecord = async (typeId, recordId) => {
    if (!currentUser || !confirm('Delete this record?')) return
    try {
      await deleteDocumentRecord(currentUser.uid, typeId, recordId)
    } catch (error) {
      alert('Failed to delete record: ' + error.message)
    }
  }

  const handleDeleteDocumentType = async (typeId) => {
    if (!currentUser || !confirm('Delete this document type and all its records?')) return
    try {
      await deleteDocumentType(currentUser.uid, typeId)
    } catch (error) {
      alert('Failed to delete document type: ' + error.message)
    }
  }

  const toggleExpand = (typeId) => {
    setSelectedTypeId(selectedTypeId === typeId ? null : typeId)
  }

  const downloadFile = (downloadLink) => {
    if (downloadLink) {
      try {
        const link = document.createElement('a')
        link.href = downloadLink
        link.download = 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Download error:', error)
      }
    }
  }

  if (loading) {
    return (
      <main className="main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="title">Documents</h2>
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="main" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 className="title" style={{ marginBottom: '8px' }}>My Documents</h2>
        <p style={{ color: '#6b7280', marginBottom: '0' }}>Organize and manage all your important documents in one place</p>
      </div>

      {/* Add New Document Type Button */}
      <button
        onClick={() => setShowNewTypeForm(!showNewTypeForm)}
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
        Add Document Type
      </button>

      {/* New Document Type Form */}
      {showNewTypeForm && (
        <NewDocumentTypeForm
          onSubmit={handleAddDocumentType}
          onCancel={() => setShowNewTypeForm(false)}
        />
      )}

      {/* Horizontal Document Type Tabs */}
      {documentTypes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          padding: '60px 20px',
          background: isDarkMode ? '#111827' : '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <p style={{ fontSize: '18px', fontWeight: '500' }}>No document types yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Create one to get started!</p>
        </div>
      ) : (
        <>
          {/* Tabs Container */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '12px',
            borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }}>
            {documentTypes.map(docType => (
              <button
                key={docType.id}
                onClick={() => setSelectedTypeId(docType.id)}
                style={{
                  padding: '12px 20px',
                  background: selectedTypeId === docType.id 
                    ? '#3b82f6' 
                    : isDarkMode ? '#1f2937' : '#f3f4f6',
                  color: selectedTypeId === docType.id 
                    ? 'white' 
                    : isDarkMode ? '#e5e7eb' : '#374151',
                  border: selectedTypeId === docType.id 
                    ? '2px solid #3b82f6' 
                    : `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: selectedTypeId === docType.id ? '700' : '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (selectedTypeId !== docType.id) {
                    e.target.style.background = isDarkMode ? '#374151' : '#e5e7eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTypeId !== docType.id) {
                    e.target.style.background = isDarkMode ? '#1f2937' : '#f3f4f6'
                  }
                }}
              >
                <span>{docType.type}</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  {docType.records?.length || 0} record{docType.records?.length !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Document Type Content */}
          {selectedTypeId && (
            <DocumentTypeDetail
              docType={documentTypes.find(dt => dt.id === selectedTypeId)}
              onAddRecord={() => setShowNewRecordForm(true)}
              onDeleteRecord={(recordId) => handleDeleteRecord(selectedTypeId, recordId)}
              onDeleteType={() => handleDeleteDocumentType(selectedTypeId)}
              onDownload={downloadFile}
              showNewRecordForm={showNewRecordForm}
              onSubmitRecord={(data) => handleAddRecord(selectedTypeId, data)}
              onCancelRecord={() => setShowNewRecordForm(false)}
              currentUser={currentUser}
              editingRecord={editingRecord}
              onEditRecord={(record) => setEditingRecord(record)}
              onUpdateRecord={(data) => handleUpdateRecord(selectedTypeId, data)}
              onCancelEdit={() => setEditingRecord(null)}
            />
          )}
        </>
      )}
    </main>
  )
}

// Document Type Detail Component - Table View
function DocumentTypeDetail({ docType, onAddRecord, onDeleteRecord, onDeleteType, onDownload, showNewRecordForm, onSubmitRecord, onCancelRecord, currentUser, editingRecord, onEditRecord, onUpdateRecord, onCancelEdit }) {
  const isDarkMode = document.body.classList.contains('dark-mode')
  const [visibleNumbers, setVisibleNumbers] = useState({})

  const toggleNumberVisibility = (recordId) => {
    setVisibleNumbers(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }))
  }

  if (!docType) return null

  return (
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
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '700',
            color: isDarkMode ? '#f3f4f6' : '#1f2937'
          }}>
            {docType.type}
          </h3>
          {docType.notes && (
            <p style={{ 
              margin: '0', 
              fontSize: '14px', 
              color: '#6b7280',
              paddingTop: '12px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '12px'
            }}>
              <strong style={{ color: '#10b981' }}>Notes:</strong> {docType.notes}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onAddRecord}
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
            Add Record
          </button>
          <button
            onClick={onDeleteType}
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
            title="Delete document type and all records"
          >
            <Trash2 size={18} />
            Delete Type
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div style={{ padding: '24px' }}>
        {docType.records && docType.records.length > 0 ? (
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
                  }}>Record Name</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Number</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Category</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Issued On</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Expires</th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Issued By</th>
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
                {docType.records.map((record, idx) => {
                  const isExpired = record.expireAt && record.expireAt < new Date().toISOString().split('T')[0]
                  return (
                    <tr
                      key={record.id || idx}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: idx % 2 === 0 
                          ? isDarkMode ? '#1f2937' : '#ffffff'
                          : isDarkMode ? '#111827' : '#f9fafb',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode ? '#374151' : '#eff6ff'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = idx % 2 === 0 
                          ? isDarkMode ? '#1f2937' : '#ffffff'
                          : isDarkMode ? '#111827' : '#f9fafb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {record.name}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {record.number ? (visibleNumbers[record.id] ? record.number : '••••••••••') : '-'}
                          </span>
                          {record.number && (
                            <button
                              onClick={() => toggleNumberVisibility(record.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.color = isDarkMode ? '#d1d5db' : '#374151'}
                              onMouseLeave={(e) => e.target.style.color = isDarkMode ? '#9ca3af' : '#6b7280'}
                              title={visibleNumbers[record.id] ? 'Hide number' : 'Show number'}
                            >
                              {visibleNumbers[record.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}>
                        {record.category ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {record.category}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      }}>
                        {record.issuedOn 
                          ? new Date(record.issuedOn).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : '-'
                        }
                      </td>
                      <td style={{
                        padding: '16px',
                        color: isExpired ? '#dc2626' : isDarkMode ? '#e5e7eb' : '#374151',
                        fontWeight: isExpired ? '700' : '500'
                      }}>
                        {record.expireAt ? (
                          <span style={{
                            padding: '4px 12px',
                            background: isExpired 
                              ? (isDarkMode ? '#7f1d1d' : '#fee2e2')
                              : 'transparent',
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}>
                            {new Date(record.expireAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {isExpired && ' ⚠️'}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {record.issuedBy || '-'}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {record.downloadLink ? (
                            <button
                              onClick={() => onDownload(record.downloadLink)}
                              style={{
                                padding: '8px 12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                              title="Download document"
                            >
                              <Download size={14} />
                              Download
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>No file</span>
                          )}
                          <button
                            onClick={() => onEditRecord(record)}
                            style={{
                              padding: '8px 12px',
                              background: '#fef3c7',
                              color: '#d97706',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#fcd34d'
                              e.target.style.color = '#b45309'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#fef3c7'
                              e.target.style.color = '#d97706'
                            }}
                            title="Edit record"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            style={{
                              padding: '8px 12px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
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
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>No records yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Add your first record to get started!</p>
          </div>
        )}
      </div>

      {/* Modal for Adding Record */}
      {showNewRecordForm && (
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
            onClick={onCancelRecord}
          >
            {/* Modal Content */}
            <div
              style={{
                background: document.body.classList.contains('dark-mode') ? '#111827' : '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <NewRecordForm
                onSubmit={onSubmitRecord}
                onCancel={onCancelRecord}
                currentUser={currentUser}
              />
            </div>
          </div>
        </>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
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
            onClick={onCancelEdit}
          >
            {/* Modal Content */}
            <div
              style={{
                background: document.body.classList.contains('dark-mode') ? '#111827' : '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <EditRecordForm
                record={editingRecord}
                onSubmit={onUpdateRecord}
                onCancel={onCancelEdit}
                currentUser={currentUser}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Document Type Card Component
function DocumentTypeCard({ docType, isExpanded, onToggleExpand, onAddRecord, onDeleteRecord, onDeleteType, onDownload, showNewRecordForm, onSubmitRecord, onCancelRecord, currentUser }) {
  const isDarkMode = document.body.classList.contains('dark-mode')

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      background: isDarkMode ? '#1f2937' : '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Title and Buttons */}
      <div style={{
        padding: '20px 24px',
        background: isDarkMode ? '#111827' : '#f3f4f6',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Chevron + Title */}
        <button
          onClick={onToggleExpand}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '700',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            padding: '0',
            flex: 1,
            minWidth: 0
          }}
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{docType.type}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400', marginTop: '4px' }}>
              {docType.records?.length || 0} record{docType.records?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </button>

        {/* Right: Action Buttons - Only show when expanded */}
        {isExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={onAddRecord}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.3s ease',
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              title="Add new record"
            >
              <Plus size={16} />
              Add
            </button>

            <button
              onClick={onDeleteType}
              style={{
                padding: '10px 12px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fecaca'
                e.target.style.color = '#991b1b'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fee2e2'
                e.target.style.color = '#dc2626'
              }}
              title="Delete document type and all records"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div style={{ 
          flex: 1,
          padding: '24px', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Notes */}
          {docType.notes && (
            <div style={{ 
              padding: '16px', 
              background: isDarkMode ? '#111827' : '#f0fdf4', 
              borderRadius: '8px', 
              borderLeft: '4px solid #10b981'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: isDarkMode ? '#e5e7eb' : '#374151', lineHeight: '1.6' }}>
                <strong style={{ color: '#10b981' }}>Notes:</strong> {docType.notes}
              </p>
            </div>
          )}

          {/* Records List */}
          <div style={{ flex: 1 }}>
            {docType.records && docType.records.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {docType.records.map((record, idx) => (
                  <RecordItem
                    key={record.id || idx}
                    record={record}
                    onDelete={() => onDeleteRecord(record.id)}
                    onDownload={() => onDownload(record.downloadLink)}
                  />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '30px' }}>
                No records yet. Add one to get started!
              </p>
            )}
          </div>

          {/* Modal for Adding Record */}
          {showNewRecordForm && (
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
                onClick={onCancelRecord}
              >
                {/* Modal Content */}
                <div
                  style={{
                    background: document.body.classList.contains('dark-mode') ? '#111827' : '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NewRecordForm
                    onSubmit={onSubmitRecord}
                    onCancel={onCancelRecord}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Edit Record Form
function EditRecordForm({ record, onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState({
    id: record.id,
    name: record.name || '',
    number: record.number || '',
    category: record.category || '',
    issuedOn: record.issuedOn || '',
    expireAt: record.expireAt || '',
    issuedBy: record.issuedBy || '',
    downloadLink: record.downloadLink || ''
  })
  const isDarkMode = document.body.classList.contains('dark-mode')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter record name')
      return
    }
    onSubmit(formData)
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

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Modal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: '0', fontSize: '22px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
          ✏️ Edit Record
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

      {/* Record Name - Large Input */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Record Name *</label>
        <input
          type="text"
          placeholder="e.g., Aadhar Card, Passport, MCA 1st Semester"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            ...inputStyle,
            padding: '12px 14px',
            fontSize: '15px',
            fontWeight: '500',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Grid Layout for Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Document Number</label>
          <input
            type="text"
            placeholder="e.g., 1234-5678-9012"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
          <input
            type="text"
            placeholder="e.g., Government, Medical"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      {/* Date Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Issued On</label>
          <input
            type="date"
            value={formData.issuedOn}
            onChange={(e) => setFormData({ ...formData, issuedOn: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Expires At</label>
          <input
            type="date"
            value={formData.expireAt}
            onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Issued By</label>
        <input
          type="text"
          placeholder="e.g., Ministry of External Affairs"
          value={formData.issuedBy}
          onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          style={{
            ...inputStyle,
            padding: '12px 14px',
            fontSize: '15px',
            fontWeight: '500',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
            transition: 'background 0.3s ease',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => e.target.style.background = '#059669'}
          onMouseLeave={(e) => e.target.style.background = '#10b981'}
        >
          Update Record
        </button>
        <button
          type="button"
          onClick={onCancel}
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
    </form>
  )
}

// Record Item Component
function RecordItem({ record, onDelete, onDownload }) {
  const isDarkMode = document.body.classList.contains('dark-mode')
  const [showNumber, setShowNumber] = useState(false)
  const isExpired = record.expireAt && record.expireAt < new Date().toISOString().split('T')[0]

  return (
    <div style={{
      padding: '18px',
      background: isDarkMode ? '#111827' : '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.borderColor = '#d1d5db'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.borderColor = '#e5e7eb'
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        {/* Record Details */}
        <div style={{ flex: 1 }}>
          {/* Record Name - Large & Bold */}
          {record.name && (
            <p style={{ 
              margin: '0 0 12px 0', 
              fontWeight: '700', 
              fontSize: '16px',
              color: isDarkMode ? '#f3f4f6' : '#1f2937'
            }}>
              {record.name}
            </p>
          )}

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {record.category && (
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>
                  Category
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: '500' }}>
                  {record.category}
                </p>
              </div>
            )}
            {record.number && (
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>
                  Document Number
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <p style={{ margin: '0', fontSize: '15px', color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: '500', fontFamily: 'monospace' }}>
                    {showNumber ? record.number : '••••••••••'}
                  </p>
                  <button
                    onClick={() => setShowNumber(!showNumber)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = isDarkMode ? '#d1d5db' : '#374151'}
                    onMouseLeave={(e) => e.target.style.color = isDarkMode ? '#9ca3af' : '#6b7280'}
                    title={showNumber ? 'Hide number' : 'Show number'}
                  >
                    {showNumber ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            )}
            {record.issuedOn && (
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>
                  Issued On
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: '500' }}>
                  {new Date(record.issuedOn).toLocaleDateString()}
                </p>
              </div>
            )}
            {record.expireAt && (
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>
                  Expires
                </p>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '15px', 
                  color: isExpired ? '#dc2626' : isDarkMode ? '#e5e7eb' : '#374151',
                  fontWeight: isExpired ? '700' : '500',
                  padding: isExpired ? '4px 8px' : '0',
                  background: isExpired ? (isDarkMode ? '#7f1d1d' : '#fee2e2') : 'transparent',
                  borderRadius: isExpired ? '4px' : '0'
                }}>
                  {new Date(record.expireAt).toLocaleDateString()} {isExpired && '⚠️'}
                </p>
              </div>
            )}
            {record.issuedBy && (
              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>
                  Issued By
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: isDarkMode ? '#e5e7eb' : '#374151', fontWeight: '500' }}>
                  {record.issuedBy}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          {record.downloadLink ? (
            <button
              onClick={onDownload}
              style={{
                padding: '10px 14px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.3s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              title="Download document"
            >
              <Download size={16} />
              Download
            </button>
          ) : (
            <span style={{ fontSize: '13px', color: '#6b7280', padding: '10px 14px' }}>No file</span>
          )}
          <button
            onClick={onDelete}
            style={{
              padding: '10px 14px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
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
            title="Delete record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// New Document Type Form
function NewDocumentTypeForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: '',
    notes: ''
  })
  const isDarkMode = document.body.classList.contains('dark-mode')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.type.trim()) {
      alert('Please enter document type')
      return
    }
    onSubmit(formData)
    setFormData({ type: '', notes: '' })
  }

  return (
    <form onSubmit={handleSubmit} style={{
      marginBottom: '30px',
      padding: '24px',
      background: isDarkMode ? '#111827' : '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Create New Document Type</h3>
      
      <input
        type="text"
        placeholder="Document Type (e.g., Government ID's, Insurance)"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        style={{
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '15px',
          fontFamily: 'inherit',
          background: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          transition: 'border-color 0.3s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
      <textarea
        placeholder="Notes (optional) - e.g., 'Keep updated every year' or 'Renew before expiry'"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        style={{
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '15px',
          fontFamily: 'inherit',
          background: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          resize: 'vertical',
          transition: 'border-color 0.3s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
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
          Create Document Type
        </button>
        <button
          type="button"
          onClick={onCancel}
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
    </form>
  )
}

// New Record Form
function NewRecordForm({ onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    category: '',
    issuedOn: '',
    expireAt: '',
    issuedBy: '',
    downloadLink: ''
  })
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const isDarkMode = document.body.classList.contains('dark-mode')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (100MB limit for Cloud Storage)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100MB limit')
      return
    }

    setUploading(true)
    setFileName(file.name)
    
    try {
      // Upload file to Cloud Storage
      const fileData = await uploadFileToStorage(currentUser.uid, file)
      setFormData(prev => ({ ...prev, downloadLink: fileData.downloadUrl }))
      setUploading(false)
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file: ' + error.message)
      setUploading(false)
      setFileName('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter record name')
      return
    }
    onSubmit({
      ...formData,
      id: Date.now().toString()
    })
    setFormData({
      name: '',
      number: '',
      category: '',
      issuedOn: '',
      expireAt: '',
      issuedBy: '',
      downloadLink: ''
    })
    setFileName('')
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

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Modal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: '0', fontSize: '22px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
          📋 Add New Record
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

      {/* Record Name - Large Input */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Record Name *</label>
        <input
          type="text"
          placeholder="e.g., Aadhar Card, Passport, MCA 1st Semester"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            ...inputStyle,
            padding: '12px 14px',
            fontSize: '15px',
            fontWeight: '500',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* Grid Layout for Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Document Number</label>
          <input
            type="text"
            placeholder="e.g., 1234-5678-9012"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
          <input
            type="text"
            placeholder="e.g., Government, Medical"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      {/* Date Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Issued On</label>
          <input
            type="date"
            value={formData.issuedOn}
            onChange={(e) => setFormData({ ...formData, issuedOn: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Expires At</label>
          <input
            type="date"
            value={formData.expireAt}
            onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Issued By</label>
        <input
          type="text"
          placeholder="e.g., Ministry of External Affairs"
          value={formData.issuedBy}
          onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          style={{
            ...inputStyle,
            padding: '12px 14px',
            fontSize: '15px',
            fontWeight: '500',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      {/* File Upload Section */}
      <div style={{
        padding: '20px',
        background: isDarkMode ? '#0f1419' : '#eff6ff',
        border: '2px dashed #93c5fd',
        borderRadius: '10px'
      }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#1e40af' }}>
          📄 Upload Document
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          style={{
            display: 'block',
            marginBottom: '10px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        />
        {fileName && (
          <p style={{ margin: '8px 0', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
            ✅ {fileName}
          </p>
        )}
        {uploading && (
          <p style={{ margin: '8px 0', fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
            ⏳ Uploading file to storage...
          </p>
        )}
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
          Supports: PDF, Images, Word, Excel • Max 100MB
        </p>
      </div>

      {/* URL Alternative */}
      {!fileName && (
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Or Paste Document URL</label>
          <input
            type="text"
            placeholder="https://example.com/document.pdf"
            value={formData.downloadLink.startsWith('http') ? formData.downloadLink : ''}
            onChange={(e) => {
              if (e.target.value.startsWith('http') || e.target.value === '') {
                setFormData({ ...formData, downloadLink: e.target.value })
              }
            }}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
          Save Record
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

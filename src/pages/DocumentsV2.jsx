import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Download, Eye, EyeOff } from 'lucide-react'
import { subscribeToUserDocuments, addDocumentType, updateDocumentRecord, deleteDocumentRecord, deleteDocumentType } from '../firebase/firestore'
import { uploadFileToStorage } from '../firebase/storage'
import { useAuth } from '../contexts/AuthContext'
import '../styles/DocumentsV2.css'

export default function DocumentsV2() {
  const { currentUser } = useAuth()
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [showNewRecordForm, setShowNewRecordForm] = useState(false)

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
      <main className="documents-main documents-loading">
        <h2 className="title">Documents</h2>
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="documents-main">
      <div className="page-header">
        <h2 className="title page-title">My Documents</h2>
        <p className="page-subtitle">Organize and manage all your important documents in one place</p>
      </div>

      {/* Add New Document Type Button */}
      <button
        onClick={() => setShowNewTypeForm(!showNewTypeForm)}
        className="btn-add-type"
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
        <div className="empty-state-container">
          <div className="empty-icon">📄</div>
          <p className="empty-title">No document types yet</p>
          <p className="empty-subtitle">Create one to get started!</p>
        </div>
      ) : (
        <>
          {/* Tabs Container */}
          <div className="tabs-container">
            {documentTypes.map(docType => (
              <button
                key={docType.id}
                onClick={() => setSelectedTypeId(docType.id)}
                className={`tab-btn ${selectedTypeId === docType.id ? 'active' : ''}`}
              >
                <span>{docType.type}</span>
                <span className="tab-count">
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

// DocumentTypeDetail Component - Table View
function DocumentTypeDetail({ docType, onAddRecord, onDeleteRecord, onDeleteType, onDownload, showNewRecordForm, onSubmitRecord, onCancelRecord, currentUser, editingRecord, onEditRecord, onUpdateRecord, onCancelEdit }) {
  const [visibleNumbers, setVisibleNumbers] = useState({})

  const toggleNumberVisibility = (recordId) => {
    setVisibleNumbers(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }))
  }

  if (!docType) return null

  return (
    <div className="doc-type-detail">
      {/* Header Section */}
      <div className="detail-header">
        <div>
          <h3 className="detail-title">
            {docType.type}
          </h3>
          {docType.notes && (
            <p className="detail-notes">
              <strong className="notes-label">Notes:</strong> {docType.notes}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button
            onClick={onAddRecord}
            className="btn-add-record"
          >
            <Plus size={18} />
            Add Record
          </button>
          <button
            onClick={onDeleteType}
            className="btn-delete-type"
            title="Delete document type and all records"
          >
            <Trash2 size={18} />
            Delete Type
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="records-container">
        {docType.records && docType.records.length > 0 ? (
          <div className="table-responsive">
            <table className="records-table">
              <thead>
                <tr className="table-header">
                  <th className="th-cell">Record Name</th>
                  <th className="th-cell">Number</th>
                  <th className="th-cell">Category</th>
                  <th className="th-cell">Issued On</th>
                  <th className="th-cell">Expires</th>
                  <th className="th-cell">Issued By</th>
                  <th className="th-cell th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docType.records.map((record, idx) => {
                  const isExpired = record.expireAt && record.expireAt < new Date().toISOString().split('T')[0]
                  return (
                    <tr
                      key={record.id || idx}
                      className="record-row"
                    >
                      <td className="td-cell record-name">
                        {record.name}
                      </td>
                      <td className="td-cell">
                        <div className="record-number-container">
                          <span className="record-number">
                            {record.number ? (visibleNumbers[record.id] ? record.number : '••••••••••') : '-'}
                          </span>
                          {record.number && (
                            <button
                              onClick={() => toggleNumberVisibility(record.id)}
                              className="btn-visibility"
                              title={visibleNumbers[record.id] ? 'Hide number' : 'Show number'}
                            >
                              {visibleNumbers[record.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="td-cell">
                        {record.category ? (
                          <span className="category-badge">
                            {record.category}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="td-cell">
                        {record.issuedOn
                          ? new Date(record.issuedOn).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                          : '-'
                        }
                      </td>
                      <td className="td-cell">
                        {record.expireAt ? (
                          <span className={`expiry-badge ${isExpired ? 'expired' : ''}`}>
                            {new Date(record.expireAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {isExpired && ' ⚠️'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="td-cell issued-by">
                        {record.issuedBy || '-'}
                      </td>
                      <td className="td-cell actions-cell">
                        {record.downloadLink ? (
                          <button
                            onClick={() => onDownload(record.downloadLink)}
                            className="btn-download"
                            title="Download document"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        ) : (
                          <span className="no-file">No file</span>
                        )}
                        <button
                          onClick={() => onEditRecord(record)}
                          className="btn-edit"
                          title="Edit record"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="btn-delete"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-container" style={{ border: 'none', background: 'transparent', padding: '40px 0' }}>
            <p className="empty-title" style={{ fontSize: '16px' }}>No records yet</p>
            <p className="empty-subtitle">Add your first record to get started!</p>
          </div>
        )}
      </div>

      {/* Modal for Adding Record */}
      {showNewRecordForm && (
        <>
          {/* Modal Overlay */}
          <div
            className="modal-overlay"
            onClick={onCancelRecord}
          >
            {/* Modal Content */}
            <div
              className="modal-container"
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
            className="modal-overlay"
            onClick={onCancelEdit}
          >
            {/* Modal Content */}
            <div
              className="modal-container"
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter record name')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="modal-header">
        <h3 className="modal-title">✏️ Edit Record</h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-close"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Record Name *</label>
        <input
          type="text"
          placeholder="e.g., Aadhar Card, Passport"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Document Number</label>
          <input
            type="text"
            placeholder="e.g., 1234-5678-9012"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <input
            type="text"
            placeholder="e.g., Government, Medical"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Issued On</label>
          <input
            type="date"
            value={formData.issuedOn}
            onChange={(e) => setFormData({ ...formData, issuedOn: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Expires At</label>
          <input
            type="date"
            value={formData.expireAt}
            onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Issued By</label>
        <input
          type="text"
          placeholder="e.g., Ministry of External Affairs"
          value={formData.issuedBy}
          onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          Update Record
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  )
}

// New Document Type Form
function NewDocumentTypeForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: '',
    notes: ''
  })

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
    <form onSubmit={handleSubmit} className="new-type-form">
      <h3 className="form-title">Create New Document Type</h3>

      <input
        type="text"
        placeholder="Document Type (e.g., Government ID's, Insurance)"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        className="form-input"
      />
      <textarea
        placeholder="Notes (optional) - e.g., 'Keep updated every year' or 'Renew before expiry'"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="form-textarea"
      />
      <div className="form-actions">
        <button type="submit" className="btn-submit">
          Create Document Type
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
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

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="modal-header">
        <h3 className="modal-title">📋 Add New Record</h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-close"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Record Name *</label>
        <input
          type="text"
          placeholder="e.g., Aadhar Card, Passport, MCA 1st Semester"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Document Number</label>
          <input
            type="text"
            placeholder="e.g., 1234-5678-9012"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <input
            type="text"
            placeholder="e.g., Government, Medical"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Issued On</label>
          <input
            type="date"
            value={formData.issuedOn}
            onChange={(e) => setFormData({ ...formData, issuedOn: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Expires At</label>
          <input
            type="date"
            value={formData.expireAt}
            onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Issued By</label>
        <input
          type="text"
          placeholder="e.g., Ministry of External Affairs"
          value={formData.issuedBy}
          onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="file-upload-section">
        <label className="upload-label">
          📄 Upload Document
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="file-input"
        />
        {fileName && (
          <p className="file-success">
            ✅ {fileName}
          </p>
        )}
        {uploading && (
          <p className="file-uploading">
            ⏳ Uploading file to storage...
          </p>
        )}
        <p className="file-hint">
          Supports: PDF, Images, Word, Excel • Max 100MB
        </p>
      </div>

      {!fileName && (
        <div className="form-group">
          <label className="form-label">Or Paste Document URL</label>
          <input
            type="text"
            placeholder="https://example.com/document.pdf"
            value={formData.downloadLink.startsWith('http') ? formData.downloadLink : ''}
            onChange={(e) => {
              if (e.target.value.startsWith('http') || e.target.value === '') {
                setFormData({ ...formData, downloadLink: e.target.value })
              }
            }}
            className="form-input"
          />
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          Save Record
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  )
}

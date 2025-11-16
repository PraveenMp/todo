import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink, ChevronDown, ChevronUp, Upload, Trash2, File } from 'lucide-react'
import { subscribeToDocuments, saveDocument, getDocument } from '../firebase/firestore'
import { uploadFile, deleteFile, listFiles, listFilesByYear } from '../firebase/storage'
import { useAuth } from '../contexts/AuthContext'

const defaultDocuments = []

export default function DocumentPage() {
  const { documentId } = useParams()
  const { currentUser } = useAuth()
  const [documents, setDocuments] = useState(defaultDocuments)
  const [loading, setLoading] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isAddingRecordOpen, setIsAddingRecordOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState([]) // Track multiple uploads
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Track selected year
  const [availableYears, setAvailableYears] = useState([]) // Years with records
  const [formData, setFormData] = useState({
    documentNumber: '',
    issuedDate: '',
    expiryDate: '',
    issuedBy: '',
    notes: '',
    fileUrl: '',
    year: new Date().getFullYear() // Add year to form data
  })

  useEffect(() => {
    if (!currentUser) return
    
    const unsubscribe = subscribeToDocuments(currentUser.uid, (firebaseDocuments) => {
      // Filter out items that match default IDs to prevent duplicates
      const defaultIds = defaultDocuments.map(doc => doc.id)
      const customDocuments = firebaseDocuments.filter(doc => !defaultIds.includes(doc.id))
      const allDocuments = [...defaultDocuments, ...customDocuments]
      setDocuments(allDocuments)
    })
    
    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    
    const loadDocumentData = async () => {
      try {
        const data = await getDocument(currentUser.uid, documentId)
        if (data) {
          setFormData(data)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading document:', error)
        setLoading(false)
      }
    }
    
    loadDocumentData()
  }, [currentUser, documentId])

  useEffect(() => {
    if (!currentUser || loading) return
    
    const timeoutId = setTimeout(async () => {
      try {
        await saveDocument(currentUser.uid, documentId, formData)
      } catch (error) {
        console.error('Error saving document:', error)
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [formData, currentUser, documentId, loading])

  const currentDocument = documents.find(doc => doc.id === documentId)
  const documentName = currentDocument ? currentDocument.name : documentId

  // Load all available years first
  useEffect(() => {
    const loadYears = async () => {
      if (!currentUser || loading) return
      try {
        const { years } = await listFiles(currentUser.uid, documentId)
        setAvailableYears(years)
      } catch (error) {
        console.error('Error loading years:', error)
      }
    }
    loadYears()
  }, [currentUser, documentId, loading])

  // Load uploaded files for selected year
  useEffect(() => {
    const loadFiles = async () => {
      if (!currentUser || loading) return
      try {
        const files = await listFilesByYear(currentUser.uid, documentId, selectedYear)
        setUploadedFiles(files)
      } catch (error) {
        console.error('Error loading files:', error)
      }
    }
    loadFiles()
  }, [currentUser, documentId, loading, selectedYear])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !currentUser) return

    setUploading(true)
    setUploadProgress(files.map((f, i) => ({ id: i, name: f.name, status: 'uploading' })))

    try {
      const uploadedFilesList = []
      
      for (let i = 0; i < files.length; i++) {
        try {
          const uploadedFile = await uploadFile(currentUser.uid, documentId, files[i], selectedYear)
          uploadedFilesList.push(uploadedFile)
          
          // Update progress
          setUploadProgress(prev => 
            prev.map(p => p.id === i ? { ...p, status: 'done' } : p)
          )
        } catch (error) {
          console.error(`Error uploading file ${files[i].name}:`, error)
          setUploadProgress(prev => 
            prev.map(p => p.id === i ? { ...p, status: 'error' } : p)
          )
        }
      }
      
      if (uploadedFilesList.length > 0) {
        setUploadedFiles(prev => [...uploadedFilesList, ...prev])
        e.target.value = '' // Reset file input
        
        // Add year to available years if not already there
        if (!availableYears.includes(selectedYear)) {
          setAvailableYears(prev => [...prev, selectedYear].sort((a, b) => b - a))
        }
        
        // Show summary
        const failedCount = files.length - uploadedFilesList.length
        if (failedCount > 0) {
          alert(`Uploaded ${uploadedFilesList.length} of ${files.length} files. ${failedCount} failed.`)
        } else {
          alert(`Successfully uploaded ${uploadedFilesList.length} file(s) to ${selectedYear}`)
        }
        
        setIsAddingRecordOpen(false) // Close accordion after upload
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files: ' + error.message)
    } finally {
      setUploading(false)
      setUploadProgress([])
    }
  }

  const handleDeleteFile = async (fileName) => {
    if (!currentUser || !confirm('Are you sure you want to delete this file?')) return

    try {
      await deleteFile(currentUser.uid, documentId, fileName, selectedYear)
      setUploadedFiles(prev => prev.filter(f => f.fileName !== fileName))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file: ' + error.message)
    }
  }

  const handleDownloadFile = (file) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = file.downloadUrl
      link.download = file.originalName || file.fileName.replace(/^\d+_/, '')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDownload = () => {
    if (formData.fileUrl) {
      window.open(formData.fileUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <main className="main">
        <h2 className="title">Loading...</h2>
      </main>
    )
  }

  return (
    <main className="main">
      <h2 className="title">{documentName}</h2>

      <div className="card">
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Document Number
            </label>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', e.target.value)}
              placeholder="Enter document number"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Issued Date
              </label>
              <input
                type="date"
                value={formData.issuedDate}
                onChange={(e) => handleInputChange('issuedDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Issued By
            </label>
            <input
              type="text"
              value={formData.issuedBy}
              onChange={(e) => handleInputChange('issuedBy', e.target.value)}
              placeholder="Enter issuing authority"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Document URL
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => handleInputChange('fileUrl', e.target.value)}
                placeholder="https://example.com/document.pdf"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {formData.fileUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    style={{
                      padding: '10px 16px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                    title="Open/Download document"
                  >
                    <Download size={16} />
                    Open
                  </button>
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 16px',
                      background: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              Enter the URL where your document is stored (Google Drive, Dropbox, etc.)
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes or information"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </form>
      </div>

      <div style={{ marginTop: '15px', color: '#6b7280', fontSize: '12px' }}>
        ✓ Changes are automatically saved
      </div>

      {/* Year Selector */}
      <div style={{ marginTop: '25px', padding: '15px', background: document.body.classList.contains('dark-mode') ? '#1f2937' : '#f0f9ff', borderRadius: '6px', border: '1px solid #d1d5db' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px' }}>
          Select Year for Records
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Show available years */}
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                padding: '8px 14px',
                background: selectedYear === year ? '#3b82f6' : document.body.classList.contains('dark-mode') ? '#374151' : '#e0e7ff',
                color: selectedYear === year ? 'white' : document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1f2937',
                border: '1px solid ' + (selectedYear === year ? '#3b82f6' : '#d1d5db'),
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedYear === year ? '600' : '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedYear !== year) {
                  e.currentTarget.style.background = document.body.classList.contains('dark-mode') ? '#4b5563' : '#dbeafe'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedYear !== year) {
                  e.currentTarget.style.background = document.body.classList.contains('dark-mode') ? '#374151' : '#e0e7ff'
                }
              }}
            >
              {year}
            </button>
          ))}
          
          {/* Add new year option */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSelectedYear(parseInt(e.target.value))
                e.target.value = ''
              }
            }}
            style={{
              padding: '8px 14px',
              background: document.body.classList.contains('dark-mode') ? '#374151' : '#f3f4f6',
              color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <option value="">+ Add Year</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => {
              if (!availableYears.includes(year)) {
                return <option key={year} value={year}>{year}</option>
              }
              return null
            })}
          </select>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '10px 0 0 0' }}>
          Current year: <strong>{selectedYear}</strong> ({availableYears.length} year{availableYears.length !== 1 ? 's' : ''} with records)
        </p>
      </div>

      {/* File Upload Accordion */}
      <div style={{ marginTop: '25px' }}>
        <button
          onClick={() => setIsAddingRecordOpen(!isAddingRecordOpen)}
          style={{
            width: '100%',
            padding: '15px',
            background: document.body.classList.contains('dark-mode') ? '#374151' : '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '600',
            color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1f2937',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = document.body.classList.contains('dark-mode') ? '#4b5563' : '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = document.body.classList.contains('dark-mode') ? '#374151' : '#f3f4f6'}
        >
          {isAddingRecordOpen ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
          Add Record
        </button>

        {/* Accordion Content */}
        {isAddingRecordOpen && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: document.body.classList.contains('dark-mode') ? '#1f2937' : '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Upload Files (Image or PDF) - Select Multiple
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept="image/*,.pdf"
                multiple
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                Supported formats: Images (JPG, PNG, GIF, etc.) and PDF documents - You can select multiple files
              </p>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: '0 0 10px 0', color: '#3b82f6' }}>
                  Uploading {uploadProgress.filter(p => p.status === 'uploading').length} file(s)...
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {uploadProgress.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: item.status === 'done' ? '#10b981' : item.status === 'error' ? '#ef4444' : '#3b82f6',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {item.status === 'done' ? '✓' : item.status === 'error' ? '✕' : '...'}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '11px', flexShrink: 0 }}>
                        {item.status === 'done' ? 'Done' : item.status === 'error' ? 'Error' : 'Uploading'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploading && (
              <p style={{ fontSize: '14px', color: '#3b82f6', margin: '10px 0' }}>
                Uploading files... Please wait
              </p>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
            Uploaded Records ({uploadedFiles.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploadedFiles.map((file) => (
              <div
                key={file.fileName}
                style={{
                  padding: '12px',
                  background: document.body.classList.contains('dark-mode') ? '#1f2937' : '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <File size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {file.fileName}
                    </p>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {formatDate(file.uploadedAt)} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    style={{
                      padding: '6px 12px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.fileName)}
                    style={{
                      padding: '6px 8px',
                      background: '#FECACA',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Delete file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

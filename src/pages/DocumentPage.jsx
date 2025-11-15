import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink } from 'lucide-react'
import { subscribeToDocuments, saveDocument, getDocument } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'

const defaultDocuments = [
  { id: 'driving-licence', name: 'Driving Licence', icon: 'FileText', isDefault: true },
  { id: 'pan-info', name: 'Pan Info', icon: 'CreditCard', isDefault: true },
]

export default function DocumentPage() {
  const { documentId } = useParams()
  const { currentUser } = useAuth()
  const [documents, setDocuments] = useState(defaultDocuments)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    documentNumber: '',
    issuedDate: '',
    expiryDate: '',
    issuedBy: '',
    notes: '',
    fileUrl: ''
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    </main>
  )
}

import { db } from './config'
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

// Convert file to base64 for Firestore storage
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Upload file to Firestore (no need for Firebase Storage)
export const uploadFile = async (userId, documentId, file, year = new Date().getFullYear()) => {
  try {
    const fileName = `${Date.now()}_${file.name}`
    
    // Convert file to base64
    const base64Data = await fileToBase64(file)
    
    const fileData = {
      fileName,
      fileContent: base64Data,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
      year: year
    }
    
    // Store file metadata and content in Firestore with year-based path
    const fileMetaRef = doc(db, 'users', userId, 'documents', documentId, 'years', String(year), 'files', fileName)
    await setDoc(fileMetaRef, fileData)
    
    // Return downloadable format
    return {
      fileName,
      downloadUrl: base64Data, // Base64 encoded file
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      year: year
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Delete file from Firestore
export const deleteFile = async (userId, documentId, fileName, year = new Date().getFullYear()) => {
  try {
    const fileMetaRef = doc(db, 'users', userId, 'documents', documentId, 'years', String(year), 'files', fileName)
    await deleteDoc(fileMetaRef)
    return { success: true }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// Get all files for a specific year
export const listFilesByYear = async (userId, documentId, year = new Date().getFullYear()) => {
  try {
    const filesRef = collection(db, 'users', userId, 'documents', documentId, 'years', String(year), 'files')
    const snapshot = await getDocs(filesRef)
    
    if (snapshot.empty) {
      return []
    }
    
    const files = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        fileName: data.fileName,
        downloadUrl: data.fileContent, // Base64 encoded file
        size: data.size,
        type: data.type,
        uploadedAt: data.uploadedAt,
        originalName: data.originalName,
        year: data.year
      }
    })
    
    // Sort by upload date descending (newest first)
    return files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
  } catch (error) {
    console.error('Error listing files from Firestore:', error)
    return []
  }
}

// Get all files across all years (for backward compatibility and year discovery)
export const listFiles = async (userId, documentId) => {
  try {
    const yearsRef = collection(db, 'users', userId, 'documents', documentId, 'years')
    const yearsSnapshot = await getDocs(yearsRef)
    
    const allFiles = []
    const years = []
    
    // Iterate through each year
    for (const yearDoc of yearsSnapshot.docs) {
      const year = yearDoc.id
      years.push(parseInt(year))
      
      const filesRef = collection(db, 'users', userId, 'documents', documentId, 'years', year, 'files')
      const filesSnapshot = await getDocs(filesRef)
      
      filesSnapshot.docs.forEach(fileDoc => {
        const data = fileDoc.data()
        allFiles.push({
          fileName: data.fileName,
          downloadUrl: data.fileContent,
          size: data.size,
          type: data.type,
          uploadedAt: data.uploadedAt,
          originalName: data.originalName,
          year: data.year
        })
      })
    }
    
    // Sort by year descending, then by upload date descending
    return {
      files: allFiles.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return new Date(b.uploadedAt) - new Date(a.uploadedAt)
      }),
      years: years.sort((a, b) => b - a)
    }
  } catch (error) {
    console.error('Error listing all files:', error)
    return { files: [], years: [] }
  }
}

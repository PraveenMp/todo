import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  orderBy,
  setDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from './config'

// ============ TASKS ============
export const getTasks = async (userId) => {
  const tasksRef = collection(db, 'users', userId, 'tasks')
  const snapshot = await getDocs(tasksRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const addTask = async (userId, taskData) => {
  const tasksRef = collection(db, 'users', userId, 'tasks')
  const docRef = await addDoc(tasksRef, {
    ...taskData,
    createdAt: new Date().toISOString()
  })
  return docRef.id
}

export const updateTask = async (userId, taskId, updates) => {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId)
  await updateDoc(taskRef, updates)
}

export const deleteTask = async (userId, taskId) => {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId)
  await deleteDoc(taskRef)
}

export const subscribeToTasks = (userId, callback) => {
  const tasksRef = collection(db, 'users', userId, 'tasks')
  return onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(tasks)
  })
}

// ============ CATEGORIES ============
export const getCategories = async (userId) => {
  const categoriesRef = collection(db, 'users', userId, 'categories')
  const snapshot = await getDocs(categoriesRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const addCategory = async (userId, categoryData) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryData.id)
  await setDoc(categoryRef, categoryData)
  return categoryData.id
}

export const updateCategory = async (userId, categoryId, updates) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryId)
  await updateDoc(categoryRef, updates)
}

export const deleteCategory = async (userId, categoryId) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryId)
  await deleteDoc(categoryRef)
}

export const subscribeToCategories = (userId, callback) => {
  const categoriesRef = collection(db, 'users', userId, 'categories')
  return onSnapshot(categoriesRef, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(categories)
  })
}

// ============ DOCUMENTS ============
export const getDocuments = async (userId) => {
  const documentsRef = collection(db, 'users', userId, 'documents')
  const snapshot = await getDocs(documentsRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const getDocument = async (userId, documentId) => {
  const documentRef = doc(db, 'users', userId, 'documents', documentId)
  const snapshot = await getDoc(documentRef)
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export const saveDocument = async (userId, documentId, documentData) => {
  const documentRef = doc(db, 'users', userId, 'documents', documentId)
  await setDoc(documentRef, documentData, { merge: true })
}

export const addDocumentSection = async (userId, documentData) => {
  const documentRef = doc(db, 'users', userId, 'documents', documentData.id)
  await setDoc(documentRef, documentData)
  return documentData.id
}

export const updateDocumentSection = async (userId, documentId, updates) => {
  const documentRef = doc(db, 'users', userId, 'documents', documentId)
  await updateDoc(documentRef, updates)
}

export const deleteDocumentSection = async (userId, documentId) => {
  const documentRef = doc(db, 'users', userId, 'documents', documentId)
  await deleteDoc(documentRef)
}

export const subscribeToDocuments = (userId, callback) => {
  const documentsRef = collection(db, 'users', userId, 'documents')
  return onSnapshot(documentsRef, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(documents)
  })
}

// ============ USER SETTINGS ============
export const getUserSettings = async (userId) => {
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
  const snapshot = await getDoc(settingsRef)
  return snapshot.exists() ? snapshot.data() : { darkMode: false }
}

export const saveUserSettings = async (userId, settings) => {
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
  await setDoc(settingsRef, settings, { merge: true })
}

// ============ USER PROFILE ============
export const createUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId)
  await setDoc(userRef, {
    ...userData,
    createdAt: new Date().toISOString()
  })
}

export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)
  return snapshot.exists() ? snapshot.data() : null
}

// ============ DOCUMENTS V2 (NEW STRUCTURE) ============
export const subscribeToUserDocuments = (userId, callback) => {
  const documentsRef = collection(db, 'users', userId, 'documentsV2')
  return onSnapshot(documentsRef, (snapshot) => {
    const documents = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type,
        notes: data.notes,
        records: data.records || []
      }
    })
    callback(documents)
  })
}

export const addDocumentType = async (userId, typeData) => {
  const docId = typeData.type.toLowerCase().replace(/\s+/g, '_')
  const documentRef = doc(db, 'users', userId, 'documentsV2', docId)
  await setDoc(documentRef, {
    type: typeData.type,
    notes: typeData.notes,
    records: [],
    createdAt: new Date().toISOString()
  })
  return docId
}

export const updateDocumentRecord = async (userId, typeId, recordData, action = 'add') => {
  const documentRef = doc(db, 'users', userId, 'documentsV2', typeId)
  const docSnap = await getDoc(documentRef)
  
  if (!docSnap.exists()) {
    throw new Error('Document type not found')
  }

  const currentRecords = docSnap.data().records || []
  
  if (action === 'add') {
    currentRecords.push({
      id: Date.now().toString(),
      ...recordData
    })
  } else if (action === 'update') {
    const index = currentRecords.findIndex(r => r.id === recordData.id)
    if (index !== -1) {
      currentRecords[index] = recordData
    }
  }

  await updateDoc(documentRef, {
    records: currentRecords
  })
}

export const deleteDocumentRecord = async (userId, typeId, recordId) => {
  const documentRef = doc(db, 'users', userId, 'documentsV2', typeId)
  const docSnap = await getDoc(documentRef)
  
  if (!docSnap.exists()) {
    throw new Error('Document type not found')
  }

  const records = (docSnap.data().records || []).filter(r => r.id !== recordId)
  
  await updateDoc(documentRef, {
    records: records
  })
}

export const deleteDocumentType = async (userId, typeId) => {
  const documentRef = doc(db, 'users', userId, 'documentsV2', typeId)
  await deleteDoc(documentRef)
}

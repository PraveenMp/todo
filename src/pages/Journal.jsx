
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Send, Calendar, Tag, Trash2, Pencil, X } from 'lucide-react'

export default function Journal() {
    const { currentUser } = useAuth()
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('Home')
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        if (!currentUser) return

        const q = query(
            collection(db, `users/${currentUser.uid}/journal`),
            orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const journalEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setEntries(journalEntries)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!content.trim()) return

        try {
            if (editingId) {
                const docRef = doc(db, `users/${currentUser.uid}/journal`, editingId)
                await updateDoc(docRef, {
                    content,
                    category,
                    updatedAt: serverTimestamp()
                })
                setEditingId(null)
            } else {
                await addDoc(collection(db, `users/${currentUser.uid}/journal`), {
                    content,
                    category,
                    createdAt: serverTimestamp()
                })
            }
            setContent('')
            setCategory('Home')
        } catch (error) {
            console.error("Error saving journal entry: ", error)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return
        try {
            await deleteDoc(doc(db, `users/${currentUser.uid}/journal`, id))
        } catch (error) {
            console.error("Error deleting journal entry: ", error)
        }
    }

    const handleEdit = (entry) => {
        setContent(entry.content)
        setCategory(entry.category)
        setEditingId(entry.id)
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setContent('')
        setCategory('Home')
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        return new Date(timestamp.seconds * 1000).toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Home': return '#e0f2fe' // light blue
            case 'Gym': return '#dcfce7' // light green
            case 'Office': return '#fae8ff' // light purple
            default: return '#f3f4f6'
        }
    }

    return (
        <div style={{ padding: '20px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <h1>My Journal</h1>

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                marginBottom: '40px',
                boxSizing: 'border-box',
                border: editingId ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>
                        {editingId ? '✏️ Edit Entry' : '✍️ New Entry'}
                    </h3>
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px'
                            }}
                        >
                            <X size={14} /> Cancel
                        </button>
                    )}
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind today?"
                    style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        lineHeight: '1.5',
                        boxSizing: 'border-box'
                    }}
                    required
                />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            flex: '0 0 auto'
                        }}
                    >
                        <option value="Home">Home</option>
                        <option value="Gym">Gym</option>
                        <option value="Office">Office</option>
                    </select>

                    <button
                        type="submit"
                        style={{
                            padding: '10px 24px',
                            backgroundColor: editingId ? '#3b82f6' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: 'auto',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <Send size={16} />
                        {editingId ? 'Update Entry' : 'Save Entry'}
                    </button>
                </div>
            </form>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</p>
                ) : entries.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#9ca3af',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px dashed #d1d5db'
                    }}>
                        <p>No journal entries yet.</p>
                        <p>start your first entry above!</p>
                    </div>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            border: '1px solid #f3f4f6',
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                backgroundColor: getCategoryColor(entry.category),
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        color: '#374151',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Tag size={14} />
                                        {entry.category}
                                    </span>
                                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>•</span>
                                    <span style={{
                                        color: '#4b5563',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Calendar size={14} />
                                        {formatDate(entry.createdAt)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        title="Edit"
                                        style={{
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.5)',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#2563eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '28px',
                                            height: '28px'
                                        }}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        title="Delete"
                                        style={{
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.5)',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '28px',
                                            height: '28px'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <p style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    margin: 0,
                                    color: '#374151',
                                    fontSize: '15px'
                                }}>
                                    {entry.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

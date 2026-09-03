import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getNotes, createNote, updateNote, deleteNote, restoreNote, pinNote, getCategories } from '../api/notes';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Active, Archived
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const fetchIdRef = useRef(0);
  const fileInputRef = useRef(null);

  const fetchNotes = async () => {
    const requestId = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setError('');
      const data = await getNotes();
      if (requestId === fetchIdRef.current) {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      if (requestId === fetchIdRef.current) {
        setError('Failed to fetch notes. Please try again.');
      }
    } finally {
      if (requestId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data?.data || data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (noteData) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await createNote(noteData);
    }
    fetchNotes();
  };

  const handleArchiveNote = async (note) => {
    try {
      await deleteNote(note.id);
      fetchNotes();
    } catch (error) {
      console.error('Error archiving note:', error);
      setError('Failed to archive note. Please try again.');
    }
  };

  const handleRestoreNote = async (note) => {
    try {
      await restoreNote(note.id);
      fetchNotes();
    } catch (error) {
      console.error('Error restoring note:', error);
      setError('Failed to restore note. Please try again.');
    }
  };

  const handlePinNote = async (note) => {
    try {
      await pinNote(note.id);
      fetchNotes();
    } catch (error) {
      console.error('Error pinning note:', error);
      setError('Failed to pin note. Please try again.');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedNotes = JSON.parse(event.target.result);
        if (!Array.isArray(importedNotes)) {
          throw new Error("Invalid format: Expected an array of notes.");
        }

        setIsLoading(true);
        let successCount = 0;
        for (const note of importedNotes) {
          if (!note.title) continue; 
          await createNote({
            title: note.title,
            content: note.content || '',
            category: note.category || 'General',
            tags: Array.isArray(note.tags) ? note.tags : [],
            is_pinned: !!note.is_pinned
          });
          successCount++;
        }
        
        setError(`Successfully imported ${successCount} notes!`);
        fetchNotes();
      } catch (err) {
        console.error("Import error:", err);
        setError("Failed to import. Ensure it's a valid JSON array of notes.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const activeNotes = notes.filter(n => !n.is_deleted);
  const archivedNotes = notes.filter(n => n.is_deleted);

  const displayedNotes = (() => {
    let filtered = [];
    if (filter === 'All') filtered = notes;
    else if (filter === 'Active') filtered = activeNotes;
    else if (filter === 'Archived') filtered = archivedNotes;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(lowerQuery)) || 
        (n.content && n.content.toLowerCase().includes(lowerQuery))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    // Sort pinned notes first, then by updated_at descending
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
  })();

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Notes</h1>
          <div className={styles.headerActions}>
            <Link to="/profile" className={styles.userEmail} style={{ textDecoration: 'underline', cursor: 'pointer' }}>{user?.email}</Link>
            <button className={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${filter === 'All' ? styles.activeFilter : ''}`}
              onClick={() => setFilter('All')}
            >
              All ({notes.length})
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'Active' ? styles.activeFilter : ''}`}
              onClick={() => setFilter('Active')}
            >
              Active ({activeNotes.length})
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'Archived' ? styles.activeFilter : ''}`}
              onClick={() => setFilter('Archived')}
            >
              Archived ({archivedNotes.length})
            </button>
          </div>

          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {categories.length > 0 && (
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categorySelect}
              >
                <option value="">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.secondaryBtn} onClick={handleExport} title="Export as JSON">
              Export
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
            <button className={styles.secondaryBtn} onClick={triggerImport} title="Import from JSON">
              Import
            </button>
            <button className={styles.newNoteBtn} onClick={handleCreateNote}>
              + New Note
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>Loading notes...</div>
        ) : displayedNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notes yet</p>
          </div>
        ) : (
          <div className={styles.notesGrid}>
            {displayedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onArchive={handleArchiveNote}
                onRestore={handleRestoreNote}
                onPin={handlePinNote}
              />
            ))}
          </div>
        )}
      </main>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        note={editingNote}
      />
    </div>
  );
};

export default Dashboard;
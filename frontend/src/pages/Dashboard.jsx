import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotes, createNote, updateNote, deleteNote, restoreNote, pinNote } from '../api/notes';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Active, Archived
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getNotes();
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
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

  const activeNotes = notes.filter(n => !n.is_deleted);
  const archivedNotes = notes.filter(n => n.is_deleted);
  
  const displayedNotes = (() => {
    let filtered = [];
    if (filter === 'All') filtered = notes;
    else if (filter === 'Active') filtered = activeNotes;
    else if (filter === 'Archived') filtered = archivedNotes;
    
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
            <span className={styles.userEmail}>{user?.email}</span>
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
          
          <button className={styles.newNoteBtn} onClick={handleCreateNote}>
            + New Note
          </button>
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

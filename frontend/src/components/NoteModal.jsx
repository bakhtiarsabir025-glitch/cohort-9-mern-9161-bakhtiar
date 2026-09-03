import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import styles from './NoteModal.module.css';

const NoteModal = ({ isOpen, onClose, onSave, note }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setCategory(note.category || '');
      setTags(note.tags ? note.tags.join(', ') : '');
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
    }
    setError('');
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const formattedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: formattedTags,
      };

      await onSave(noteData);
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
      setError(err.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{note ? 'Edit Note' : 'Create Note'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div
              style={{
                color: '#c53030',
                backgroundColor: '#fed7d7',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                textAlign: 'center',
                fontWeight: '500',
              }}
            >
              {error}
            </div>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="note-title" className={styles.srOnly}>Title</label>
            <input
              id="note-title"
              type="text"
              placeholder="Title (required)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="note-content" className={styles.srOnly}>Content</label>
            <ReactQuill
              id="note-content"
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              readOnly={isSubmitting}
              placeholder="Take a note... (optional)"
            />
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label htmlFor="note-category" className={styles.srOnly}>Category</label>
              <input
                id="note-category"
                type="text"
                placeholder="Category "
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.metaInput}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="note-tags" className={styles.srOnly}>Tags</label>
              <input
                id="note-tags"
                type="text"
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={styles.metaInput}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
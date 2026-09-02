import React from 'react';
import { MdEdit, MdArchive, MdUnarchive, MdPushPin, MdOutlinePushPin } from 'react-icons/md';
import styles from './NoteCard.module.css';

const NoteCard = ({ note, onEdit, onArchive, onRestore, onPin }) => {
  const { title, content, category, tags, is_pinned, is_deleted, created_at, updated_at } = note;
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`${styles.card} ${is_pinned ? styles.pinned : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title || 'Untitled Note'}</h3>
        <div className={styles.actions}>
          {!is_deleted && (
            <button 
              className={`${styles.actionBtn} ${is_pinned ? styles.activePin : ''}`} 
              onClick={() => onPin(note)}
              title={is_pinned ? "Unpin note" : "Pin note"}
            >
              {is_pinned ? <MdPushPin size={18} /> : <MdOutlinePushPin size={18} />}
            </button>
          )}
          
          <button 
            className={styles.actionBtn} 
            onClick={() => onEdit(note)}
            title="Edit note"
          >
            <MdEdit size={18} />
          </button>
          
          {is_deleted ? (
            <button 
              className={styles.actionBtn} 
              onClick={() => onRestore(note)}
              title="Restore note"
            >
              <MdUnarchive size={18} />
            </button>
          ) : (
            <button 
              className={styles.actionBtn} 
              onClick={() => onArchive(note)}
              title="Archive note"
            >
              <MdArchive size={18} />
            </button>
          )}
        </div>
      </div>
      
      {category && (
        <span className={styles.category}>{category}</span>
      )}
      
      <div className={styles.content}>
        <p>{content}</p>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.tags}>
          {tags && tags.map((tag, index) => (
            <span key={index} className={styles.tag}>#{tag}</span>
          ))}
        </div>
        <div className={styles.date}>
          {updated_at ? `Updated: ${formatDate(updated_at)}` : `Created: ${formatDate(created_at)}`}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;

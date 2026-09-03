import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, logout } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <h1>Profile</h1>
        <Link to="/dashboard" className={styles.backLink}>Back to Dashboard</Link>
      </header>
      
      <main className={styles.main}>
        <div className={styles.profileCard}>
          <h2>User Details</h2>
          
          <div className={styles.infoGroup}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user?.email}</span>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>User ID</span>
            <span className={styles.value} style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{user?.id}</span>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Joined</span>
            <span className={styles.value}>{formatDate(user?.created_at)}</span>
          </div>

          <button className={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;

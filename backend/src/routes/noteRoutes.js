const express = require('express');
const router = express.Router();

// Import middlewares
const authMiddleware = require('../middlewares/authMiddleware');

// Import controllers
const {
    createNote,
    getNotes,
    getNote,
    updateNote,
    deleteNote,
    togglePin,
    getCategories,
    getStats,
    restoreNote
} = require('../controllers/noteController');

router.use(authMiddleware);

router.route('/')
    .post(createNote)
    .get(getNotes);
router.get('/categories', getCategories);
router.get('/stats', getStats);
router.post('/:id/restore', restoreNote);

router.route('/:id')
    .get(getNote)
    .put(updateNote)
    .delete(deleteNote);

router.patch('/:id/pin', togglePin);

module.exports = router;

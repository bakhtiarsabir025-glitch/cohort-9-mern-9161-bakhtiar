const Joi = require('joi');
const NoteModel = require('../models/note.model');
const logger = require('../logger');

const createSchema = Joi.object({
    title: Joi.string().max(255).required(),
    content: Joi.string().allow('', null).optional(),
    category: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    is_pinned: Joi.boolean().optional()
});

const updateSchema = Joi.object({
    title: Joi.string().max(255).optional(),
    content: Joi.string().allow('', null).optional(),
    category: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    is_pinned: Joi.boolean().optional(),
    is_deleted: Joi.boolean().optional()
}).min(1);

const querySchema = Joi.object({
    search: Joi.string().allow('', null).optional(),
    category: Joi.string().allow('', null).optional(),
    sort: Joi.string().valid('newest', 'oldest', 'recently_updated').default('newest'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
});

const idSchema = Joi.object({
    id: Joi.string().uuid().required()
});

const handleError = (res, error, status = 500, code = 'INTERNAL_ERROR') => {
    logger.error(error.message);
    return res.status(status).json({
        success: false,
        message: error.message,
        error: code
    });
};

exports.createNote = async (req, res) => {
    try {
        const { error, value } = createSchema.validate(req.body);
        if (error) return handleError(res, error, 400);

        const note = await NoteModel.create(req.token, req.user.id, value);
        return res.status(201).json({ success: true, message: 'Note created', data: note });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { error, value } = querySchema.validate(req.query);
        if (error) return handleError(res, error, 400);

        const { search, category, sort, page, limit } = value;
        const notes = await NoteModel.findAll(req.token, { search, category, sort, includeDeleted: true });

        const start = (page - 1) * limit;
        const paginated = notes.slice(start, start + limit);

        return res.status(200).json({
            success: true,
            data: paginated,
            meta: {
                total: notes.length,
                page,
                limit,
                totalPages: Math.ceil(notes.length / limit)
            }
        });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.getNote = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) return handleError(res, error, 400);

        const note = await NoteModel.findById(req.token, req.params.id);
        if (!note) return handleError(res, { message: 'Note not found', code: 'NOT_FOUND' }, 404);

        return res.status(200).json({ success: true, data: note });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { error: idErr } = idSchema.validate(req.params);
        if (idErr) return handleError(res, idErr, 400);

        const { error, value } = updateSchema.validate(req.body);
        if (error) return handleError(res, error, 400);

        const note = await NoteModel.update(req.token, req.params.id, value);
        return res.status(200).json({ success: true, message: 'Note updated', data: note });
    } catch (error) {
        if (error.message === 'Note not found' || error.code === 'PGRST116') {
            return handleError(res, { message: 'Note not found', code: 'NOT_FOUND' }, 404);
        }
        return handleError(res, error);
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) return handleError(res, error, 400);

        await NoteModel.softDelete(req.token, req.params.id);
        return res.status(200).json({ success: true, message: 'Note deleted' });
    } catch (error) {
        if (error.message.includes('not found')) {
            return handleError(res, { message: error.message, code: 'NOT_FOUND' }, 404);
        }
        return handleError(res, error);
    }
};

exports.permanentDeleteNote = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) return handleError(res, error, 400);

        await NoteModel.hardDelete(req.token, req.params.id);
        return res.status(200).json({ success: true, message: 'Note permanently deleted' });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.togglePin = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) return handleError(res, error, 400);

        const note = await NoteModel.togglePin(req.token, req.params.id);
        return res.status(200).json({
            success: true,
            message: `Note ${note.is_pinned ? 'pinned' : 'unpinned'}`,
            data: note
        });
    } catch (error) {
        if (error.message === 'Note not found') {
            return handleError(res, { message: 'Note not found', code: 'NOT_FOUND' }, 404);
        }
        return handleError(res, error);
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await NoteModel.getCategories(req.token);
        return res.status(200).json({ success: true, data: categories, count: categories.length });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await NoteModel.getStats(req.token);
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        return handleError(res, error);
    }
};

exports.restoreNote = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) return handleError(res, error, 400);

        const note = await NoteModel.restore(req.token, req.params.id);
        return res.status(200).json({ success: true, message: 'Note restored', data: note });
    } catch (error) {
        if (error.message.includes('not found')) {
            return handleError(res, { message: error.message, code: 'NOT_FOUND' }, 404);
        }
        return handleError(res, error);
    }
};
const getUserClient = require('../config/supabaseUserClient');
const logger = require('../logger');

class NoteModel {
    static async create(token, userId, data) {
        if (!data?.title) throw new Error('Title required');

        const supabase = getUserClient(token);

        const payload = {
            user_id: userId,
            title: data.title.trim(),
            content: data.content || '',
            category: data.category || 'General',
            tags: data.tags || [],
            is_pinned: data.is_pinned || false,
            is_deleted: false,
        };

        const { data: note, error } = await supabase
            .from('notes')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        logger.info(`Note created: ${note.id}`);
        return note;
    }

    static async findAll(token, filters = {}) {
        const supabase = getUserClient(token);

        let query = supabase
            .from('notes')
            .select('*')
            .eq('is_deleted', false);

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.search) {
            const term = `%${filters.search.trim()}%`;
            query = query.or(`title.ilike.${term},content.ilike.${term}`);
        }

        query = query.order('is_pinned', { ascending: false });

        if (filters.sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (filters.sort === 'recently_updated') {
            query = query.order('updated_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    static async findById(token, noteId, includeDeleted = false) {
        const supabase = getUserClient(token);

        let query = supabase.from('notes').select('*').eq('id', noteId);

        if (!includeDeleted) {
            query = query.eq('is_deleted', false);
        }

        const { data, error } = await query.single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    static async update(token, noteId, updates) {
        if (!updates || !Object.keys(updates).length) {
            throw new Error('No fields to update');
        }

        const safe = { ...updates };
        delete safe.id;
        delete safe.user_id;
        delete safe.created_at;

        if (safe.title !== undefined) {
            safe.title = safe.title.trim();
            if (!safe.title) throw new Error('Title cannot be empty');
        }

        const supabase = getUserClient(token);

        const { data, error } = await supabase
            .from('notes')
            .update(safe)
            .eq('id', noteId)
            .select()
            .single();

        if (error) throw error;
        logger.info(`Note updated: ${noteId}`);
        return data;
    }

    static async softDelete(token, noteId) {
        const note = await this.findById(token, noteId);
        if (!note) throw new Error('Note not found');
        if (note.is_deleted) throw new Error('Note already deleted');

        const supabase = getUserClient(token);

        const { error } = await supabase
            .from('notes')
            .update({ is_deleted: true })
            .eq('id', noteId);

        if (error) throw error;
        logger.info(`Note deleted: ${noteId}`);
        return true;
    }

    static async restore(token, noteId) {
        const note = await this.findById(token, noteId, true);
        if (!note) throw new Error('Note not found');
        if (!note.is_deleted) throw new Error('Note is not deleted');

        const supabase = getUserClient(token);

        const { data, error } = await supabase
            .from('notes')
            .update({ is_deleted: false })
            .eq('id', noteId)
            .select()
            .single();

        if (error) throw error;
        logger.info(`Note restored: ${noteId}`);
        return data;
    }

    static async hardDelete(token, noteId) {
        const supabase = getUserClient(token);

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;
        logger.info(`Note permanently deleted: ${noteId}`);
        return true;
    }

    static async togglePin(token, noteId) {
        const note = await this.findById(token, noteId);
        if (!note) throw new Error('Note not found');

        const supabase = getUserClient(token);

        const { data, error } = await supabase
            .from('notes')
            .update({ is_pinned: !note.is_pinned })
            .eq('id', noteId)
            .select()
            .single();

        if (error) throw error;
        logger.info(`Note pin toggled: ${noteId}`);
        return data;
    }

    static async getCategories(token) {
        const supabase = getUserClient(token);

        const { data, error } = await supabase
            .from('notes')
            .select('category')
            .eq('is_deleted', false)
            .not('category', 'is', null);

        if (error) throw error;
        return [...new Set(data.map((item) => item.category).filter(Boolean))].sort();
    }
    static async getStats(token) {
        const supabase = getUserClient(token);

        const { data, error } = await supabase
            .from('notes')
            .select('*');

        if (error) throw error;

        const active = data.filter((n) => !n.is_deleted);
        const pinned = active.filter((n) => n.is_pinned);

        const cats = {};
        active.forEach((n) => {
            const c = n.category || 'Uncategorized';
            cats[c] = (cats[c] || 0) + 1;
        });

        const tags = {};
        active.forEach((n) => {
            if (n.tags) n.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; });
        });

        const sorted = [...active].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        return {
            total: data.length,
            active: active.length,
            deleted: data.length - active.length,
            pinned: pinned.length,
            categories: Object.keys(cats).length,
            categoryDistribution: cats,
            topTags: Object.entries(tags)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([t, c]) => ({ tag: t, count: c })),
            recent: sorted.slice(0, 5).map((n) => ({
                id: n.id,
                title: n.title,
                updated_at: n.updated_at,
            })),
        };
    }
}

module.exports = NoteModel;
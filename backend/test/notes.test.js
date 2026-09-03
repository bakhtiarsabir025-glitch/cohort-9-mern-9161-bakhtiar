const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const app = require('../src/app');

const expect = chai.expect;

describe('Notes Endpoints', () => {
    let request;

    before(() => {
        request = supertest(app);
    });

    beforeEach(() => {
        sinon.stub(require('../src/config/supabaseClient').auth, 'getUser').resolves({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    const authHeader = { Authorization: 'Bearer valid-fake-token' };

    describe('POST /api/notes', () => {
        it('should return 401 without a token', async () => {
            const res = await request.post('/api/notes').send({ title: 'Test' });
            expect(res.status).to.equal(401);
        });

        it('should return 400 if title is missing', async () => {
            const res = await request
                .post('/api/notes')
                .set(authHeader)
                .send({ content: 'No title' });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.equal(false);
        });
    });

    describe('PUT /api/notes/:id', () => {
        it('should return 400 for an invalid note id', async () => {
            const res = await request
                .put('/api/notes/not-a-uuid')
                .set(authHeader)
                .send({ title: 'Updated' });

            expect(res.status).to.equal(400);
        });
    });

    describe('DELETE /api/notes/:id', () => {
        it('should return 400 for an invalid note id', async () => {
            const res = await request
                .delete('/api/notes/not-a-uuid')
                .set(authHeader);

            expect(res.status).to.equal(400);
        });
    });
});

describe('Notes Endpoints - with mocked Supabase client', () => {
    let request;

    beforeEach(() => {
        sinon.stub(require('../src/config/supabaseClient').auth, 'getUser').resolves({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    const authHeader = { Authorization: 'Bearer valid-fake-token' };

    it('should return 201 on successful creation', async () => {
        const mockNote = {
            id: 'note-1',
            user_id: 'user-123',
            title: 'Test note',
            content: 'Some content',
        };

        const mockQuery = {
            insert: sinon.stub().returnsThis(),
            select: sinon.stub().returnsThis(),
            single: sinon.stub().resolves({ data: mockNote, error: null }),
        };

        const mockClient = { from: sinon.stub().returns(mockQuery) };
        const getUserClientStub = sinon.stub().returns(mockClient);

        // Bypass Node module cache down the entire dependency chain
        const mockedApp = proxyquire('../src/app', {
            './routes/noteRoutes': proxyquire('../src/routes/noteRoutes', {
                '../controllers/noteController': proxyquire('../src/controllers/noteController', {
                    '../models/note.model': proxyquire('../src/models/note.model', {
                        '../config/supabaseUserClient': getUserClientStub,
                    }),
                }),
            }),
        });

        request = supertest(mockedApp);

        const res = await request
            .post('/api/notes')
            .set(authHeader)
            .send({ title: 'Test note', content: 'Some content' });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.equal(true);
        expect(res.body.data).to.deep.equal(mockNote);
    });

    it('should return 200 with a list of notes on GET /api/notes', async () => {
        const mockNotes = [
            { id: 'note-1', title: 'First', is_pinned: false },
            { id: 'note-2', title: 'Second', is_pinned: true },
        ];

        // Mock Supabase query builder for list queries
        const mockQuery = {
            select: sinon.stub().returnsThis(),
            eq: sinon.stub().returnsThis(),
            order: sinon.stub().returnsThis(),
            range: sinon.stub().returnsThis(),
            then: (resolve) => resolve({ data: mockNotes, error: null, count: mockNotes.length }),
        };

        const mockClient = { from: sinon.stub().returns(mockQuery) };
        const getUserClientStub = sinon.stub().returns(mockClient);

        // Inject proxyquire stub down to note.model
        const mockedApp = proxyquire('../src/app', {
            './routes/noteRoutes': proxyquire('../src/routes/noteRoutes', {
                '../controllers/noteController': proxyquire('../src/controllers/noteController', {
                    '../models/note.model': proxyquire('../src/models/note.model', {
                        '../config/supabaseUserClient': getUserClientStub,
                    }),
                }),
            }),
        });

        request = supertest(mockedApp);

        const res = await request
            .get('/api/notes')
            .set(authHeader);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.equal(true);
        expect(res.body.data).to.deep.equal(mockNotes);
    });
});
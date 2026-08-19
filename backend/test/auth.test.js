const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
const app = require('../src/app');
const supabase = require('../src/config/supabaseClient');
const authMiddleware = require('../src/middlewares/authMiddleware');

const expect = chai.expect;

// Add a dummy protected route for testing the middleware
app.get('/api/test-protected', authMiddleware, (req, res) => {
    res.status(200).json({ user: req.user });
});

describe('Auth Endpoints & Middleware', () => {
    let request;

    before(() => {
        request = supertest(app);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('POST /api/auth/signup', () => {
        it('should return 201 on successful signup', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            sinon.stub(supabase.auth, 'signUp').resolves({ data: { user: mockUser }, error: null });

            const res = await request
                .post('/api/auth/signup')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).to.equal(201);
            expect(res.body.message).to.equal('Signup successful');
            expect(res.body.user).to.deep.equal(mockUser);
        });

        it('should return 400 if email or password is missing', async () => {
            const res = await request
                .post('/api/auth/signup')
                .send({ email: 'test@example.com' });

            expect(res.status).to.equal(400);
            expect(res.body.error.message).to.equal('Email and password are required');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 200 on successful login', async () => {
            const mockSession = { access_token: 'fake-token' };
            const mockUser = { id: '123', email: 'test@example.com' };
            
            sinon.stub(supabase.auth, 'signInWithPassword').resolves({
                data: { session: mockSession, user: mockUser },
                error: null
            });

            const res = await request
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('Login successful');
            expect(res.body.session).to.deep.equal(mockSession);
        });

        it('should return 401 on login with wrong password', async () => {
            sinon.stub(supabase.auth, 'signInWithPassword').resolves({
                data: { session: null, user: null },
                error: { message: 'Invalid login credentials' }
            });

            const res = await request
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(res.status).to.equal(401);
            expect(res.body.error.message).to.equal('Invalid login credentials');
        });
    });

    describe('Protected Route (Auth Middleware)', () => {
        it('should return 401 when accessing without a token', async () => {
            const res = await request.get('/api/test-protected');

            expect(res.status).to.equal(401);
            expect(res.body.error.message).to.equal('Missing or invalid Authorization header');
        });

        it('should return 200 and user data when accessing with a valid token', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            sinon.stub(supabase.auth, 'getUser').resolves({ data: { user: mockUser }, error: null });

            const res = await request
                .get('/api/test-protected')
                .set('Authorization', 'Bearer valid-fake-token');

            expect(res.status).to.equal(200);
            expect(res.body.user).to.deep.equal(mockUser);
        });
        
        it('should return 401 when token is invalid', async () => {
            sinon.stub(supabase.auth, 'getUser').resolves({ data: { user: null }, error: { message: 'Invalid token' } });

            const res = await request
                .get('/api/test-protected')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).to.equal(401);
            expect(res.body.error.message).to.equal('Invalid token');
        });
    });
});

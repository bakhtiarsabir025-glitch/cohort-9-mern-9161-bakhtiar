const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
    it('GET /health should return 200 and status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({ status: 'ok' });
    });
});
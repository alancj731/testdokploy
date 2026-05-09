const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/server');

function request(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${server.address().port}${path}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

test('GET / returns greeting', async () => {
  const server = app.listen(0);
  try {
    const res = await request(server, '/');
    assert.strictEqual(res.status, 200);
    const body = JSON.parse(res.body);
    assert.match(body.message, /Hello from Dokploy/);
  } finally {
    server.close();
  }
});

test('GET /health returns ok', async () => {
  const server = app.listen(0);
  try {
    const res = await request(server, '/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(JSON.parse(res.body), { status: 'ok' });
  } finally {
    server.close();
  }
});

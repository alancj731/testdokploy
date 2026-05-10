const express = require('express');

const app = express();
const PORT = process.env.PORT || 3101;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Dokploy on GCP', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

module.exports = app;

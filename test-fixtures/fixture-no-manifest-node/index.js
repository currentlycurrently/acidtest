// Simple Express.js-style application without SKILL.md
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Some potentially risky patterns to detect
app.get('/data', (req, res) => {
  // Reading from filesystem
  const filePath = `/tmp/${req.query.file}`;
  const content = fs.readFileSync(filePath, 'utf-8');
  res.send(content);
});

app.get('/eval', (req, res) => {
  // Code injection vulnerability
  const result = eval(req.query.code);
  res.json({ result });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

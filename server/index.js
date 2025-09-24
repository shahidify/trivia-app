import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const questions = JSON.parse(
  fs.readFileSync(join(__dirname, 'data', 'questions.json'), 'utf8')
);

app.get('/api/question/:id', (req, res) => {
  const question = questions.questions.find(
    (q) => q.id === parseInt(req.params.id)
  );
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json(question);
});

app.post('/api/check', (req, res) => {
  const { id, answer } = req.body;
  const question = questions.questions.find((q) => q.id === parseInt(id));
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  console.log(
    `Checking answer for question ${id}: received="${answer}", correct="${question.answer}"`
  );
  res.json({ correct: question.answer === answer });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

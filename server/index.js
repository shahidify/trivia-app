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

// FY shuffle for arrays
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

app.get('/api/question/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const question = questions.questions.find((q) => q.id === id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

app.get('/api/newgame', (req, res) => {
  const ids = questions.questions.map((q) => q.id);
  const order = shuffle(ids);
  res.json({ order });
});

app.post('/api/check', (req, res) => {
  const { id, answer } = req.body;
  const question = questions.questions.find((q) => q.id === parseInt(id));
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json({ correct: question.answer === answer });
});

app.listen(PORT);

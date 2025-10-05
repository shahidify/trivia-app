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

// Discover category files under data/ (files ending with .json)
function loadCategories() {
  const dataDir = join(__dirname, 'data');
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const categories = {};
  const hasWorldGeo = files
    .map((f) => f.toLowerCase())
    .includes('world-geo.json');
  for (const file of files) {
    try {
      // if a modern world-geo.json is present, ignore legacy questions.json to avoid duplicates
      if (hasWorldGeo && file.toLowerCase() === 'questions.json') continue;
      const content = JSON.parse(fs.readFileSync(join(dataDir, file), 'utf8'));
      // Support legacy filename 'questions.json' -> map to 'world-geo'
      let slug = content.slug || file.replace(/\.json$/i, '');
      if (file.toLowerCase() === 'questions.json') slug = 'world-geo';
      // ensure the content has slug/title for downstream metadata
      const cat = {
        ...content,
        slug,
        title: content.title || 'World Geography',
      };
      categories[slug] = cat;
    } catch {
      // ignore invalid files
    }
  }
  return categories;
}

let categories = loadCategories();

// Helper to get category data, reloads categories if missing
function getCategory(slug) {
  if (!categories[slug]) {
    categories = loadCategories();
  }
  return categories[slug];
}

// FY shuffle for arrays
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// List available categories with basic metadata
app.get('/api/', (req, res) => {
  const list = Object.keys(categories).map((slug) => {
    const c = categories[slug];
    return {
      slug,
      title: c.title || slug,
      description: c.description || '',
      count: Array.isArray(c.questions) ? c.questions.length : 0,
    };
  });
  res.json(list);
});

// Per-category routes
app.get('/api/:category/newgame', (req, res) => {
  const cat = getCategory(req.params.category);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const ids = (cat.questions || []).map((q) => q.id);
  const order = shuffle(ids);
  // support ?full=true to return full shuffled questions
  if (req.query.full === 'true') {
    const questionsShuffled = shuffle(cat.questions || []);
    // strip correct answers from payload for scored full-fetch
    const publicQuestions = questionsShuffled.map((q) => {
      const copy = { ...q };
      delete copy.answer;
      return copy;
    });
    return res.json({ questions: publicQuestions });
  }
  res.json({ order });
});

app.get('/api/:category/question/:id', (req, res) => {
  const cat = getCategory(req.params.category);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const id = parseInt(req.params.id);
  const question = (cat.questions || []).find((q) => q.id === id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

app.post('/api/:category/check', (req, res) => {
  const cat = getCategory(req.params.category);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const { id, answer } = req.body;
  const question = (cat.questions || []).find((q) => q.id === parseInt(id));
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json({ correct: question.answer === answer });
});

app.listen(PORT);

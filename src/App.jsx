import { useState, useEffect, useMemo } from 'react';
import useFetch from './hooks/useFetch';
import Question from './components/Question';
import Options from './components/Options';
import GameUI from './components/GameUI';
import CategorySelector from './components/CategorySelector';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState(null); // array of question ids
  const [_index, setIndex] = useState(0); // position in the order (value unused directly)
  const [currentId, setCurrentId] = useState(null);
  const [questionsArr, setQuestionsArr] = useState(null); // full questions when using full=true
  const [qIndex, setQIndex] = useState(0);
  const [categories, setCategories] = useState(null);
  // default to 'world-geo' so UI shows that selection immediately
  const [selectedCategory, setSelectedCategory] = useState('world-geo');

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      const urls = ['http://localhost:5000/api/', '/api/'];
      for (const u of urls) {
        try {
          const res = await fetch(u);
          if (!res.ok) continue;
          const data = await res.json();
          if (!mounted) return;
          setCategories(data);
          if (data && data.length) {
            setSelectedCategory((cur) =>
              cur && data.find((c) => c.slug === cur) ? cur : data[0].slug
            );
          }
          return;
        } catch {
          // try next URL
        }
      }
      if (!mounted) return;
      // both attempts failed
      setCategories([]);
      console.error('Failed to load categories from /api/');
    };
    fetchCategories();
    // expose on window for quick retry in dev (optional)
    window.__retryFetchCategories = fetchCategories;
    return () => {
      mounted = false;
      // cleanup dev helper
      delete window.__retryFetchCategories;
    };
  }, []);

  // Load high score when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    const key = `highScore:${selectedCategory}`;
    const val = parseInt(localStorage.getItem(key) || '0');
    setHighScore(val);
  }, [selectedCategory]);
  // Removed unused questionUrl state
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  // result: null = in progress, 'won' = finished all questions, 'lost' = incorrect or error
  const [result, setResult] = useState(null);

  // Use useFetch for fetching question
  const {
    data: question,
    error: questionError,
    loading: questionLoading,
  } = useFetch(
    started && !result && currentId
      ? `http://localhost:5000/api/${selectedCategory}/question/${currentId}`
      : null
  );

  // choose the active question: from in-memory array if present, otherwise from useFetch
  const currentQuestion =
    questionsArr && questionsArr.length ? questionsArr[qIndex] : question;

  // Handle error from useFetch
  if (questionError) {
    if (!result) setResult('lost');
  }

  // Prepare options (memoized per-question so they don't reshuffle on unrelated re-renders)
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const correct = currentQuestion.answer || currentQuestion.correctAnswer;
    const options = currentQuestion.options ? [...currentQuestion.options] : [];
    if (correct && !options.includes(correct)) options.push(correct);
    // Fisher-Yates shuffle in-place on a copy
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [currentQuestion]);

  const handleAnswer = (selected) => {
    const idToCheck = currentQuestion?.id || currentId;
    fetch(`http://localhost:5000/api/${selectedCategory}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idToCheck, answer: selected }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.correct) {
          const newScore = score + 1;
          setScore(newScore);
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem(
              `highScore:${selectedCategory}`,
              newScore.toString()
            );
          }
          setFeedback('Correct!');
          setTimeout(() => {
            setFeedback(null);
            // advance to next question: if using full questions iterate qIndex, otherwise use order/id flow
            if (questionsArr && questionsArr.length) {
              setQIndex((qi) => {
                const next = qi + 1;
                if (next >= questionsArr.length) {
                  setResult('won');
                  return qi;
                }
                // no need to set currentId because we read from questionsArr directly
                return next;
              });
            } else {
              // advance to next question in order
              setIndex((i) => {
                const next = i + 1;
                if (!order || next >= order.length) {
                  setResult('won');
                  return i;
                }
                setCurrentId(order[next]);
                return next;
              });
            }
          }, 1000);
        } else {
          setFeedback('Incorrect!');
          setResult('lost');
        }
      });
  };

  const startGame = (categoryArg) => {
    const cat = categoryArg || selectedCategory || 'world-geo';
    setSelectedCategory(cat);
    setStarted(true);
    setOrder(null);
    setIndex(0);
    setQuestionsArr(null);
    setQIndex(0);
    setCurrentId(null);
    setScore(0);
    setFeedback(null);
    setResult(null);
    // setQuestion(null) removed, question is managed by useFetch
    // fetch a new shuffled order or full questions from server for the selected category
    fetch(`http://localhost:5000/api/${cat}/newgame?full=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.questions && data.questions.length > 0) {
          // full questions returned (answers stripped by server)
          setQuestionsArr(data.questions);
          setQIndex(0);
        } else if (data && data.order && data.order.length > 0) {
          // fallback to order-based flow
          setOrder(data.order);
          setIndex(0);
          setCurrentId(data.order[0]);
        } else {
          // fallback: start from id 1
          setCurrentId(1);
        }
      })
      .catch(() => setCurrentId(1));
  };

  const restartGame = () => {
    startGame();
  };

  const goHome = () => {
    // return to category selection
    setStarted(false);
    setOrder(null);
    setQuestionsArr(null);
    setQIndex(0);
    setCurrentId(null);
    setScore(0);
    setFeedback(null);
    setResult(null);
  };

  if (!started) {
    return (
      <div className="app">
        <h1>World Geography Trivia</h1>
        <p>Test your knowledge! Try to get as many correct as you can.</p>
        <p>High Score: {highScore}</p>
        {categories ? (
          <CategorySelector
            categories={categories}
            selected={selectedCategory}
            onChange={(slug) => setSelectedCategory(slug)}
          />
        ) : (
          <div>Loading categories...</div>
        )}
        <button
          onClick={() => startGame(selectedCategory || 'world-geo')}
          disabled={!selectedCategory}
        >
          Start Game
        </button>
      </div>
    );
  }

  // show loading if per-id fetch is loading and we don't have an in-memory questions array,
  // or if there's no active question available yet
  if ((questionLoading && !questionsArr) || !currentQuestion)
    return <div>Loading...</div>;

  return (
    <div className="app">
      <GameUI
        score={score}
        highScore={highScore}
        feedback={feedback}
        result={result}
        onRestart={restartGame}
        onHome={goHome}
      />
      {!result && (
        <div className="question-container">
          <Question question={currentQuestion} />
          <Options
            options={shuffledOptions}
            onSelect={handleAnswer}
            disabled={!!feedback}
          />
        </div>
      )}
    </div>
  );
}

export default App;

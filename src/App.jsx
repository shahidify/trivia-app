import { useState } from 'react';
import useFetch from './hooks/useFetch';
import Question from './components/Question';
import Options from './components/Options';
import GameUI from './components/GameUI';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);
  const [currentId, setCurrentId] = useState(1);
  // Removed unused questionUrl state
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('highScore') || '0')
  );
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Use useFetch for fetching question
  const {
    data: question,
    error: questionError,
    loading: questionLoading,
  } = useFetch(
    started && !gameOver
      ? `http://localhost:5000/api/question/${currentId}`
      : null
  );

  // Handle error from useFetch
  if (questionError) {
    if (!gameOver) setGameOver(true);
  }

  const handleAnswer = (selected) => {
    fetch('http://localhost:5000/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentId, answer: selected }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.correct) {
          const newScore = score + 1;
          setScore(newScore);
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('highScore', newScore.toString());
          }
          setFeedback('Correct!');
          setTimeout(() => {
            setFeedback(null);
            setCurrentId((prev) => prev + 1);
          }, 1000);
        } else {
          setFeedback('Incorrect!');
          setGameOver(true);
        }
      });
  };

  const startGame = () => {
    setStarted(true);
    setCurrentId(1);
    setScore(0);
    setFeedback(null);
    setGameOver(false);
    // setQuestion(null) removed, question is managed by useFetch
  };

  const restartGame = () => {
    startGame();
  };

  if (!started) {
    return (
      <div className="app">
        <h1>World Geography Trivia</h1>
        <p>Test your knowledge! Try to get as many correct as you can.</p>
        <p>High Score: {highScore}</p>
        <button onClick={startGame}>Start Game</button>
      </div>
    );
  }

  if (questionLoading || !question) return <div>Loading...</div>;

  // Prepare options
  const correct = question.answer || question.correctAnswer;
  const options = question.options ? [...question.options] : [];
  if (!options.includes(correct)) options.push(correct);
  const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

  return (
    <div className="app">
      <GameUI
        score={score}
        highScore={highScore}
        feedback={feedback}
        gameOver={gameOver}
        onRestart={restartGame}
      />
      {!gameOver && (
        <div className="question-container">
          <Question question={question} />
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

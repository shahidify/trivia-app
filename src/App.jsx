import { useState, useEffect } from 'react';

function App() {
  const [started, setStarted] = useState(false);
  const [currentId, setCurrentId] = useState(1);
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('highScore') || '0')
  );
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (started && !gameOver) {
      fetch(`http://localhost:5000/api/question/${currentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setGameOver(true);
          } else {
            setQuestion(data);
          }
        });
    }
  }, [started, currentId, gameOver]);

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
    setQuestion(null);
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

  if (gameOver) {
    return (
      <div className="app">
        <h1>Game Over!</h1>
        <p>Your score: {score}</p>
        <p>High Score: {highScore}</p>
        <button onClick={restartGame}>Play Again</button>
      </div>
    );
  }

  if (!question) return <div>Loading...</div>;

  const correct = question.answer || question.correctAnswer;
  const options = question.options ? [...question.options] : [];
  if (!options.includes(correct)) options.push(correct);
  const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

  return (
    <div className="app">
      <div className="score">
        Score: {score} | High Score: {highScore}
      </div>
      <div className="question-container">
        <h2>{question.question}</h2>
        <div className="options">
          {shuffledOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={!!feedback}
            >
              {option}
            </button>
          ))}
        </div>
        {feedback && (
          <div className={feedback === 'Correct!' ? 'correct' : 'incorrect'}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

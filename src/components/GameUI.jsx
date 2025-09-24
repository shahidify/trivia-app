import React from 'react';

const GameUI = ({ score, highScore, feedback, gameOver, onRestart }) => {
  if (gameOver) {
    return (
      <div className="app">
        <h1>Game Over!</h1>
        <p>Your score: {score}</p>
        <p>High Score: {highScore}</p>
        <button onClick={onRestart}>Play Again</button>
      </div>
    );
  }
  return (
    <>
      <div className="score">
        Score: {score} | High Score: {highScore}
      </div>
      {feedback && (
        <div className={feedback === 'Correct!' ? 'correct' : 'incorrect'}>
          {feedback}
        </div>
      )}
    </>
  );
};

export default GameUI;

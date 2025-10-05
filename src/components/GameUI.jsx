import React from 'react';

const GameUI = ({
  score,
  highScore,
  feedback,
  gameOver,
  onRestart,
  onHome,
}) => {
  if (gameOver) {
    return (
      <div className="game-over">
        <h1>Game Over!</h1>
        <p>Your score: {score}</p>
        <p>High Score: {highScore}</p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
          <button onClick={onRestart}>Play Again</button>
          <button onClick={onHome}>Home</button>
        </div>
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

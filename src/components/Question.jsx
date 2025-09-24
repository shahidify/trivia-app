import React from 'react';

const Question = ({ question }) => {
  if (!question) return null;
  return <h2>{question.question}</h2>;
};

export default Question;

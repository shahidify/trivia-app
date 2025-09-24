import React from 'react';

const Options = ({ options, onSelect, disabled }) => {
  if (!options || options.length === 0) return null;
  return (
    <div className="options">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default Options;

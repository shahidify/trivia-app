import React from 'react';

const CategorySelector = ({ categories, selected, onChange }) => {
  if (!categories || categories.length === 0) return null;
  return (
    <div className="categories">
      {categories.map((c) => (
        <div
          key={c.slug}
          role="button"
          tabIndex={0}
          onClick={() => onChange(c.slug)}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && onChange(c.slug)
          }
          className={`category ${selected === c.slug ? 'selected' : ''}`}
          aria-pressed={selected === c.slug}
        >
          <div className="cat-title">{c.title}</div>
          <div className="cat-count">{c.count} Q</div>
        </div>
      ))}
    </div>
  );
};

export default CategorySelector;

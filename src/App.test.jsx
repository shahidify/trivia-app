// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch for useFetch and answer checking
beforeEach(() => {
  window.fetch = vi.fn((url, options) => {
    // Mock GET question
    if (url.includes('/api/question/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 1,
          question: 'What is the capital of France?',
          answer: 'Paris',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
        }),
      });
    }
    // Mock POST answer check
    if (url.includes('/api/check')) {
      const body = options && options.body ? JSON.parse(options.body) : {};
      return Promise.resolve({
        ok: true,
        json: async () => ({ correct: body.answer === 'Paris' }),
      });
    }
    // Default mock
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
});

describe('Trivia App', () => {
  it('renders start screen and starts game', async () => {
    render(<App />);
    expect(screen.getByText(/World Geography Trivia/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Start Game/i));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows question and options after fetch', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => {
      expect(
        screen.getByText(/What is the capital of France/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('handles correct answer and score increment', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Paris'));
    await waitFor(() =>
      expect(screen.getByText(/Correct!/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Score: 1/i)).toBeInTheDocument();
  });

  it('handles incorrect answer and game over', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => screen.getByText('Paris'));
    fireEvent.click(screen.getByText('London'));
    await waitFor(() =>
      expect(screen.getByText(/Game Over!/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Your score: 0/i)).toBeInTheDocument();
  });
});

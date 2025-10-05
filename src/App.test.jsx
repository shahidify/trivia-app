// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { expect as vitestExpect } from 'vitest';
const jestDom = await import('@testing-library/jest-dom/matchers');
vitestExpect.extend(jestDom);
import App from './App';

// Mock fetch for category listing, full newgame, per-id question and answer checking
beforeEach(() => {
  localStorage.clear();
  window.fetch = vi.fn((url, options) => {
    // GET categories
    if (url === '/api/' || url.endsWith('/api/')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { slug: 'world-geo', title: 'World Geography', count: 1 },
        ],
      });
    }
    // GET full newgame
    if (url.includes('/newgame')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          questions: [
            {
              id: 1,
              question: 'What is the capital of France?',
              options: ['Paris', 'London', 'Berlin', 'Madrid'],
            },
          ],
        }),
      });
    }
    // GET question by id (per-id fallback)
    if (url.includes('/question/')) {
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
    // POST answer check
    if (url.includes('/check')) {
      const body = options && options.body ? JSON.parse(options.body) : {};
      return Promise.resolve({
        ok: true,
        json: async () => ({ correct: body.answer === 'Paris' }),
      });
    }
    // Default
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
});

describe('Trivia App', () => {
  it('renders start screen and starts game', async () => {
    render(<App />);
    expect(screen.getByText(/World Geography Trivia/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument();
    await waitFor(() => expect(window.fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByText(/Start Game/i));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows question and options after fetch', async () => {
    render(<App />);
    await waitFor(() => expect(window.fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => {
      expect(
        screen.getByText(/What is the capital of France/i)
      ).toBeInTheDocument();
    });
    // Scope to the first rendered app container to avoid duplicate StrictMode renders
    const root = document.querySelectorAll('.app')[0];
    const w = within(root);
    expect(w.getByText('Paris')).toBeInTheDocument();
    expect(w.getByText('London')).toBeInTheDocument();
    expect(w.getByText('Berlin')).toBeInTheDocument();
    expect(w.getByText('Madrid')).toBeInTheDocument();
  });

  it('handles correct answer and score increment', async () => {
    render(<App />);
    await waitFor(() => expect(window.fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByText(/Start Game/i));
    // wait for the question to appear (may be rendered multiple times under StrictMode)
    const qMatches = await screen.findAllByText(
      /What is the capital of France/i
    );
    const root =
      qMatches[0].closest('.app') || document.querySelectorAll('.app')[0];
    const w = within(root);
    fireEvent.click(w.getByText('Paris'));
    await waitFor(() => expect(w.getByText(/Correct!/i)).toBeInTheDocument());
    expect(w.getByText(/Score: 1/i)).toBeInTheDocument();
  });

  it('handles incorrect answer and game over', async () => {
    render(<App />);
    await waitFor(() => expect(window.fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByText(/Start Game/i));
    const qMatches = await screen.findAllByText(
      /What is the capital of France/i
    );
    const root =
      qMatches[0].closest('.app') || document.querySelectorAll('.app')[0];
    const w = within(root);
    fireEvent.click(w.getByText('London'));
    await waitFor(() => expect(w.getByText(/Game Over!/i)).toBeInTheDocument());
    expect(w.getByText(/Your score:/i)).toHaveTextContent('Your score:');
  });
});

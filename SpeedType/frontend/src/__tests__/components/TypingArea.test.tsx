import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TypingArea from '../../components/TypingArea';

describe('TypingArea Component', () => {
  const mockText = 'test text';
  const mockOnProgress = vi.fn();
  const mockOnStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(
      <TypingArea
        textToType={mockText}
        onProgress={mockOnProgress}
        onStart={mockOnStart}
        isStarted={false}
        isMultiplayer={false}
        isRaceComplete={false}
      />
    );
    
    expect(screen.getByTestId('typing-input')).toBeInTheDocument();
    const textDisplay = screen.getByTestId('text-display');
    expect(textDisplay).toBeInTheDocument();
    expect(textDisplay.textContent).toBe(mockText);
  });

  it('handles user input correctly', () => {
    render(
      <TypingArea
        textToType={mockText}
        onProgress={mockOnProgress}
        onStart={mockOnStart}
        isStarted={true}
        isMultiplayer={false}
        isRaceComplete={false}
      />
    );
    const input = screen.getByTestId('typing-input') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 't' } });
    
    expect(input.value).toBe('t');
    expect(mockOnProgress).toHaveBeenCalled();
  });

  it('shows error on incorrect input', () => {
    render(
      <TypingArea
        textToType={mockText}
        onProgress={mockOnProgress}
        onStart={mockOnStart}
        isStarted={true}
        isMultiplayer={false}
        isRaceComplete={false}
      />
    );
    const input = screen.getByTestId('typing-input') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'x' } });
    
    expect(screen.getByTestId('error-indicator')).toBeVisible();
    expect(mockOnProgress).toHaveBeenCalled();
  });
}); 
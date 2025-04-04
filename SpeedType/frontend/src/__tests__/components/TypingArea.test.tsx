import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TypingArea from '../../components/TypingArea';

describe('TypingArea Component', () => {
  const mockText = 'test text';
  const mockOnProgress = vi.fn();
  const mockSetTypedText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(
      <TypingArea
        textToType={mockText}
        onProgress={mockOnProgress}
        typedText=""
        setTypedText={mockSetTypedText}
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
        typedText=""
        setTypedText={mockSetTypedText}
      />
    );
    const input = screen.getByTestId('typing-input');
    
    fireEvent.change(input, { target: { value: 't' } });
    
    expect(mockSetTypedText).toHaveBeenCalledWith('t');
    expect(mockOnProgress).toHaveBeenCalledWith(
      11.11111111111111,
      't',
      0
    );
  });

  it('shows error on incorrect input', () => {
    render(
      <TypingArea
        textToType={mockText}
        onProgress={mockOnProgress}
        typedText=""
        setTypedText={mockSetTypedText}
      />
    );
    const input = screen.getByTestId('typing-input');
    
    fireEvent.change(input, { target: { value: 'x' } });
    
    expect(screen.getByTestId('error-indicator')).toBeVisible();
    expect(mockOnProgress).toHaveBeenCalledWith(
      0,
      'x',
      0
    );
  });
}); 
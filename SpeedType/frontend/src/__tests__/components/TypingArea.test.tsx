import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TypingArea from '../../components/TypingArea';

describe('TypingArea Component', () => {
  const mockText = 'test text';
  const mockOnProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(<TypingArea text={mockText} onProgress={mockOnProgress} />);
    
    expect(screen.getByTestId('typing-input')).toBeInTheDocument();
    expect(screen.getByText(mockText)).toBeInTheDocument();
  });

  it('handles user input correctly', () => {
    render(<TypingArea text={mockText} onProgress={mockOnProgress} />);
    const input = screen.getByTestId('typing-input');
    
    fireEvent.change(input, { target: { value: 't' } });
    
    expect(mockOnProgress).toHaveBeenCalledWith({
      accuracy: 100,
      progress: 1/9,
      errors: 0
    });
  });

  it('shows error on incorrect input', () => {
    render(<TypingArea text={mockText} onProgress={mockOnProgress} />);
    const input = screen.getByTestId('typing-input');
    
    fireEvent.change(input, { target: { value: 'x' } });
    
    expect(screen.getByTestId('error-indicator')).toBeVisible();
    expect(mockOnProgress).toHaveBeenCalledWith({
      accuracy: 0,
      progress: 0,
      errors: 1
    });
  });
}); 
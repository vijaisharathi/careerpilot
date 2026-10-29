import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { SuccessState } from '../components/common/SuccessState';

describe('Common UI Components & States', () => {
  it('renders Button correctly and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button loading state correctly', () => {
    render(<Button isLoading loadingText="Saving...">Save</Button>);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders Badge with correct text and variant styles', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders LoadingState with proper accessibility role', () => {
    render(<LoadingState title="Loading Roadmaps..." message="Please wait" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading Roadmaps...')).toBeInTheDocument();
  });

  it('renders ErrorState with title, message and retry trigger', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Network Error"
        message="Failed to connect"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry request/i });
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState with action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Resumes Yet"
        description="Upload or build your resume"
        actionText="Build Resume"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Resumes Yet')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /build resume/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders SuccessState properly', () => {
    render(<SuccessState title="Application Sent" message="Submitted to campus drive" />);

    expect(screen.getByText('Application Sent')).toBeInTheDocument();
    expect(screen.getByText('Submitted to campus drive')).toBeInTheDocument();
  });
});

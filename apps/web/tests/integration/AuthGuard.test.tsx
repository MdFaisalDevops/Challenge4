import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../../src/components/AuthGuard';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Auth Context and Next Navigation tools
jest.mock('../../src/context/AuthContext');
jest.mock('next/navigation');

describe('AuthGuard Component Integration Tests', () => {
  const mockPush = jest.fn();
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should redirect to login if user is unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      firebaseUser: null,
      user: null,
    });

    render(
      <AuthGuard allowedRoles={['OpsDirector']}>
        <div>Secret Admin Command</div>
      </AuthGuard>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Secret Admin Command')).not.toBeInTheDocument();
  });

  it('should render loading state if context is loading', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      firebaseUser: null,
      user: null,
    });

    render(
      <AuthGuard allowedRoles={['OpsDirector']}>
        <div>Secret Admin Command</div>
      </AuthGuard>
    );

    expect(screen.getByText(/Synchronizing credentials/i)).toBeInTheDocument();
  });

  it('should display children if authenticated user role is allowed', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      firebaseUser: { uid: '123' },
      user: { id: '123', role: 'OpsDirector', name: 'Director Sarah' },
    });

    render(
      <AuthGuard allowedRoles={['OpsDirector']}>
        <div>Secret Admin Command</div>
      </AuthGuard>
    );

    expect(screen.getByText('Secret Admin Command')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display access restricted error page if user role is unauthorized', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      firebaseUser: { uid: '123' },
      user: { id: '123', role: 'FieldAgent', name: 'Agent John' },
    });

    render(
      <AuthGuard allowedRoles={['OpsDirector']}>
        <div>Secret Admin Command</div>
      </AuthGuard>
    );

    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.queryByText('Secret Admin Command')).not.toBeInTheDocument();
  });
});

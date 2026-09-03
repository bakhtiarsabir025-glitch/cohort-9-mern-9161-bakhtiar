import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../pages/Signup';
import { AuthContext } from '../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the entire api/auth module so client.js (ESM/import.meta) is never loaded
jest.mock('../api/auth', () => ({
  login: jest.fn(),
  signup: jest.fn(),
}));

// Mock the api/client to avoid import.meta.env issues
jest.mock('../api/client', () => ({
  default: { interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
}));

const mockSignup = jest.fn();

const renderSignupWithContext = (signupFn = mockSignup) => {
  return render(
    <AuthContext.Provider value={{ signup: signupFn, isAuthenticated: false }}>
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the signup form with all fields', () => {
    renderSignupWithContext();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderSignupWithContext();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error when password is less than 6 characters', async () => {
    renderSignupWithContext();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    renderSignupWithContext();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    // Submit form directly to bypass jsdom's native type=email blocking
    const form = screen.getByRole('button', { name: /sign up/i }).closest('form');
    fireEvent.submit(form);
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('calls signup and navigates on successful submission', async () => {
    mockSignup.mockResolvedValueOnce({ token: 'test-token', user: { email: 'new@test.com' } });
    renderSignupWithContext();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('new@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: { message: 'Signup successful! Please log in.' } });
    });
  });

  it('shows API error on failed signup', async () => {
    mockSignup.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });
    renderSignupWithContext();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });

  it('has a link to the login page', () => {
    renderSignupWithContext();
    expect(screen.getByRole('link', { name: /log in here/i })).toBeInTheDocument();
  });
});

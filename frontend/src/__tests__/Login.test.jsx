import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
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

const mockLogin = jest.fn();

const renderLoginWithContext = (loginFn = mockLogin) => {
  return render(
    <AuthContext.Provider value={{ login: loginFn, isAuthenticated: false }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLoginWithContext();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows error when fields are empty and form is submitted', async () => {
    renderLoginWithContext();
    // Directly submit the form to bypass native HTML required validation in jsdom
    const form = screen.getByRole('button', { name: /log in/i }).closest('form');
    fireEvent.submit(form);
    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  it('calls login with correct credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce({ token: 'test-token', user: { email: 'test@test.com' } });
    renderLoginWithContext();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows API error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderLoginWithContext();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('has a link to the signup page', () => {
    renderLoginWithContext();
    expect(screen.getByRole('link', { name: /sign up here/i })).toBeInTheDocument();
  });
});

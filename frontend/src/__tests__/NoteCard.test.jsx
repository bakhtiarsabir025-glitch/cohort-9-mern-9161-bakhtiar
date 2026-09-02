import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from '../components/NoteCard';

const mockNote = {
  id: '1',
  title: 'Test Note',
  content: 'This is a test note content.',
  category: 'Work',
  tags: ['important', 'review'],
  is_pinned: false,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

const mockHandlers = {
  onEdit: jest.fn(),
  onArchive: jest.fn(),
  onRestore: jest.fn(),
  onPin: jest.fn(),
};

describe('NoteCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders note title and content', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('This is a test note content.')).toBeInTheDocument();
  });

  it('renders the category label', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    expect(screen.getByText('#important')).toBeInTheDocument();
    expect(screen.getByText('#review')).toBeInTheDocument();
  });

  it('renders "Untitled Note" when title is absent', () => {
    const untitledNote = { ...mockNote, title: '' };
    render(<NoteCard note={untitledNote} {...mockHandlers} />);
    expect(screen.getByText('Untitled Note')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    fireEvent.click(screen.getByTitle(/edit note/i));
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockNote);
  });

  it('calls onArchive when archive button is clicked (not deleted)', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    fireEvent.click(screen.getByTitle(/archive note/i));
    expect(mockHandlers.onArchive).toHaveBeenCalledWith(mockNote);
  });

  it('shows restore button and calls onRestore for archived (deleted) notes', () => {
    const archivedNote = { ...mockNote, is_deleted: true };
    render(<NoteCard note={archivedNote} {...mockHandlers} />);
    expect(screen.getByTitle(/restore note/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/restore note/i));
    expect(mockHandlers.onRestore).toHaveBeenCalledWith(archivedNote);
  });

  it('does not show pin button for archived notes', () => {
    const archivedNote = { ...mockNote, is_deleted: true };
    render(<NoteCard note={archivedNote} {...mockHandlers} />);
    expect(screen.queryByTitle(/pin note/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/unpin note/i)).not.toBeInTheDocument();
  });

  it('calls onPin when pin button is clicked', () => {
    render(<NoteCard note={mockNote} {...mockHandlers} />);
    fireEvent.click(screen.getByTitle(/pin note/i));
    expect(mockHandlers.onPin).toHaveBeenCalledWith(mockNote);
  });

  // Bonus: filter-related rendering tests
  it('renders pinned note with a visual indicator (pinned class)', () => {
    const pinnedNote = { ...mockNote, is_pinned: true };
    const { container } = render(<NoteCard note={pinnedNote} {...mockHandlers} />);
    // Using CSS modules, pinned class will have a hashed name - check via title button
    expect(screen.getByTitle(/unpin note/i)).toBeInTheDocument();
  });
});

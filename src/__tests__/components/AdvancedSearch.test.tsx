import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedSearch from '@/components/AdvancedSearch';
import type { WasteEntry } from '@/types/waste';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const mockWasteEntries: WasteEntry[] = [
  {
    id: '1',
    categoryId: 'plastic_bottles',
    categoryName: 'Plastic Bottles',
    disposal: 'recycled',
    weight: 0.5,
    carbonCredits: 15,
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    categoryId: 'food_waste',
    categoryName: 'Food Waste',
    disposal: 'composted',
    weight: 1.0,
    carbonCredits: 25,
    timestamp: new Date('2024-01-02T14:00:00Z'),
  },
  {
    id: '3',
    categoryId: 'plastic_bags',
    categoryName: 'Plastic Bags',
    disposal: 'disposed',
    weight: 0.1,
    carbonCredits: -67,
    timestamp: new Date('2024-01-03T16:00:00Z'),
  },
  {
    id: '4',
    categoryId: 'paper_cardboard',
    categoryName: 'Paper/Cardboard',
    disposal: 'recycled',
    weight: 2.0,
    carbonCredits: 30,
    timestamp: new Date('2024-01-04T09:00:00Z'),
  },
];

describe('AdvancedSearch', () => {
  const mockOnResultsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]'); // Empty search history
    mockOnResultsChange.mockClear();
  });

  it('should render search input and filter panel toggle', () => {
    render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
    
    expect(screen.getByPlaceholderText(/search waste entries/i)).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('should filter entries by search query', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
    
    const searchInput = screen.getByPlaceholderText(/search waste entries/i);
    await user.type(searchInput, 'plastic');
    
    await waitFor(() => {
      expect(mockOnResultsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ categoryName: 'Plastic Bottles' }),
          expect.objectContaining({ categoryName: 'Plastic Bags' }),
        ])
      );
    });
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
    
    const searchInput = screen.getByPlaceholderText(/search waste entries/i);
    await user.type(searchInput, 'plastic');
    
    const clearButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(mockOnResultsChange).toHaveBeenCalledWith(mockWasteEntries);
  });

  describe('Filter Panel', () => {
    it('should toggle filter panel visibility', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Disposal Methods')).toBeInTheDocument();
    });

    it('should filter by categories', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      // Click on plastic bottles category
      const plasticBottlesFilter = screen.getByText('Plastic Bottles');
      await user.click(plasticBottlesFilter);
      
      await waitFor(() => {
        expect(mockOnResultsChange).toHaveBeenCalledWith([
          expect.objectContaining({ categoryId: 'plastic_bottles' })
        ]);
      });
    });

    it('should filter by disposal methods', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      // Click on recycled disposal method
      const recycledFilter = screen.getByText('recycled');
      await user.click(recycledFilter);
      
      await waitFor(() => {
        expect(mockOnResultsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ disposal: 'recycled' }),
          ])
        );
      });
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      // Set start date
      const startDateInput = screen.getByLabelText('From Date');
      await user.type(startDateInput, '2024-01-02');
      
      await waitFor(() => {
        expect(mockOnResultsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: '2' }),
            expect.objectContaining({ id: '3' }),
            expect.objectContaining({ id: '4' }),
          ])
        );
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by date (newest first by default)', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      await waitFor(() => {
        const callArgs = mockOnResultsChange.mock.calls[0][0];
        expect(callArgs[0].id).toBe('4'); // Most recent entry first
      });
    });

    it('should sort by credits', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      // Change sort to credits
      const sortSelect = screen.getByDisplayValue('Date');
      await user.selectOptions(sortSelect, 'credits');
      
      await waitFor(() => {
        const callArgs = mockOnResultsChange.mock.calls[mockOnResultsChange.mock.calls.length - 1][0];
        expect(callArgs[0]).toEqual(expect.objectContaining({ carbonCredits: 30 })); // Highest credits first
      });
    });

    it('should change sort order', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      // Change sort order to ascending
      const orderSelect = screen.getByDisplayValue('Newest First');
      await user.selectOptions(orderSelect, 'asc');
      
      await waitFor(() => {
        const callArgs = mockOnResultsChange.mock.calls[mockOnResultsChange.mock.calls.length - 1][0];
        expect(callArgs[0].id).toBe('1'); // Oldest entry first
      });
    });
  });

  describe('AI Suggestions', () => {
    it('should generate category suggestions based on search', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      const searchInput = screen.getByPlaceholderText(/search waste entries/i);
      await user.type(searchInput, 'food');
      
      await waitFor(() => {
        expect(screen.getByText(/smart suggestions/i)).toBeInTheDocument();
        // Should suggest adding Food Waste filter
        expect(screen.getByText(/Add.*Food.*filter/i)).toBeInTheDocument();
      });
    });

    it('should show pattern recognition suggestions', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Search for something that will return multiple results
      const searchInput = screen.getByPlaceholderText(/search waste entries/i);
      await user.type(searchInput, 'recycled');
      
      await waitFor(() => {
        // Should show pattern about recycled items
        expect(screen.getByText(/smart suggestions/i)).toBeInTheDocument();
      });
    });

    it('should provide no results tip', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Search for something that won't match anything
      const searchInput = screen.getByPlaceholderText(/search waste entries/i);
      await user.type(searchInput, 'nonexistentcategory');
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(screen.getByText(/try broadening your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search History', () => {
    it('should save search queries to history', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      const searchInput = screen.getByPlaceholderText(/search waste entries/i);
      await user.type(searchInput, 'plastic bottles');
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'wasteSearchHistory',
          expect.stringContaining('plastic bottles')
        );
      });
    });

    it('should display search history when input is focused', async () => {
      const user = userEvent.setup();
      const searchHistory = ['plastic bottles', 'food waste'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(searchHistory));
      
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      const searchInput = screen.getByPlaceholderText(/search waste entries/i);
      await user.click(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('plastic bottles')).toBeInTheDocument();
        expect(screen.getByText('food waste')).toBeInTheDocument();
      });
    });
  });

  describe('Clear All Filters', () => {
    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdvancedSearch entries={mockWasteEntries} onResultsChange={mockOnResultsChange} />);
      
      // Open filter panel and apply some filters
      const filterToggle = screen.getByText('Filters');
      await user.click(filterToggle);
      
      const plasticBottlesFilter = screen.getByText('Plastic Bottles');
      await user.click(plasticBottlesFilter);
      
      // Clear all filters
      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(mockOnResultsChange).toHaveBeenCalledWith(mockWasteEntries);
      });
    });
  });
});
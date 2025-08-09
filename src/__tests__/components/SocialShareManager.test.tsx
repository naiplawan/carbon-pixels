import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialShareManager from '@/components/SocialShareManager';

// Mock canvas and its context for image generation
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(),
  toDataURL: jest.fn(),
};

const mockContext = {
  fillStyle: '',
  textAlign: '',
  font: '',
  globalAlpha: 1,
  lineWidth: 0,
  strokeStyle: '',
  fillRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
};

global.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as any;
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return document.createElement(tagName);
  }),
});

// Mock window.open
global.open = jest.fn();

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

const mockWasteEntries = [
  {
    id: '1',
    categoryId: 'plastic_bottles',
    categoryName: 'Plastic Bottles',
    disposal: 'recycled',
    weight: 0.5,
    carbonCredits: 15,
    timestamp: '2024-01-01',
  },
  {
    id: '2',
    categoryId: 'food_waste',
    categoryName: 'Food Waste',
    disposal: 'composted',
    weight: 1.0,
    carbonCredits: 25,
    timestamp: '2024-01-02',
  },
];

describe('SocialShareManager', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mock-image-data');
  });

  it('should render with achievement preview', async () => {
    render(
      <SocialShareManager 
        totalCredits={2500} 
        wasteEntries={mockWasteEntries} 
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Share Your Impact!')).toBeInTheDocument();
      expect(screen.getByText(/tree.*saved/i)).toBeInTheDocument();
    });
  });

  it('should generate appropriate achievement for tree milestone', async () => {
    render(
      <SocialShareManager 
        totalCredits={2500} // 5 trees equivalent
        wasteEntries={mockWasteEntries} 
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('5 Trees Saved!')).toBeInTheDocument();
      expect(screen.getByText('🌳')).toBeInTheDocument();
    });
  });

  it('should generate streak achievement for low credits', async () => {
    // Mock entries for consecutive days to trigger streak
    const streakEntries = [
      { ...mockWasteEntries[0], timestamp: new Date() },
      { ...mockWasteEntries[1], timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: '3', categoryId: 'paper', categoryName: 'Paper', disposal: 'recycled', weight: 0.3, carbonCredits: 10, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ];

    render(
      <SocialShareManager 
        totalCredits={150} // Low credits to trigger streak check
        wasteEntries={streakEntries} 
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/day.*streak/i)).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Platform Templates', () => {
    it('should display platform template options', async () => {
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Twitter Milestone')).toBeInTheDocument();
        expect(screen.getByText('Facebook Story')).toBeInTheDocument();
        expect(screen.getByText('Instagram Post')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp Message')).toBeInTheDocument();
      });
    });

    it('should switch templates and update message', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(/reached.*carbon credits/i)).toBeInTheDocument();
      });

      const facebookTemplate = screen.getByText('Facebook Story');
      await user.click(facebookTemplate);

      await waitFor(() => {
        expect(screen.getByDisplayValue(/environmental update/i)).toBeInTheDocument();
      });
    });

    it('should show character limit for Twitter', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Max 280 chars')).toBeInTheDocument();
      });
    });
  });

  describe('Message Customization', () => {
    it('should allow editing the generated message', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const textarea = await screen.findByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Custom environmental message!');

      expect(textarea).toHaveValue('Custom environmental message!');
    });

    it('should show character count for Twitter', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const textarea = await screen.findByRole('textbox');
      const initialLength = (textarea as HTMLTextAreaElement).value.length;
      
      expect(screen.getByText(`${initialLength}/280`)).toBeInTheDocument();
    });
  });

  describe('Image Generation', () => {
    it('should show generate image button for image-supporting platforms', async () => {
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Generate Image')).toBeInTheDocument();
      });
    });

    it('should generate and display image', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const generateButton = await screen.findByText('Generate Image');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByAltText('Generated share image')).toBeInTheDocument();
        expect(screen.getByText('Perfect for Instagram, Facebook, and Twitter!')).toBeInTheDocument();
      });
    });
  });

  describe('Sharing Actions', () => {
    it('should open Twitter share URL', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const twitterButton = await screen.findByText('Twitter');
      await user.click(twitterButton);

      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should open Facebook share URL', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const facebookButton = await screen.findByText('Facebook');
      await user.click(facebookButton);

      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should copy text to clipboard', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const copyButton = await screen.findByText('Copy');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should download image when download button is clicked', async () => {
      const user = userEvent.setup();
      const mockLink = {
        click: jest.fn(),
        download: '',
        href: '',
      };
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') return mockLink as any;
        if (tagName === 'canvas') return mockCanvas as any;
        return document.createElement(tagName);
      });

      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const downloadButton = await screen.findByText('Download Image');
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toContain('thailand-waste-diary-');
      });
    });
  });

  describe('Statistics Display', () => {
    it('should display correct statistics in achievement preview', async () => {
      render(
        <SocialShareManager 
          totalCredits={2500} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2500')).toBeInTheDocument(); // Credits
        expect(screen.getByText('5')).toBeInTheDocument(); // Trees (2500/500)
        expect(screen.getByText('2.5kg')).toBeInTheDocument(); // CO2 saved
        expect(screen.getByText('1.5kg')).toBeInTheDocument(); // Waste tracked
      });
    });

    it('should calculate streak days correctly', async () => {
      const consecutiveEntries = [
        { ...mockWasteEntries[0], timestamp: new Date() },
        { ...mockWasteEntries[1], timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { id: '3', categoryId: 'paper', categoryName: 'Paper', disposal: 'recycled', weight: 0.3, carbonCredits: 10, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { id: '4', categoryId: 'glass', categoryName: 'Glass', disposal: 'recycled', weight: 0.2, carbonCredits: 8, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      ];

      render(
        <SocialShareManager 
          totalCredits={150} // Low to trigger streak achievement
          wasteEntries={consecutiveEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/4 day.*streak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Pro Tips Section', () => {
    it('should display pro tips for better engagement', async () => {
      render(
        <SocialShareManager 
          totalCredits={1000} 
          wasteEntries={mockWasteEntries} 
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Pro Tips:')).toBeInTheDocument();
        expect(screen.getByText(/share regularly to inspire others/i)).toBeInTheDocument();
        expect(screen.getByText(/peak hours.*7-9 AM/i)).toBeInTheDocument();
      });
    });
  });
});
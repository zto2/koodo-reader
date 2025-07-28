import FlomoService, { FlomoExportData } from '../flomoService';

// Mock ConfigService
jest.mock('../../../assets/lib/kookit-extra-browser.min', () => ({
  ConfigService: {
    getReaderConfig: jest.fn(),
    setReaderConfig: jest.fn(),
  },
}));

// Mock i18n
jest.mock('../../../i18n', () => ({
  t: (key: string) => key,
}));

// Mock fetch
global.fetch = jest.fn();

describe('FlomoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateWebhookUrl', () => {
    it('should validate correct flomo webhook URL', () => {
      const validUrl = 'https://flomoapp.com/mine/abc123';
      expect(FlomoService.validateWebhookUrl(validUrl)).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(FlomoService.validateWebhookUrl('')).toBe(false);
      expect(FlomoService.validateWebhookUrl('invalid-url')).toBe(false);
      expect(FlomoService.validateWebhookUrl('https://example.com/webhook')).toBe(false);
      expect(FlomoService.validateWebhookUrl('https://flomoapp.com/other/path')).toBe(false);
    });
  });

  describe('formatContent', () => {
    it('should format content correctly with all fields', () => {
      const data: FlomoExportData = {
        text: 'This is a test highlight',
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author',
        chapter: 'Chapter 1',
        pageNumber: '42',
        location: '25%'
      };

      const result = FlomoService.formatContent(data);
      
      expect(result).toContain('📖 《Test Book》- Test Author');
      expect(result).toContain('"This is a test highlight"');
      expect(result).toContain('📍 Chapter 1 | 页码：42 | 位置：25%');
      expect(result).toContain('🏷️ #读书笔记 #KoodoReader');
    });

    it('should format content correctly with minimal fields', () => {
      const data: FlomoExportData = {
        text: 'Simple highlight',
        bookTitle: 'Simple Book',
        bookAuthor: 'Unknown author'
      };

      const result = FlomoService.formatContent(data);
      
      expect(result).toContain('📖 《Simple Book》');
      expect(result).not.toContain('Unknown author');
      expect(result).toContain('"Simple highlight"');
      expect(result).toContain('🏷️ #读书笔记 #KoodoReader');
    });
  });

  describe('exportToFlomo', () => {
    const mockConfigService = require('../../../assets/lib/kookit-extra-browser.min').ConfigService;

    it('should export successfully with valid configuration', async () => {
      mockConfigService.getReaderConfig
        .mockReturnValueOnce('yes') // isEnableFlomo
        .mockReturnValueOnce('https://flomoapp.com/mine/test123'); // flomoWebhookUrl

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const data: FlomoExportData = {
        text: 'Test highlight',
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author'
      };

      const result = await FlomoService.exportToFlomo(data);
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://flomoapp.com/mine/test123',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test highlight'),
        })
      );
    });

    it('should fail when flomo is not configured', async () => {
      mockConfigService.getReaderConfig
        .mockReturnValueOnce('no') // isEnableFlomo
        .mockReturnValueOnce(''); // flomoWebhookUrl

      const data: FlomoExportData = {
        text: 'Test highlight',
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author'
      };

      const result = await FlomoService.exportToFlomo(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockConfigService.getReaderConfig
        .mockReturnValueOnce('yes') // isEnableFlomo
        .mockReturnValueOnce('https://flomoapp.com/mine/test123'); // flomoWebhookUrl

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const data: FlomoExportData = {
        text: 'Test highlight',
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author'
      };

      const result = await FlomoService.exportToFlomo(data);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await FlomoService.testConnection('https://flomoapp.com/mine/test123');
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://flomoapp.com/mine/test123',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Koodo Reader flomo integration test'),
        })
      );
    });

    it('should fail with invalid URL', async () => {
      const result = await FlomoService.testConnection('invalid-url');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid webhook URL format');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

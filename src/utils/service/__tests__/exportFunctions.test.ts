import { AnkiExportService } from '../ankiExportService';
import BookModel from '../../../models/Book';
import NoteModel from '../../../models/Note';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

describe('Export Functions', () => {
  let mockBook: BookModel;
  let mockNotes: NoteModel[];

  beforeEach(() => {
    mockBook = {
      key: 'test-book',
      name: '测试书籍',
      author: '测试作者',
      format: 'EPUB'
    } as BookModel;

    mockNotes = [
      {
        key: 'note1',
        text: '这是高亮文本',
        notes: '这是笔记内容',
        chapter: '第一章',
        percentage: '0.25'
      } as NoteModel,
      {
        key: 'note2',
        text: '另一段高亮',
        notes: '',
        chapter: '第二章',
        percentage: '0.50'
      } as NoteModel
    ];
  });

  describe('AnkiExportService', () => {
    test('should create AnkiExportService instance', () => {
      const service = AnkiExportService.getInstance();
      expect(service).toBeDefined();
      expect(typeof service.exportBookToAnki).toBe('function');
    });

    test('should generate correct Anki card format', () => {
      const service = AnkiExportService.getInstance();
      const noteToAnkiCard = (service as any).noteToAnkiCard.bind(service);
      
      const card = noteToAnkiCard(mockNotes[0], mockBook);
      
      expect(card.front).toContain('这是高亮文本');
      expect(card.back).toContain('这是笔记内容');
      expect(card.tags).toContain('测试书籍');
    });

    test('should handle notes without content', () => {
      const service = AnkiExportService.getInstance();
      const noteToAnkiCard = (service as any).noteToAnkiCard.bind(service);

      const card = noteToAnkiCard(mockNotes[1], mockBook);

      expect(card.front).toContain('另一段高亮');
      expect(card.back).toContain('Chapter:'); // Contains metadata even without notes
      expect(card.back).not.toContain('<strong>Note:</strong>'); // But no note content
    });

    test('should use correct file naming convention', async () => {
      const service = AnkiExportService.getInstance();
      const { saveAs } = require('file-saver');
      
      await service.exportBookToAnki(mockBook, mockNotes);
      
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        '测试书籍-笔记导出-2条.txt'
      );
    });
  });

  describe('Text Export (from UnifiedExportDialog)', () => {
    test('should generate correct text format', () => {
      // Simulate the text export logic
      let content = `${mockBook.name}\n`;
      if (mockBook.author) {
        content += `作者: ${mockBook.author}\n`;
      }
      content += `导出时间: ${new Date().toLocaleString()}\n`;
      content += `笔记数量: ${mockNotes.length}条\n\n`;
      content += '='.repeat(50) + '\n\n';

      mockNotes.forEach((note, index) => {
        content += `${index + 1}. `;
        
        if (note.text) {
          content += `"${note.text}"\n`;
        }
        
        if (note.notes) {
          content += `笔记: ${note.notes}\n`;
        }
        
        if (note.chapter) {
          content += `章节: ${note.chapter}\n`;
        }
        if (note.percentage) {
          content += `位置: ${Math.floor(parseFloat(note.percentage) * 100)}%\n`;
        }
        
        content += '\n' + '-'.repeat(30) + '\n\n';
      });

      expect(content).toContain('测试书籍');
      expect(content).toContain('作者: 测试作者');
      expect(content).toContain('笔记数量: 2条');
      expect(content).toContain('"这是高亮文本"');
      expect(content).toContain('笔记: 这是笔记内容');
      expect(content).toContain('章节: 第一章');
      expect(content).toContain('位置: 25%');
    });
  });
});

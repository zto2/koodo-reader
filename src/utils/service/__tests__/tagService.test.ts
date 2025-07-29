import { TagService } from '../tagService';
import NoteModel from '../../../models/Note';

describe('TagService', () => {
  let tagService: TagService;
  let mockNotes: NoteModel[];

  beforeEach(() => {
    tagService = TagService.getInstance();
    
    // 创建模拟笔记数据
    mockNotes = [
      new NoteModel(
        'book1',
        'Chapter 1',
        0,
        '这是一个关于 #读书笔记/技术/前端 的内容',
        'cfi1',
        'range1',
        '这是笔记内容 #学习/编程',
        '10%',
        0,
        []
      ),
      new NoteModel(
        'book2',
        'Chapter 2',
        0,
        '另一个 #读书笔记/技术/后端 的例子',
        'cfi2',
        'range2',
        '后端开发笔记 #学习/编程/JavaScript',
        '20%',
        1,
        []
      ),
      new NoteModel(
        'book3',
        'Chapter 3',
        0,
        '关于 #生活/健康 的内容',
        'cfi3',
        'range3',
        '健康生活方式',
        '30%',
        2,
        []
      )
    ];
  });

  describe('extractTags', () => {
    it('should extract tags from text', () => {
      const text = '这是一个 #测试/标签 和 #另一个标签 的例子';
      const tags = tagService.extractTags(text);
      
      expect(tags).toEqual(['测试/标签', '另一个标签']);
    });

    it('should handle empty text', () => {
      const tags = tagService.extractTags('');
      expect(tags).toEqual([]);
    });

    it('should remove duplicates', () => {
      const text = '#标签1 #标签2 #标签1';
      const tags = tagService.extractTags(text);
      
      expect(tags).toEqual(['标签1', '标签2']);
    });
  });

  describe('parseTagHierarchy', () => {
    it('should parse hierarchical tags', () => {
      const tag = '读书笔记/技术/前端';
      const hierarchy = tagService.parseTagHierarchy(tag);
      
      expect(hierarchy).toEqual([
        '读书笔记',
        '读书笔记/技术',
        '读书笔记/技术/前端'
      ]);
    });

    it('should handle single level tags', () => {
      const tag = '单级标签';
      const hierarchy = tagService.parseTagHierarchy(tag);
      
      expect(hierarchy).toEqual(['单级标签']);
    });
  });

  describe('buildTagHierarchy', () => {
    it('should build correct hierarchy structure', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      
      // 检查根标签
      const rootTags = tagService.getRootTags(hierarchy);
      expect(rootTags.length).toBeGreaterThan(0);
      
      // 检查特定标签
      expect(hierarchy['读书笔记']).toBeDefined();
      expect(hierarchy['读书笔记/技术']).toBeDefined();
      expect(hierarchy['读书笔记/技术/前端']).toBeDefined();
    });

    it('should count tag usage correctly', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      
      // 检查标签计数
      expect(hierarchy['学习'].count).toBe(2); // 出现在两个笔记中
      expect(hierarchy['读书笔记'].count).toBe(2); // 出现在两个笔记中
    });
  });

  describe('filterNotesByTags', () => {
    it('should filter notes by single tag', () => {
      const filteredNotes = tagService.filterNotesByTags(mockNotes, ['学习']);
      
      expect(filteredNotes.length).toBe(2);
    });

    it('should filter notes by multiple tags (AND logic)', () => {
      const filteredNotes = tagService.filterNotesByTags(mockNotes, ['学习', '编程']);
      
      expect(filteredNotes.length).toBe(2);
    });

    it('should return empty array for non-existent tags', () => {
      const filteredNotes = tagService.filterNotesByTags(mockNotes, ['不存在的标签']);
      
      expect(filteredNotes.length).toBe(0);
    });
  });

  describe('searchTags', () => {
    it('should search tags by query', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      const results = tagService.searchTags(hierarchy, '技术');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(tag => tag.name.includes('技术'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      const results = tagService.searchTags(hierarchy, '不存在');
      
      expect(results.length).toBe(0);
    });
  });

  describe('isValidTagPath', () => {
    it('should validate correct tag paths', () => {
      expect(tagService.isValidTagPath('有效标签')).toBe(true);
      expect(tagService.isValidTagPath('分类/子分类')).toBe(true);
      expect(tagService.isValidTagPath('深层/分类/子分类/具体标签')).toBe(true);
    });

    it('should reject invalid tag paths', () => {
      expect(tagService.isValidTagPath('')).toBe(false);
      expect(tagService.isValidTagPath('   ')).toBe(false);
      expect(tagService.isValidTagPath('包含#特殊字符')).toBe(false);
      expect(tagService.isValidTagPath('a'.repeat(60))).toBe(false); // 太长
    });
  });

  describe('formatTagPath', () => {
    it('should format tag paths correctly', () => {
      expect(tagService.formatTagPath('  标签1  /  标签2  ')).toBe('标签1/标签2');
      expect(tagService.formatTagPath('标签1//标签2')).toBe('标签1/标签2');
      expect(tagService.formatTagPath('/标签1/标签2/')).toBe('标签1/标签2');
    });
  });

  describe('getTagSuggestions', () => {
    it('should provide relevant suggestions', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      const suggestions = tagService.getTagSuggestions(hierarchy, '技', 5);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.name.includes('技术'))).toBe(true);
    });

    it('should limit suggestions count', () => {
      const hierarchy = tagService.buildTagHierarchy(mockNotes);
      const suggestions = tagService.getTagSuggestions(hierarchy, '', 3);
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getTagStatistics', () => {
    it('should calculate correct statistics', () => {
      const stats = tagService.getTagStatistics(mockNotes);
      
      expect(stats.totalTags).toBeGreaterThan(0);
      expect(stats.totalUniqueNotes).toBe(3);
      expect(stats.averageTagsPerNote).toBeGreaterThan(0);
      expect(stats.mostUsedTags.length).toBeGreaterThan(0);
    });
  });

  describe('cleanTextFromTags', () => {
    it('should remove tags from text', () => {
      const text = '这是一个 #标签1 和 #标签2 的例子';
      const cleaned = tagService.cleanTextFromTags(text);
      
      expect(cleaned).toBe('这是一个  和  的例子');
    });

    it('should handle text without tags', () => {
      const text = '这是没有标签的文本';
      const cleaned = tagService.cleanTextFromTags(text);
      
      expect(cleaned).toBe(text);
    });
  });
});

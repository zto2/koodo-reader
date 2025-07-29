import NoteModel from "../../models/Note";
import BookModel from "../../models/Book";
import { TagService } from "../service/tagService";

export interface SearchResult {
  type: 'note' | 'tag' | 'book';
  item: NoteModel | BookModel | string;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  highlightedText?: string;
}

export class EnhancedSearchUtil {
  private static tagService = TagService.getInstance();

  /**
   * 综合搜索：支持笔记内容、标签、书籍名称的搜索
   */
  public static search(
    query: string,
    notes: NoteModel[],
    books: BookModel[],
    options: {
      includeNotes?: boolean;
      includeTags?: boolean;
      includeBooks?: boolean;
      maxResults?: number;
    } = {}
  ): SearchResult[] {
    const {
      includeNotes = true,
      includeTags = true,
      includeBooks = true,
      maxResults = 50
    } = options;

    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // 搜索标签
    if (includeTags) {
      const tagResults = this.searchTags(query, notes);
      results.push(...tagResults);
    }

    // 搜索笔记内容
    if (includeNotes) {
      const noteResults = this.searchNotes(query, notes);
      results.push(...noteResults);
    }

    // 搜索书籍
    if (includeBooks) {
      const bookResults = this.searchBooks(query, books);
      results.push(...bookResults);
    }

    // 按相关性排序
    results.sort((a, b) => {
      // 优先级：exact > partial > fuzzy
      const scoreA = this.getMatchScore(a.matchType) + a.score;
      const scoreB = this.getMatchScore(b.matchType) + b.score;
      return scoreB - scoreA;
    });

    return results.slice(0, maxResults);
  }

  /**
   * 搜索标签
   */
  public static searchTags(query: string, notes: NoteModel[]): SearchResult[] {
    const hierarchy = this.tagService.buildTagHierarchy(notes);
    const tagResults = this.tagService.searchTags(hierarchy, query);
    
    return tagResults.map(tag => ({
      type: 'tag' as const,
      item: tag.name,
      score: tag.count,
      matchType: this.getTagMatchType(query, tag.name),
      highlightedText: this.highlightText(tag.name, query)
    }));
  }

  /**
   * 搜索笔记内容
   */
  public static searchNotes(query: string, notes: NoteModel[]): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const note of notes) {
      const textContent = (note.text || '') + ' ' + (note.notes || '');
      const lowerContent = textContent.toLowerCase();
      
      if (lowerContent.includes(lowerQuery)) {
        const matchType = this.getTextMatchType(query, textContent);
        const score = this.calculateNoteScore(query, note);
        
        results.push({
          type: 'note',
          item: note,
          score,
          matchType,
          highlightedText: this.highlightText(textContent, query)
        });
      }
    }

    return results;
  }

  /**
   * 搜索书籍
   */
  public static searchBooks(query: string, books: BookModel[]): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const book of books) {
      const searchableText = `${book.name} ${book.author} ${book.description || ''}`;
      const lowerText = searchableText.toLowerCase();
      
      if (lowerText.includes(lowerQuery)) {
        const matchType = this.getTextMatchType(query, searchableText);
        const score = this.calculateBookScore(query, book);
        
        results.push({
          type: 'book',
          item: book,
          score,
          matchType,
          highlightedText: this.highlightText(searchableText, query)
        });
      }
    }

    return results;
  }

  /**
   * 按标签过滤笔记
   */
  public static filterNotesByTags(notes: NoteModel[], tags: string[]): NoteModel[] {
    return this.tagService.filterNotesByTags(notes, tags);
  }

  /**
   * 获取匹配类型分数
   */
  private static getMatchScore(matchType: 'exact' | 'partial' | 'fuzzy'): number {
    switch (matchType) {
      case 'exact': return 100;
      case 'partial': return 50;
      case 'fuzzy': return 10;
      default: return 0;
    }
  }

  /**
   * 获取标签匹配类型
   */
  private static getTagMatchType(query: string, tagName: string): 'exact' | 'partial' | 'fuzzy' {
    const lowerQuery = query.toLowerCase();
    const lowerTag = tagName.toLowerCase();
    
    if (lowerTag === lowerQuery) return 'exact';
    if (lowerTag.includes(lowerQuery)) return 'partial';
    return 'fuzzy';
  }

  /**
   * 获取文本匹配类型
   */
  private static getTextMatchType(query: string, text: string): 'exact' | 'partial' | 'fuzzy' {
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes(lowerQuery)) {
      // 检查是否为完整单词匹配
      const regex = new RegExp(`\\b${this.escapeRegex(lowerQuery)}\\b`, 'i');
      if (regex.test(text)) return 'exact';
      return 'partial';
    }
    return 'fuzzy';
  }

  /**
   * 计算笔记相关性分数
   */
  private static calculateNoteScore(query: string, note: NoteModel): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    // 标题匹配权重更高
    if (note.text && note.text.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // 笔记内容匹配
    if (note.notes && note.notes.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }
    
    // 标签匹配
    const tags = this.tagService.extractTagsFromNote(note);
    for (const tag of tags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        score += 8;
      }
    }
    
    return score;
  }

  /**
   * 计算书籍相关性分数
   */
  private static calculateBookScore(query: string, book: BookModel): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    // 书名匹配权重最高
    if (book.name.toLowerCase().includes(lowerQuery)) {
      score += 15;
    }
    
    // 作者匹配
    if (book.author && book.author.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }
    
    // 描述匹配
    if (book.description && book.description.toLowerCase().includes(lowerQuery)) {
      score += 3;
    }
    
    return score;
  }

  /**
   * 高亮匹配文本
   */
  private static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * 转义正则表达式特殊字符
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 获取搜索建议
   */
  public static getSearchSuggestions(
    query: string,
    notes: NoteModel[],
    books: BookModel[],
    limit: number = 5
  ): string[] {
    const suggestions = new Set<string>();
    
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    
    // 从标签中获取建议
    const hierarchy = this.tagService.buildTagHierarchy(notes);
    const tagSuggestions = this.tagService.getTagSuggestions(hierarchy, query, limit);
    tagSuggestions.forEach(tag => suggestions.add(tag.name));
    
    // 从书名中获取建议
    books.forEach(book => {
      if (book.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(book.name);
      }
    });
    
    // 从笔记内容中获取常见词汇建议
    // 这里可以实现更复杂的词汇提取逻辑
    
    return Array.from(suggestions).slice(0, limit);
  }
}

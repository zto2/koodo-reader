import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import { saveAs } from "file-saver";

export interface AnkiCard {
  front: string;
  back: string;
  tags: string[];
}

export class AnkiExportService {
  private static instance: AnkiExportService;

  public static getInstance(): AnkiExportService {
    if (!AnkiExportService.instance) {
      AnkiExportService.instance = new AnkiExportService();
    }
    return AnkiExportService.instance;
  }

  /**
   * 从文本中提取标签
   */
  private extractTags(text: string): string[] {
    const tagRegex = /#([^\s#]+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    
    return tags;
  }

  /**
   * 清理文本，移除标签
   */
  private cleanText(text: string): string {
    return text.replace(/#([^\s#]+)/g, '').trim();
  }

  /**
   * 转换笔记为Anki卡片
   */
  private noteToAnkiCard(note: NoteModel, book: BookModel): AnkiCard {
    const highlightText = this.cleanText(note.text || "");
    const noteText = this.cleanText(note.notes || "");
    const tags = this.extractTags((note.text || "") + " " + (note.notes || ""));
    
    // 构建正面（高亮文本）
    const front = highlightText;
    
    // 构建背面（书籍信息 + 笔记）
    let back = `<div class="book-info">
      <strong>Book:</strong> ${book.name}<br>
      <strong>Author:</strong> ${book.author || "Unknown"}<br>`;
    
    if (note.chapter) {
      back += `<strong>Chapter:</strong> ${note.chapter}<br>`;
    }
    
    if (note.percentage) {
      back += `<strong>Location:</strong> ${Math.floor(parseFloat(note.percentage) * 100)}%<br>`;
    }
    
    back += `</div>`;
    
    if (noteText) {
      back += `<div class="note-content">
        <strong>Note:</strong><br>
        ${noteText}
      </div>`;
    }
    
    return {
      front,
      back,
      tags: [...tags, book.name.replace(/\s+/g, '_'), 'koodo_reader']
    };
  }

  /**
   * 生成Anki导入格式的文本文件
   */
  private generateAnkiText(cards: AnkiCard[]): string {
    let content = "";
    
    for (const card of cards) {
      // Anki格式：Front\tBack\tTags
      const front = card.front.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const back = card.back.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const tags = card.tags.join(' ');
      
      content += `${front}\t${back}\t${tags}\n`;
    }
    
    return content;
  }

  /**
   * 导出单本书的笔记和高亮为Anki格式
   */
  public async exportBookToAnki(book: BookModel, notes: NoteModel[]): Promise<void> {
    if (notes.length === 0) {
      throw new Error("No notes or highlights to export");
    }

    const cards = notes.map(note => this.noteToAnkiCard(note, book));
    const ankiText = this.generateAnkiText(cards);
    
    const blob = new Blob([ankiText], { type: "text/plain;charset=utf-8" });
    const fileName = `${book.name.replace(/[^a-zA-Z0-9]/g, '_')}_anki_export.txt`;
    
    saveAs(blob, fileName);
  }

  /**
   * 导出多本书的笔记和高亮为Anki格式
   */
  public async exportMultipleBooksToAnki(
    booksWithNotes: Array<{ book: BookModel; notes: NoteModel[] }>
  ): Promise<void> {
    const allCards: AnkiCard[] = [];
    
    for (const { book, notes } of booksWithNotes) {
      const cards = notes.map(note => this.noteToAnkiCard(note, book));
      allCards.push(...cards);
    }
    
    if (allCards.length === 0) {
      throw new Error("No notes or highlights to export");
    }

    const ankiText = this.generateAnkiText(allCards);
    
    const blob = new Blob([ankiText], { type: "text/plain;charset=utf-8" });
    const fileName = `koodo_reader_anki_export_${new Date().toISOString().split('T')[0]}.txt`;
    
    saveAs(blob, fileName);
  }

  /**
   * 导出笔记为Anki格式
   */
  public async exportNotesToAnki(book: BookModel, notes: NoteModel[]): Promise<void> {
    const actualNotes = notes.filter(note => note.notes && note.notes.trim() !== "");
    await this.exportBookToAnki(book, actualNotes);
  }

  /**
   * 导出高亮为Anki格式
   */
  public async exportHighlightsToAnki(book: BookModel, notes: NoteModel[]): Promise<void> {
    const highlights = notes.filter(note => !note.notes || note.notes.trim() === "");
    await this.exportBookToAnki(book, highlights);
  }

  /**
   * 导出所有笔记和高亮为Anki格式
   */
  public async exportAllToAnki(book: BookModel, notes: NoteModel[]): Promise<void> {
    await this.exportBookToAnki(book, notes);
  }
}

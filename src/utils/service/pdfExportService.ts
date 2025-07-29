import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import { saveAs } from "file-saver";

// 使用动态导入来避免打包问题
let jsPDF: any = null;

export interface PDFExportOptions {
  layout: 'list' | 'card';
  includeMetadata: boolean;
  groupByChapter: boolean;
}

export class PDFExportService {
  private static instance: PDFExportService;

  public static getInstance(): PDFExportService {
    if (!PDFExportService.instance) {
      PDFExportService.instance = new PDFExportService();
    }
    return PDFExportService.instance;
  }

  /**
   * 初始化jsPDF库
   */
  private async initJsPDF(): Promise<any> {
    if (!jsPDF) {
      try {
        const jsPDFModule = await import('jspdf');
        jsPDF = jsPDFModule.jsPDF;

        // 添加中文字体支持
        try {
          // 尝试加载中文字体
          const fontModule = await import('jspdf/dist/jspdf.es.min.js');
          if (fontModule) {
            // 设置默认字体为支持中文的字体
            console.log("Chinese font support loaded");
          }
        } catch (fontError) {
          console.warn("Chinese font loading failed, using fallback:", fontError);
        }
      } catch (error) {
        console.error("Failed to load jsPDF:", error);
        throw new Error("PDF export functionality is not available. Please install jsPDF.");
      }
    }
    return jsPDF;
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
   * 分割长文本以适应PDF页面
   */
  private splitText(doc: any, text: string, maxWidth: number): string[] {
    // 确保文本编码正确
    const cleanedText = this.ensureTextEncoding(text);
    return doc.splitTextToSize(cleanedText, maxWidth);
  }

  /**
   * 确保文本编码正确，处理中文字符
   */
  private ensureTextEncoding(text: string): string {
    if (!text) return '';

    try {
      // 处理可能的编码问题
      // 如果文本包含乱码，尝试重新编码
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const encoded = encoder.encode(text);
      const decoded = decoder.decode(encoded);
      return decoded;
    } catch (error) {
      console.warn("Text encoding failed, using original:", error);
      return text;
    }
  }

  /**
   * 添加页眉
   */
  private addHeader(doc: any, title: string, pageNumber: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(title, 20, 15);
    doc.text(`Page ${pageNumber}`, pageWidth - 40, 15);
    
    // 添加分隔线
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 20, pageWidth - 20, 20);
    
    return 30; // 返回内容开始的Y位置
  }

  /**
   * 添加书籍信息
   */
  private addBookInfo(doc: any, book: BookModel, startY: number): number {
    let currentY = startY;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(book.name, 20, currentY);
    currentY += 10;
    
    if (book.author) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Author: ${book.author}`, 20, currentY);
      currentY += 8;
    }
    
    currentY += 10; // 额外间距
    return currentY;
  }

  /**
   * 添加笔记/高亮项目（列表模式）
   */
  private addNoteItemList(doc: any, note: NoteModel, book: BookModel, startY: number): number {
    let currentY = startY;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 40;
    
    // 高亮文本
    const highlightText = this.cleanText(note.text || "");
    if (highlightText) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const highlightLines = this.splitText(doc, `"${highlightText}"`, maxWidth);
      
      for (const line of highlightLines) {
        if (currentY > 270) { // 检查是否需要新页面
          doc.addPage();
          currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
        }
        doc.text(line, 20, currentY);
        currentY += 6;
      }
      currentY += 3;
    }
    
    // 笔记内容
    const noteText = this.cleanText(note.notes || "");
    if (noteText) {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const noteLines = this.splitText(doc, `Note: ${noteText}`, maxWidth);
      
      for (const line of noteLines) {
        if (currentY > 270) {
          doc.addPage();
          currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
        }
        doc.text(line, 25, currentY);
        currentY += 5;
      }
      currentY += 3;
    }
    
    // 元数据
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    let metadata = "";
    if (note.chapter) metadata += `Chapter: ${note.chapter} | `;
    if (note.percentage) metadata += `Location: ${Math.floor(parseFloat(note.percentage) * 100)}%`;
    
    if (metadata) {
      if (currentY > 270) {
        doc.addPage();
        currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
      }
      doc.text(metadata, 25, currentY);
      currentY += 5;
    }
    
    // 标签
    const tags = this.extractTags((note.text || "") + " " + (note.notes || ""));
    if (tags.length > 0) {
      if (currentY > 270) {
        doc.addPage();
        currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
      }
      doc.text(`Tags: ${tags.map(tag => `#${tag}`).join(', ')}`, 25, currentY);
      currentY += 5;
    }
    
    currentY += 8; // 项目间距
    return currentY;
  }

  /**
   * 导出为PDF
   */
  public async exportToPDF(
    book: BookModel,
    notes: NoteModel[],
    options: PDFExportOptions = {
      layout: 'list',
      includeMetadata: true,
      groupByChapter: false
    }
  ): Promise<void> {
    const PDF = await this.initJsPDF();
    const doc = new PDF();

    // 设置PDF文档属性以支持中文
    doc.setProperties({
      title: `${book.name} - Notes & Highlights`,
      subject: 'Book Notes and Highlights Export',
      author: book.author || 'Koodo Reader',
      creator: 'Koodo Reader'
    });

    // 尝试设置支持中文的字体
    try {
      // 使用内置字体，这些字体对中文有更好的支持
      doc.setFont('helvetica', 'normal');
    } catch (error) {
      console.warn("Font setting failed, using default:", error);
    }

    let currentY = this.addHeader(doc, `${book.name} - Notes & Highlights`, 1);
    currentY = this.addBookInfo(doc, book, currentY);
    
    // 按章节分组（如果需要）
    let groupedNotes: { [key: string]: NoteModel[] } = {};
    if (options.groupByChapter) {
      for (const note of notes) {
        const chapter = note.chapter || "Unknown Chapter";
        if (!groupedNotes[chapter]) {
          groupedNotes[chapter] = [];
        }
        groupedNotes[chapter].push(note);
      }
    } else {
      groupedNotes["All Notes"] = notes;
    }
    
    // 渲染内容
    for (const [chapterName, chapterNotes] of Object.entries(groupedNotes)) {
      if (options.groupByChapter && chapterName !== "All Notes") {
        // 添加章节标题
        if (currentY > 260) {
          doc.addPage();
          currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
        }
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(chapterName, 20, currentY);
        currentY += 15;
      }
      
      for (const note of chapterNotes) {
        currentY = this.addNoteItemList(doc, note, book, currentY);
        
        if (currentY > 270) {
          doc.addPage();
          currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
        }
      }
    }
    
    // 保存文件 - 使用描述性文件名
    const notesCount = notes.length;
    const sanitizedBookName = book.name.replace(/[<>:"/\\|?*]/g, ''); // 移除文件名不允许的字符
    const fileName = `${sanitizedBookName}-笔记导出-${notesCount}条.pdf`;
    doc.save(fileName);
  }

  /**
   * 导出笔记为PDF
   */
  public async exportNotesToPDF(book: BookModel, notes: NoteModel[], options?: PDFExportOptions): Promise<void> {
    const actualNotes = notes.filter(note => note.notes && note.notes.trim() !== "");

    // 使用自定义文件名生成逻辑
    const PDF = await this.initJsPDF();
    const doc = new PDF();

    // 设置PDF文档属性
    doc.setProperties({
      title: `${book.name} - 笔记导出`,
      subject: 'Book Notes Export',
      author: book.author || 'Koodo Reader',
      creator: 'Koodo Reader'
    });

    try {
      doc.setFont('helvetica', 'normal');
    } catch (error) {
      console.warn("Font setting failed, using default:", error);
    }

    let currentY = this.addHeader(doc, `${book.name} - 笔记导出`, 1);
    currentY = this.addBookInfo(doc, book, currentY);

    // 渲染笔记内容
    for (const note of actualNotes) {
      currentY = this.addNoteItemList(doc, note, book, currentY);

      if (currentY > 270) {
        doc.addPage();
        currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
      }
    }

    // 保存文件 - 笔记专用文件名
    const notesCount = actualNotes.length;
    const sanitizedBookName = book.name.replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${sanitizedBookName}-笔记导出-${notesCount}条.pdf`;
    doc.save(fileName);
  }

  /**
   * 导出高亮为PDF
   */
  public async exportHighlightsToPDF(book: BookModel, notes: NoteModel[], options?: PDFExportOptions): Promise<void> {
    const highlights = notes.filter(note => !note.notes || note.notes.trim() === "");

    // 使用自定义文件名生成逻辑
    const PDF = await this.initJsPDF();
    const doc = new PDF();

    // 设置PDF文档属性
    doc.setProperties({
      title: `${book.name} - 高亮导出`,
      subject: 'Book Highlights Export',
      author: book.author || 'Koodo Reader',
      creator: 'Koodo Reader'
    });

    try {
      doc.setFont('helvetica', 'normal');
    } catch (error) {
      console.warn("Font setting failed, using default:", error);
    }

    let currentY = this.addHeader(doc, `${book.name} - 高亮导出`, 1);
    currentY = this.addBookInfo(doc, book, currentY);

    // 渲染高亮内容
    for (const highlight of highlights) {
      currentY = this.addNoteItemList(doc, highlight, book, currentY);

      if (currentY > 270) {
        doc.addPage();
        currentY = this.addHeader(doc, book.name, doc.internal.getNumberOfPages());
      }
    }

    // 保存文件 - 高亮专用文件名
    const highlightsCount = highlights.length;
    const sanitizedBookName = book.name.replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${sanitizedBookName}-高亮导出-${highlightsCount}条.pdf`;
    doc.save(fileName);
  }

  /**
   * 导出所有笔记和高亮为PDF
   */
  public async exportAllToPDF(book: BookModel, notes: NoteModel[], options?: PDFExportOptions): Promise<void> {
    await this.exportToPDF(book, notes, options);
  }
}

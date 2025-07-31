import Book from "../../models/Book";
import Note from "../../models/Note";
import { saveAs } from "file-saver";

declare var window: any;

// 获取当前日期用于文件命名
const getCurrentDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 清理文本内容，确保Anki格式兼容性
const sanitizeTextForAnki = (text: string): string => {
  if (!text) return "";
  
  // 移除或替换可能干扰Anki格式的字符
  return text
    .replace(/\t/g, " ")  // 替换制表符为空格
    .replace(/\n/g, "<br>")  // 换行符转换为HTML换行
    .replace(/\r/g, "")  // 移除回车符
    .replace(/"/g, '""')  // 转义双引号
    .trim();
};

// 生成Anki标签
const generateAnkiTags = (book: Book, noteType: string, noteTags?: string[]): string => {
  const tags: string[] = [];
  
  // 添加书籍信息标签
  if (book.name) {
    tags.push(book.name.replace(/\s+/g, "_").replace(/[^\w\-_]/g, ""));
  }
  
  if (book.author) {
    tags.push(book.author.replace(/\s+/g, "_").replace(/[^\w\-_]/g, ""));
  }
  
  // 添加类型标签
  tags.push(noteType);
  
  // 添加用户自定义标签
  if (noteTags && noteTags.length > 0) {
    tags.push(...noteTags.map(tag => tag.replace(/\s+/g, "_").replace(/[^\w\-_]/g, "")));
  }
  
  return tags.join(" ");
};

// 导出笔记到Anki格式
export const exportNotesToAnki = (notes: Note[], books: Book[]) => {
  const ankiData: string[] = [];
  
  notes.forEach((note) => {
    const book = books.find(b => b.key === note.bookKey);
    const bookName = book ? book.name : "Unknown Book";
    const bookAuthor = book ? book.author : "Unknown Author";
    
    // 构建前面（问题/上下文）
    const front = sanitizeTextForAnki(
      `Note from "${bookName}" - Chapter: ${note.chapter || "Unknown"}\n\nContext: ${note.text}`
    );
    
    // 构建背面（笔记内容）
    const back = sanitizeTextForAnki(note.notes);
    
    // 生成标签
    const tags = generateAnkiTags(book || {} as Book, "Notes", note.tag);
    
    // 创建Anki卡片行（制表符分隔）
    const ankiCard = `${front}\t${back}\t${tags}`;
    ankiData.push(ankiCard);
  });
  
  // 生成文件内容
  const fileContent = ankiData.join('\n');
  
  // 创建并下载文件
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const fileName = `KoodoReader-Notes-Anki-${getCurrentDateString()}.txt`;
  
  saveAs(blob, fileName);
};

// 导出高亮到Anki格式
export const exportHighlightsToAnki = (highlights: Note[], books: Book[]) => {
  const ankiData: string[] = [];
  
  highlights.forEach((highlight) => {
    const book = books.find(b => b.key === highlight.bookKey);
    const bookName = book ? book.name : "Unknown Book";
    const bookAuthor = book ? book.author : "Unknown Author";
    
    // 构建前面（问题）
    const front = sanitizeTextForAnki(
      `What was highlighted in "${bookName}"${highlight.chapter ? ` - Chapter: ${highlight.chapter}` : ''}?`
    );
    
    // 构建背面（高亮内容）
    const back = sanitizeTextForAnki(highlight.text);
    
    // 生成标签
    const tags = generateAnkiTags(book || {} as Book, "Highlights", highlight.tag);
    
    // 创建Anki卡片行（制表符分隔）
    const ankiCard = `${front}\t${back}\t${tags}`;
    ankiData.push(ankiCard);
  });
  
  // 生成文件内容
  const fileContent = ankiData.join('\n');
  
  // 创建并下载文件
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const fileName = `KoodoReader-Highlights-Anki-${getCurrentDateString()}.txt`;
  
  saveAs(blob, fileName);
};

// 导出混合内容（笔记和高亮）到Anki格式
export const exportMixedToAnki = (notes: Note[], highlights: Note[], books: Book[]) => {
  const ankiData: string[] = [];

  // 处理笔记
  notes.forEach((note) => {
    const book = books.find(b => b.key === note.bookKey);
    const bookName = book ? book.name : "Unknown Book";

    const front = sanitizeTextForAnki(
      `Note from "${bookName}" - Chapter: ${note.chapter || "Unknown"}\n\nContext: ${note.text}`
    );
    const back = sanitizeTextForAnki(note.notes);
    const tags = generateAnkiTags(book || {} as Book, "Notes", note.tag);

    ankiData.push(`${front}\t${back}\t${tags}`);
  });

  // 处理高亮
  highlights.forEach((highlight) => {
    const book = books.find(b => b.key === highlight.bookKey);
    const bookName = book ? book.name : "Unknown Book";

    const front = sanitizeTextForAnki(
      `What was highlighted in "${bookName}"${highlight.chapter ? ` - Chapter: ${highlight.chapter}` : ''}?`
    );
    const back = sanitizeTextForAnki(highlight.text);
    const tags = generateAnkiTags(book || {} as Book, "Highlights", highlight.tag);

    ankiData.push(`${front}\t${back}\t${tags}`);
  });

  // 生成文件内容
  const fileContent = ankiData.join('\n');

  // 创建并下载文件
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const fileName = `KoodoReader-Mixed-Anki-${getCurrentDateString()}.txt`;

  saveAs(blob, fileName);
};

// 导出所有内容（笔记和高亮）到单个Anki文件
export const exportAllToAnki = (allNotes: Note[], books: Book[]) => {
  // 分离笔记和高亮
  const notes = allNotes.filter(note => note.notes !== "");
  const highlights = allNotes.filter(note => note.notes === "");

  // 使用现有的混合导出函数
  exportMixedToAnki(notes, highlights, books);
};

// 导出词典历史到Anki格式
export const exportDictionaryHistoryToAnki = (dictHistory: any[], books: Book[]) => {
  const ankiData: string[] = [];

  dictHistory.forEach((word) => {
    const book = books.find(b => b.key === word.bookKey);
    const bookName = book ? book.name : "Unknown Book";

    // 构建前面（问题格式）
    const front = sanitizeTextForAnki(
      `What does "${word.word}" mean in "${bookName}"?`
    );

    // 构建背面（定义/翻译）
    const back = sanitizeTextForAnki(
      word.definition || word.translation || word.word
    );

    // 生成标签
    const tags = generateAnkiTags(book || {} as Book, "Dictionary");

    // 创建Anki卡片行（制表符分隔）
    const ankiCard = `${front}\t${back}\t${tags}`;
    ankiData.push(ankiCard);
  });

  // 生成文件内容
  const fileContent = ankiData.join('\n');

  // 创建并下载文件
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const fileName = `KoodoReader-Dictionary-Anki-${getCurrentDateString()}.txt`;

  saveAs(blob, fileName);
};

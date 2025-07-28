import DatabaseService from "../storage/databaseService";
import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import { FlomoService } from "./flomoService";
import toast from "react-hot-toast";

export class FlomoBulkExportService {
  private static instance: FlomoBulkExportService;
  private flomoService: FlomoService;

  private constructor() {
    this.flomoService = FlomoService.getInstance();
  }

  public static getInstance(): FlomoBulkExportService {
    if (!FlomoBulkExportService.instance) {
      FlomoBulkExportService.instance = new FlomoBulkExportService();
    }
    return FlomoBulkExportService.instance;
  }

  /**
   * 批量导出书籍的所有笔记到flomo
   */
  public async exportNotesToFlomo(book: BookModel): Promise<void> {
    try {
      // 获取书籍的所有笔记
      const notes = await DatabaseService.getRecordsByBookKey(book.key, "notes");
      const actualNotes = notes.filter((note: NoteModel) => note.notes && note.notes.trim() !== "");

      if (actualNotes.length === 0) {
        toast.error("该书籍没有笔记可导出");
        return;
      }

      // 显示进度提示
      toast.loading(`正在导出 ${actualNotes.length} 条笔记...`, { id: "bulk-export-notes" });

      let successCount = 0;
      let failureCount = 0;

      // 逐个导出笔记
      for (const note of actualNotes) {
        try {
          await this.flomoService.exportNoteToFlomo(note, book);
          successCount++;
          
          // 添加延迟避免API限制
          await this.delay(500);
        } catch (error) {
          console.error("导出笔记失败:", error);
          failureCount++;
        }
      }

      // 显示结果
      toast.dismiss("bulk-export-notes");
      if (failureCount === 0) {
        toast.success(`成功导出 ${successCount} 条笔记到 flomo`);
      } else {
        toast.error(`导出完成：成功 ${successCount} 条，失败 ${failureCount} 条`);
      }
    } catch (error) {
      toast.dismiss("bulk-export-notes");
      console.error("批量导出笔记失败:", error);
      toast.error("批量导出笔记失败，请检查网络连接和flomo配置");
    }
  }

  /**
   * 批量导出书籍的所有高亮到flomo
   */
  public async exportHighlightsToFlomo(book: BookModel): Promise<void> {
    try {
      // 获取书籍的所有高亮（没有笔记内容的记录）
      const notes = await DatabaseService.getRecordsByBookKey(book.key, "notes");
      const highlights = notes.filter((note: NoteModel) => !note.notes || note.notes.trim() === "");

      if (highlights.length === 0) {
        toast.error("该书籍没有高亮可导出");
        return;
      }

      // 显示进度提示
      toast.loading(`正在导出 ${highlights.length} 条高亮...`, { id: "bulk-export-highlights" });

      let successCount = 0;
      let failureCount = 0;

      // 逐个导出高亮
      for (const highlight of highlights) {
        try {
          await this.flomoService.exportHighlightToFlomo(highlight, book);
          successCount++;
          
          // 添加延迟避免API限制
          await this.delay(500);
        } catch (error) {
          console.error("导出高亮失败:", error);
          failureCount++;
        }
      }

      // 显示结果
      toast.dismiss("bulk-export-highlights");
      if (failureCount === 0) {
        toast.success(`成功导出 ${successCount} 条高亮到 flomo`);
      } else {
        toast.error(`导出完成：成功 ${successCount} 条，失败 ${failureCount} 条`);
      }
    } catch (error) {
      toast.dismiss("bulk-export-highlights");
      console.error("批量导出高亮失败:", error);
      toast.error("批量导出高亮失败，请检查网络连接和flomo配置");
    }
  }

  /**
   * 批量导出书籍的所有笔记和高亮到flomo
   */
  public async exportAllToFlomo(book: BookModel): Promise<void> {
    try {
      // 获取书籍的所有记录
      const notes = await DatabaseService.getRecordsByBookKey(book.key, "notes");

      if (notes.length === 0) {
        toast.error("该书籍没有笔记或高亮可导出");
        return;
      }

      // 显示进度提示
      toast.loading(`正在导出 ${notes.length} 条记录...`, { id: "bulk-export-all" });

      let successCount = 0;
      let failureCount = 0;

      // 逐个导出所有记录
      for (const note of notes) {
        try {
          if (note.notes && note.notes.trim() !== "") {
            // 导出笔记
            await this.flomoService.exportNoteToFlomo(note, book);
          } else {
            // 导出高亮
            await this.flomoService.exportHighlightToFlomo(note, book);
          }
          successCount++;
          
          // 添加延迟避免API限制
          await this.delay(500);
        } catch (error) {
          console.error("导出记录失败:", error);
          failureCount++;
        }
      }

      // 显示结果
      toast.dismiss("bulk-export-all");
      if (failureCount === 0) {
        toast.success(`成功导出 ${successCount} 条记录到 flomo`);
      } else {
        toast.error(`导出完成：成功 ${successCount} 条，失败 ${failureCount} 条`);
      }
    } catch (error) {
      toast.dismiss("bulk-export-all");
      console.error("批量导出失败:", error);
      toast.error("批量导出失败，请检查网络连接和flomo配置");
    }
  }

  /**
   * 延迟函数，用于避免API限制
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查是否可以进行批量导出
   */
  public canBulkExport(): boolean {
    return this.flomoService.isConfigured();
  }

  /**
   * 获取书籍的笔记和高亮统计信息
   */
  public async getBookExportStats(book: BookModel): Promise<{
    notesCount: number;
    highlightsCount: number;
    totalCount: number;
  }> {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(book.key, "notes");
      const actualNotes = notes.filter((note: NoteModel) => note.notes && note.notes.trim() !== "");
      const highlights = notes.filter((note: NoteModel) => !note.notes || note.notes.trim() === "");

      return {
        notesCount: actualNotes.length,
        highlightsCount: highlights.length,
        totalCount: notes.length
      };
    } catch (error) {
      console.error("获取书籍统计信息失败:", error);
      return {
        notesCount: 0,
        highlightsCount: 0,
        totalCount: 0
      };
    }
  }
}

export default FlomoBulkExportService;

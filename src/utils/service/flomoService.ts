import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";
import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import { FlomoLimitService } from "./flomoLimitService";

export interface FlomoExportData {
  text: string;
  bookTitle: string;
  bookAuthor: string;
  chapter?: string;
  pageNumber?: string;
  location?: string;
}

export interface FlomoApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class FlomoService {
  private static instance: FlomoService;

  private constructor() {}

  public static getInstance(): FlomoService {
    if (!FlomoService.instance) {
      FlomoService.instance = new FlomoService();
    }
    return FlomoService.instance;
  }

  /**
   * 检查flomo是否已配置
   */
  public isConfigured(): boolean {
    const webhookUrl = ConfigService.getReaderConfig("flomoWebhookUrl");
    const isEnabled = ConfigService.getReaderConfig("isEnableFlomo") === "yes";
    return isEnabled && !!webhookUrl && webhookUrl.trim() !== "";
  }

  /**
   * 获取flomo webhook URL
   */
  public getWebhookUrl(): string {
    return ConfigService.getReaderConfig("flomoWebhookUrl") || "";
  }

  /**
   * 设置flomo webhook URL
   */
  public setWebhookUrl(url: string): void {
    ConfigService.setReaderConfig("flomoWebhookUrl", url);
  }

  /**
   * 格式化高亮内容为flomo笔记格式
   */
  public formatContent(data: FlomoExportData): string {
    const { text, bookTitle, bookAuthor, chapter, pageNumber, location } = data;
    
    let content = `📖 《${bookTitle}》`;
    if (bookAuthor && bookAuthor !== "Unknown author") {
      content += ` - ${bookAuthor}`;
    }
    content += "\n\n";
    
    // 添加引用格式的高亮文本
    content += `"${text}"\n\n`;
    
    // 添加位置信息
    const locationParts: string[] = [];
    if (chapter) {
      locationParts.push(chapter);
    }
    if (pageNumber) {
      locationParts.push(`页码：${pageNumber}`);
    }
    if (location) {
      locationParts.push(`位置：${location}`);
    }
    
    if (locationParts.length > 0) {
      content += `📍 ${locationParts.join(" | ")}\n`;
    }
    
    // 添加标签
    content += "🏷️ #读书笔记 #KoodoReader";
    
    return content;
  }

  /**
   * 验证webhook URL格式
   */
  public validateWebhookUrl(url: string): boolean {
    if (!url || url.trim() === "") {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      // flomo webhook URL应该是https://flomoapp.com/mine/...格式
      return urlObj.hostname === "flomoapp.com" && 
             urlObj.pathname.startsWith("/mine/");
    } catch (error) {
      return false;
    }
  }

  /**
   * 导出高亮到flomo
   */
  public async exportToFlomo(data: FlomoExportData): Promise<FlomoApiResponse> {
    try {
      // 检查配置
      if (!this.isConfigured()) {
        return {
          success: false,
          error: i18n.t("Flomo is not configured. Please set up your webhook URL in settings.")
        };
      }

      const webhookUrl = this.getWebhookUrl();
      
      // 验证URL
      if (!this.validateWebhookUrl(webhookUrl)) {
        return {
          success: false,
          error: i18n.t("Invalid flomo webhook URL. Please check your configuration.")
        };
      }

      // 格式化内容
      const content = this.formatContent(data);
      
      // 发送请求到flomo
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          source: "Koodo Reader"
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: i18n.t("Successfully exported to flomo")
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: i18n.t("Failed to export to flomo") + `: ${response.status} ${errorText}`
        };
      }
    } catch (error) {
      console.error("Error exporting to flomo:", error);
      return {
        success: false,
        error: i18n.t("Network error occurred while exporting to flomo")
      };
    }
  }

  /**
   * 导出笔记到flomo
   */
  public async exportNoteToFlomo(note: NoteModel, book: BookModel): Promise<void> {
    // 检查每日限制
    if (!FlomoLimitService.canExport(1)) {
      const stats = FlomoLimitService.getUsageStats();
      throw new Error(i18n.t("Daily export limit reached") + ` (${stats.used}/${stats.limit})`);
    }

    let pageNumber: string | undefined;
    try {
      if (note.cfi) {
        const locationData = JSON.parse(note.cfi);
        if (locationData && locationData.page) {
          pageNumber = locationData.page.toString();
        }
      }
    } catch (e) {
      // cfi might not be a valid JSON, ignore error.
    }

    const data: FlomoExportData = {
      text: note.notes || note.text,
      bookTitle: book.name,
      bookAuthor: book.author || "Unknown author",
      chapter: note.chapter,
      pageNumber: pageNumber,
      location: note.percentage ? `${Math.floor(parseFloat(note.percentage) * 100)}%` : undefined
    };

    const result = await this.exportToFlomo(data);
    if (!result.success) {
      throw new Error(result.error || "导出失败");
    }

    // 记录导出成功
    FlomoLimitService.recordExport(1);
  }

  /**
   * 导出高亮到flomo
   */
  public async exportHighlightToFlomo(highlight: NoteModel, book: BookModel): Promise<void> {
    // 检查每日限制
    if (!FlomoLimitService.canExport(1)) {
      const stats = FlomoLimitService.getUsageStats();
      throw new Error(i18n.t("Daily export limit reached") + ` (${stats.used}/${stats.limit})`);
    }

    let pageNumber: string | undefined;
    try {
      if (highlight.cfi) {
        const locationData = JSON.parse(highlight.cfi);
        if (locationData && locationData.page) {
          pageNumber = locationData.page.toString();
        }
      }
    } catch (e) {
      // cfi might not be a valid JSON, ignore error.
    }

    const data: FlomoExportData = {
      text: highlight.text,
      bookTitle: book.name,
      bookAuthor: book.author || "Unknown author",
      chapter: highlight.chapter,
      pageNumber: pageNumber,
      location: highlight.percentage ? `${Math.floor(parseFloat(highlight.percentage) * 100)}%` : undefined
    };

    const result = await this.exportToFlomo(data);
    if (!result.success) {
      throw new Error(result.error || "导出失败");
    }

    // 记录导出成功
    FlomoLimitService.recordExport(1);
  }

  /**
   * 测试flomo连接
   */
  public async testConnection(webhookUrl: string): Promise<FlomoApiResponse> {
    try {
      if (!this.validateWebhookUrl(webhookUrl)) {
        return {
          success: false,
          error: i18n.t("Invalid webhook URL format")
        };
      }

      // 发送测试内容
      const testContent = "🧪 Koodo Reader flomo integration test\n\n这是来自Koodo Reader的测试消息，如果您看到这条消息，说明集成配置成功！\n\n🏷️ #KoodoReader #测试";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: testContent,
          source: "Koodo Reader Test"
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: i18n.t("Connection test successful")
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: i18n.t("Connection test failed") + `: ${response.status} ${errorText}`
        };
      }
    } catch (error) {
      console.error("Error testing flomo connection:", error);
      return {
        success: false,
        error: i18n.t("Network error during connection test")
      };
    }
  }
}

export default FlomoService;

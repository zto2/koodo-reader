import React from "react";
import "./flomoExportAction.css";
import { Trans } from "react-i18next";
import { FlomoExportActionProps, FlomoExportActionState } from "./interface";
import FlomoBulkExportService from "../../../utils/service/flomoBulkExportService";
import toast from "react-hot-toast";
import { AnkiExportService } from "../../../utils/service/ankiExportService";
import { PDFExportService } from "../../../utils/service/pdfExportService";
import DatabaseService from "../../../utils/storage/databaseService";

class FlomoExportAction extends React.Component<FlomoExportActionProps, FlomoExportActionState> {
  private hoverTimeout: NodeJS.Timeout | null = null;

  constructor(props: FlomoExportActionProps) {
    super(props);
    this.state = {
      stats: {
        notesCount: 0,
        highlightsCount: 0,
        totalCount: 0
      }
    };
  }

  componentWillUnmount() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  async componentDidMount() {
    // 获取书籍的笔记和高亮统计信息
    const flomoBulkService = FlomoBulkExportService.getInstance();
    const stats = await flomoBulkService.getBookExportStats(this.props.currentBook);
    this.setState({ stats });
  }

  handleExportNotes = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportNotesToFlomo(this.props.currentBook);
  };

  handleExportHighlights = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportHighlightsToFlomo(this.props.currentBook);
  };

  handleExportAll = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportAllToFlomo(this.props.currentBook);
  };

  // Anki导出方法
  handleExportNotesToAnki = async () => {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );
      const actualNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");

      if (actualNotes.length === 0) {
        toast.error("该书籍没有笔记可以导出");
        return;
      }

      const ankiService = AnkiExportService.getInstance();
      await ankiService.exportNotesToAnki(this.props.currentBook, actualNotes);
      toast.success("笔记已成功导出为Anki格式");
      this.props.handleActionDialog(false);
    } catch (error) {
      console.error("Anki导出失败:", error);
      toast.error("Anki导出失败");
    }
  };

  handleExportHighlightsToAnki = async () => {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );
      const highlights = notes.filter((note) => !note.notes || note.notes.trim() === "");

      if (highlights.length === 0) {
        toast.error("该书籍没有高亮可以导出");
        return;
      }

      const ankiService = AnkiExportService.getInstance();
      await ankiService.exportHighlightsToAnki(this.props.currentBook, highlights);
      toast.success("高亮已成功导出为Anki格式");
      this.props.handleActionDialog(false);
    } catch (error) {
      console.error("Anki导出失败:", error);
      toast.error("Anki导出失败");
    }
  };

  // PDF导出方法
  handleExportNotesToPDF = async () => {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );
      const actualNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");

      if (actualNotes.length === 0) {
        toast.error("该书籍没有笔记可以导出");
        return;
      }

      const pdfService = PDFExportService.getInstance();
      await pdfService.exportNotesToPDF(this.props.currentBook, actualNotes);
      toast.success("笔记已成功导出为PDF格式");
      this.props.handleActionDialog(false);
    } catch (error) {
      console.error("PDF导出失败:", error);
      toast.error("PDF导出失败");
    }
  };

  handleExportHighlightsToPDF = async () => {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );
      const highlights = notes.filter((note) => !note.notes || note.notes.trim() === "");

      if (highlights.length === 0) {
        toast.error("该书籍没有高亮可以导出");
        return;
      }

      const pdfService = PDFExportService.getInstance();
      await pdfService.exportHighlightsToPDF(this.props.currentBook, highlights);
      toast.success("高亮已成功导出为PDF格式");
      this.props.handleActionDialog(false);
    } catch (error) {
      console.error("PDF导出失败:", error);
      toast.error("PDF导出失败");
    }
  };

  render() {
    const { stats } = this.state;
    
    return (
      <div
        className="flomo-export-action-container"
        onMouseLeave={(event) => {
          // Check if moving back to parent menu
          const relatedTarget = event.relatedTarget as HTMLElement;

          // Check if relatedTarget is a valid DOM element before calling closest()
          let isMovingToParent = false;
          if (relatedTarget && typeof relatedTarget.closest === 'function') {
            isMovingToParent = !!relatedTarget.closest('.action-dialog-container');
          }

          if (isMovingToParent) {
            // Don't hide if moving back to parent
            return;
          }

          // Add short delay for other cases
          this.hoverTimeout = setTimeout(() => {
            this.props.handleFlomoExportAction(false);
            this.props.handleActionDialog(false);
          }, 150);
        }}
        onMouseEnter={(event) => {
          // Clear any existing timeout
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
          }

          this.props.handleFlomoExportAction(true);
          this.props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          this.props.isShowFlomoExport
            ? {
                position: "fixed",
                left: this.props.left + (this.props.isExceed ? -220 : 220),
                top: this.props.top + 70,
              }
            : { display: "none" }
        }
      >
        <div className="flomo-export-actions-container">
          <div
            className="flomo-export-action-item"
            onClick={this.handleExportNotes}
            style={{ 
              opacity: stats.notesCount > 0 ? 1 : 0.5,
              cursor: stats.notesCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-note flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export notes</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.notesCount} 条笔记
              </p>
            </div>
          </div>
          
          <div
            className="flomo-export-action-item"
            onClick={this.handleExportHighlights}
            style={{ 
              opacity: stats.highlightsCount > 0 ? 1 : 0.5,
              cursor: stats.highlightsCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-highlight flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export highlights</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.highlightsCount} 条高亮
              </p>
            </div>
          </div>
          
          <div
            className="flomo-export-action-item"
            onClick={this.handleExportAll}
            style={{
              opacity: stats.totalCount > 0 ? 1 : 0.5,
              cursor: stats.totalCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-export flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export all</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.totalCount} 条记录
              </p>
            </div>
          </div>

          {/* 分隔符 */}
          <div className="flomo-export-separator">
            <div className="flomo-export-separator-line"></div>
            <span className="flomo-export-separator-text">其他格式</span>
            <div className="flomo-export-separator-line"></div>
          </div>

          {/* Anki导出选项 */}
          <div
            className="flomo-export-action-item"
            onClick={this.handleExportNotesToAnki}
            style={{
              opacity: stats.notesCount > 0 ? 1 : 0.5,
              cursor: stats.notesCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-note flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export notes to Anki</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.notesCount} 条笔记
              </p>
            </div>
          </div>

          <div
            className="flomo-export-action-item"
            onClick={this.handleExportHighlightsToAnki}
            style={{
              opacity: stats.highlightsCount > 0 ? 1 : 0.5,
              cursor: stats.highlightsCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-highlight flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export highlights to Anki</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.highlightsCount} 条高亮
              </p>
            </div>
          </div>

          {/* PDF导出选项 */}
          <div
            className="flomo-export-action-item"
            onClick={this.handleExportNotesToPDF}
            style={{
              opacity: stats.notesCount > 0 ? 1 : 0.5,
              cursor: stats.notesCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-note flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export notes to PDF</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.notesCount} 条笔记
              </p>
            </div>
          </div>

          <div
            className="flomo-export-action-item"
            onClick={this.handleExportHighlightsToPDF}
            style={{
              opacity: stats.highlightsCount > 0 ? 1 : 0.5,
              cursor: stats.highlightsCount > 0 ? "pointer" : "not-allowed"
            }}
          >
            <span className="icon-highlight flomo-export-icon"></span>
            <div className="flomo-export-action-content">
              <p className="flomo-export-action-name">
                <Trans>Export highlights to PDF</Trans>
              </p>
              <p className="flomo-export-action-count">
                {stats.highlightsCount} 条高亮
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default FlomoExportAction;

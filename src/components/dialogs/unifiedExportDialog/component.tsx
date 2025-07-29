import React from "react";
import "./unifiedExportDialog.css";
import { Trans } from "react-i18next";
import { UnifiedExportDialogProps, UnifiedExportDialogState, ExportOption, FormatOption } from "./interface";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import { AnkiExportService } from "../../../utils/service/ankiExportService";
import { PDFExportService } from "../../../utils/service/pdfExportService";
import { FlomoBulkExportService } from "../../../utils/service/flomoBulkExportService";
import { exportNotes, exportHighlights } from "../../../utils/file/export";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

class UnifiedExportDialog extends React.Component<UnifiedExportDialogProps, UnifiedExportDialogState> {
  private hoverTimeout: NodeJS.Timeout | null = null;

  constructor(props: UnifiedExportDialogProps) {
    super(props);
    this.state = {
      stats: {
        notesCount: 0,
        highlightsCount: 0,
        totalCount: 0,
      },
      selectedContentType: 'notes',
      selectedFormat: 'pdf',
      isLoading: false,
    };
  }

  async componentDidMount() {
    await this.loadStats();
    // 监听窗口大小变化，重新计算位置
    window.addEventListener('resize', this.handleWindowResize);
  }

  async componentDidUpdate(prevProps: UnifiedExportDialogProps) {
    if (this.props.isShow && !prevProps.isShow) {
      await this.loadStats();
    }
  }

  componentWillUnmount() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    window.removeEventListener('resize', this.handleWindowResize);
  }

  handleWindowResize = () => {
    // 强制重新渲染以重新计算位置
    this.forceUpdate();
  };

  loadStats = async () => {
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );
      
      const actualNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");
      const highlights = notes.filter((note) => !note.notes || note.notes.trim() === "");
      
      this.setState({
        stats: {
          notesCount: actualNotes.length,
          highlightsCount: highlights.length,
          totalCount: notes.length,
        }
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  getContentOptions = (): ExportOption[] => {
    const { stats } = this.state;
    return [
      {
        id: 'notes',
        name: this.props.t('Notes'),
        icon: 'icon-note',
        description: this.props.t('Export your notes and annotations'),
        count: stats.notesCount,
        disabled: stats.notesCount === 0,
      },
      {
        id: 'highlights',
        name: this.props.t('Highlights'),
        icon: 'icon-highlight',
        description: this.props.t('Export your highlighted text'),
        count: stats.highlightsCount,
        disabled: stats.highlightsCount === 0,
      },
      {
        id: 'all',
        name: this.props.t('All'),
        icon: 'icon-export',
        description: this.props.t('Export both notes and highlights'),
        count: stats.totalCount,
        disabled: stats.totalCount === 0,
      },
    ];
  };

  getFormatOptions = (): FormatOption[] => {
    const options: FormatOption[] = [
      {
        id: 'pdf',
        name: 'PDF',
        icon: 'icon-file-pdf',
        description: this.props.t('Formatted PDF document'),
        supportedTypes: ['notes', 'highlights', 'all'],
      },
      {
        id: 'anki',
        name: 'Anki',
        icon: 'icon-anki',
        description: this.props.t('Anki flashcards format'),
        supportedTypes: ['notes', 'highlights', 'all'],
      },
      {
        id: 'csv',
        name: 'CSV',
        icon: 'icon-file-text',
        description: this.props.t('Spreadsheet format'),
        supportedTypes: ['notes', 'highlights', 'all'],
      },
    ];

    // 只有在启用 flomo 时才显示 flomo 选项
    if (ConfigService.getReaderConfig("isEnableFlomo") === "yes") {
      options.unshift({
        id: 'flomo',
        name: 'Flomo',
        icon: 'icon-flomo',
        description: this.props.t('Export to flomo service'),
        supportedTypes: ['notes', 'highlights', 'all'],
      });
    }

    return options;
  };

  handleContentTypeChange = (contentType: 'notes' | 'highlights' | 'all') => {
    this.setState({ selectedContentType: contentType });
  };

  handleFormatChange = (format: 'flomo' | 'anki' | 'pdf' | 'csv') => {
    this.setState({ selectedFormat: format });
  };

  handleExport = async () => {
    const { selectedContentType, selectedFormat } = this.state;
    
    this.setState({ isLoading: true });
    
    try {
      const notes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );

      let targetNotes = notes;
      if (selectedContentType === 'notes') {
        targetNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");
      } else if (selectedContentType === 'highlights') {
        targetNotes = notes.filter((note) => !note.notes || note.notes.trim() === "");
      }

      if (targetNotes.length === 0) {
        toast.error(this.props.t("Nothing to export"));
        return;
      }

      switch (selectedFormat) {
        case 'pdf':
          await this.exportToPDF(targetNotes);
          break;
        case 'anki':
          await this.exportToAnki(targetNotes);
          break;
        case 'csv':
          await this.exportToCSV(targetNotes);
          break;
        case 'flomo':
          await this.exportToFlomo(targetNotes);
          break;
        default:
          throw new Error(`Unsupported format: ${selectedFormat}`);
      }

      toast.success(this.props.t("Export successful"));
      this.props.handleUnifiedExportDialog(false);
      this.props.handleActionDialog(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(this.props.t("Export failed"));
    } finally {
      this.setState({ isLoading: false });
    }
  };

  exportToPDF = async (notes: any[]) => {
    const pdfService = PDFExportService.getInstance();
    const { selectedContentType } = this.state;
    
    if (selectedContentType === 'notes') {
      await pdfService.exportNotesToPDF(this.props.currentBook, notes);
    } else if (selectedContentType === 'highlights') {
      await pdfService.exportHighlightsToPDF(this.props.currentBook, notes);
    } else {
      await pdfService.exportAllToPDF(this.props.currentBook, notes);
    }
  };

  exportToAnki = async (notes: any[]) => {
    const ankiService = AnkiExportService.getInstance();
    const { selectedContentType } = this.state;
    
    if (selectedContentType === 'notes') {
      await ankiService.exportNotesToAnki(this.props.currentBook, notes);
    } else if (selectedContentType === 'highlights') {
      await ankiService.exportHighlightsToAnki(this.props.currentBook, notes);
    } else {
      await ankiService.exportAllToAnki(this.props.currentBook, notes);
    }
  };

  exportToCSV = async (notes: any[]) => {
    const books = await DatabaseService.getAllRecords("books");
    const { selectedContentType } = this.state;
    
    if (selectedContentType === 'notes') {
      const actualNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");
      exportNotes(actualNotes, books);
    } else if (selectedContentType === 'highlights') {
      const highlights = notes.filter((note) => !note.notes || note.notes.trim() === "");
      exportHighlights(highlights, books);
    } else {
      // 导出所有内容时，分别导出笔记和高亮
      const actualNotes = notes.filter((note) => note.notes && note.notes.trim() !== "");
      const highlights = notes.filter((note) => !note.notes || note.notes.trim() === "");
      
      if (actualNotes.length > 0) {
        exportNotes(actualNotes, books);
      }
      if (highlights.length > 0) {
        exportHighlights(highlights, books);
      }
    }
  };

  exportToFlomo = async (notes: any[]) => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error(this.props.t("Please configure flomo in settings first"));
      return;
    }

    const { selectedContentType } = this.state;
    
    if (selectedContentType === 'notes') {
      await flomoBulkService.exportNotesToFlomo(this.props.currentBook);
    } else if (selectedContentType === 'highlights') {
      await flomoBulkService.exportHighlightsToFlomo(this.props.currentBook);
    } else {
      await flomoBulkService.exportAllToFlomo(this.props.currentBook);
    }
  };

  // 简化的位置计算，参考"更多操作"的简洁方式
  calculatePosition = () => {
    const { left, top, isExceed } = this.props;

    // 使用与"更多操作"类似的简单定位逻辑
    const calculatedLeft = left + (isExceed ? -340 : 200); // 减少水平距离，从220改为200
    const calculatedTop = top + 70; // 使用与"更多操作"相同的垂直偏移

    return {
      left: calculatedLeft,
      top: calculatedTop,
      width: 400, // 固定宽度，简化计算
      height: 500, // 固定高度，简化计算
    };
  };

  render() {
    const { isShow } = this.props;
    const { selectedContentType, selectedFormat, isLoading } = this.state;

    if (!isShow) {
      return null;
    }

    const contentOptions = this.getContentOptions();
    const formatOptions = this.getFormatOptions();
    const selectedFormatOption = formatOptions.find(f => f.id === selectedFormat);
    const isExportDisabled = isLoading ||
      !contentOptions.find(c => c.id === selectedContentType)?.count ||
      !selectedFormatOption?.supportedTypes.includes(selectedContentType);

    const position = this.calculatePosition();

    return (
      <div
        className="unified-export-dialog-container"
        onMouseLeave={(event) => {
          // 简化的鼠标离开处理，参考"更多操作"的实现
          const relatedTarget = event.relatedTarget as HTMLElement;

          // 检查是否移动到父菜单
          let isMovingToParent = false;
          if (relatedTarget && typeof relatedTarget.closest === 'function') {
            // 检查是否移动到主菜单（但不是其他导出对话框）
            isMovingToParent = !!relatedTarget.closest('.action-dialog-container') &&
              !relatedTarget.closest('.unified-export-dialog-container');
          }

          if (isMovingToParent) {
            // 如果移动到父菜单，不关闭
            return;
          }

          // 添加延迟 - 增加延迟时间提高稳定性
          this.hoverTimeout = setTimeout(() => {
            this.props.handleUnifiedExportDialog(false);
            this.props.handleActionDialog(false);
          }, 300); // 增加到300ms
        }}
        onMouseEnter={() => {
          // Clear our own timeout
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
          }
          // Keep the dialog open by ensuring the state remains true
          this.props.handleUnifiedExportDialog(true);
          this.props.handleActionDialog(true);
        }}
        style={{
          position: "fixed",
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: position.height,
        }}
      >
        <div className="unified-export-dialog-header">
          <h3 className="unified-export-dialog-title">
            <Trans>Export Options</Trans>
          </h3>
          <p className="unified-export-dialog-subtitle">
            {this.props.currentBook.name}
          </p>
        </div>

        <div
          className="unified-export-dialog-content"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={() => {
            // Clear any pending timeouts when user is actively interacting
            if (this.hoverTimeout) {
              clearTimeout(this.hoverTimeout);
              this.hoverTimeout = null;
            }
          }}
        >
          {/* 内容类型选择 */}
          <div className="unified-export-section">
            <h4 className="unified-export-section-title">
              <Trans>Content Type</Trans>
            </h4>
            <div className="unified-export-options">
              {contentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`unified-export-option ${
                    selectedContentType === option.id ? 'selected' : ''
                  } ${option.disabled ? 'disabled' : ''}`}
                  onClick={() => !option.disabled && this.handleContentTypeChange(option.id as any)}
                >
                  <span className={`unified-export-option-icon ${option.icon}`}></span>
                  <div className="unified-export-option-content">
                    <p className="unified-export-option-name">{option.name}</p>
                    <p className="unified-export-option-description">{option.description}</p>
                  </div>
                  <span className="unified-export-option-count">{option.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 格式选择 */}
          <div className="unified-export-section">
            <h4 className="unified-export-section-title">
              <Trans>Export Format</Trans>
            </h4>
            <div className="unified-export-options">
              {formatOptions.map((option) => (
                <div
                  key={option.id}
                  className={`unified-export-option ${
                    selectedFormat === option.id ? 'selected' : ''
                  } ${!option.supportedTypes.includes(selectedContentType) ? 'disabled' : ''}`}
                  onClick={() => 
                    option.supportedTypes.includes(selectedContentType) && 
                    this.handleFormatChange(option.id as any)
                  }
                >
                  <span className={`unified-export-option-icon ${option.icon}`}></span>
                  <div className="unified-export-option-content">
                    <p className="unified-export-option-name">{option.name}</p>
                    <p className="unified-export-option-description">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="unified-export-actions"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={() => {
            // Clear any pending timeouts when user is interacting with buttons
            if (this.hoverTimeout) {
              clearTimeout(this.hoverTimeout);
              this.hoverTimeout = null;
            }
          }}
        >
          <button
            className="unified-export-button unified-export-button-cancel"
            onClick={() => {
              this.props.handleUnifiedExportDialog(false);
              this.props.handleActionDialog(false);
            }}
          >
            <Trans>Cancel</Trans>
          </button>
          <button
            className="unified-export-button unified-export-button-export"
            onClick={this.handleExport}
            disabled={isExportDisabled}
          >
            {isLoading ? (
              <div className="unified-export-loading-spinner"></div>
            ) : (
              <Trans>Export</Trans>
            )}
          </button>
        </div>
      </div>
    );
  }
}

export default UnifiedExportDialog;

import React from "react";
import "./flomoExportAction.css";
import { Trans } from "react-i18next";
import { FlomoExportActionProps, FlomoExportActionState } from "./interface";
import FlomoBulkExportService from "../../../utils/service/flomoBulkExportService";
import toast from "react-hot-toast";

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

  render() {
    const { stats } = this.state;
    
    return (
      <div
        className="flomo-export-action-container"
        onMouseLeave={() => {
          // Add delay before hiding to improve stability
          this.hoverTimeout = setTimeout(() => {
            this.props.handleFlomoExportAction(false);
            this.props.handleActionDialog(false);
          }, 200);
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
        </div>
      </div>
    );
  }
}

export default FlomoExportAction;

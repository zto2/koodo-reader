import React from "react";
import "./exportSubmenu.css";
import { Trans } from "react-i18next";
import { ExportSubmenuProps, ExportSubmenuState } from "./interface";
import toast from "react-hot-toast";
import {
  exportNotes,
  exportHighlights,
  exportAllToCSV,
} from "../../../utils/file/export";
import {
  exportNotesToAnki,
  exportHighlightsToAnki,
  exportAllToAnki,
} from "../../../utils/file/ankiExport";
import DatabaseService from "../../../utils/storage/databaseService";

class ExportSubmenu extends React.Component<ExportSubmenuProps, ExportSubmenuState> {
  private submenuRef: React.RefObject<HTMLDivElement>;

  constructor(props: ExportSubmenuProps) {
    super(props);
    this.state = {
      isHovered: false,
    };
    this.submenuRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener("click", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    if (
      this.submenuRef.current &&
      !this.submenuRef.current.contains(event.target as Node)
    ) {
      this.props.onClose();
    }
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
    // 延迟关闭，给用户时间移动鼠标
    setTimeout(() => {
      if (!this.state.isHovered && this.props.isVisible) {
        this.props.onClose();
      }
    }, 200);
  };

  handleExportAllToCSV = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let allNotes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );

      if (allNotes.length > 0) {
        exportAllToCSV(allNotes, books);
        toast.success(this.props.t("Export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportAllToAnki = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let allNotes = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "notes"
      );

      if (allNotes.length > 0) {
        exportAllToAnki(allNotes, books);
        toast.success(this.props.t("Anki export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportNotesCSV = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let notes = (
        await DatabaseService.getRecordsByBookKey(
          this.props.currentBook.key,
          "notes"
        )
      ).filter((note) => note.notes !== "");
      
      if (notes.length > 0) {
        exportNotes(notes, books);
        toast.success(this.props.t("Export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportNotesToAnki = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let notes = (
        await DatabaseService.getRecordsByBookKey(
          this.props.currentBook.key,
          "notes"
        )
      ).filter((note) => note.notes !== "");
      
      if (notes.length > 0) {
        exportNotesToAnki(notes, books);
        toast.success(this.props.t("Anki export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportHighlightsCSV = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let highlights = (
        await DatabaseService.getRecordsByBookKey(
          this.props.currentBook.key,
          "notes"
        )
      ).filter((note) => note.notes === "");
      
      if (highlights.length > 0) {
        exportHighlights(highlights, books);
        toast.success(this.props.t("Export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportHighlightsToAnki = async () => {
    try {
      let books = await DatabaseService.getAllRecords("books");
      let highlights = (
        await DatabaseService.getRecordsByBookKey(
          this.props.currentBook.key,
          "notes"
        )
      ).filter((note) => note.notes === "");
      
      if (highlights.length > 0) {
        exportHighlightsToAnki(highlights, books);
        toast.success(this.props.t("Anki export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };



  render() {
    if (!this.props.isVisible) {
      return null;
    }

    return (
      <div
        ref={this.submenuRef}
        className="export-submenu-container"
        style={{
          left: this.props.position.x,
          top: this.props.position.y,
        }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div className="export-submenu-arrow"></div>
        
        {/* Notes Section */}
        <div className="export-submenu-section">
          <div className="export-submenu-section-title">
            <Trans>Notes</Trans>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportNotesCSV}>
            <span className="export-submenu-item-name">
              <Trans>Export Notes (CSV)</Trans>
            </span>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportNotesToAnki}>
            <span className="export-submenu-item-name">
              <Trans>Export Notes to Anki</Trans>
            </span>
          </div>
        </div>

        {/* Highlights Section */}
        <div className="export-submenu-section">
          <div className="export-submenu-section-title">
            <Trans>Highlights</Trans>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportHighlightsCSV}>
            <span className="export-submenu-item-name">
              <Trans>Export Highlights (CSV)</Trans>
            </span>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportHighlightsToAnki}>
            <span className="export-submenu-item-name">
              <Trans>Export Highlights to Anki</Trans>
            </span>
          </div>
        </div>

        {/* Combined Export Section */}
        <div className="export-submenu-section">
          <div className="export-submenu-section-title">
            <Trans>Combined Export</Trans>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportAllToCSV}>
            <span className="export-submenu-item-name">
              <Trans>Export All to CSV</Trans>
            </span>
          </div>
          <div className="export-submenu-item" onClick={this.handleExportAllToAnki}>
            <span className="export-submenu-item-name">
              <Trans>Export All to Anki</Trans>
            </span>
          </div>
        </div>


      </div>
    );
  }
}

export default ExportSubmenu;

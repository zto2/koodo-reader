import React from "react";
import "./dictionarySubmenu.css";
import { Trans } from "react-i18next";
import { DictionarySubmenuProps, DictionarySubmenuState } from "./interface";
import toast from "react-hot-toast";
import { exportDictionaryHistory } from "../../../utils/file/export";
import { exportDictionaryHistoryToAnki } from "../../../utils/file/ankiExport";
import DatabaseService from "../../../utils/storage/databaseService";

class DictionarySubmenu extends React.Component<DictionarySubmenuProps, DictionarySubmenuState> {
  private submenuRef: React.RefObject<HTMLDivElement>;

  constructor(props: DictionarySubmenuProps) {
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

  handleExportDictionaryCSV = async () => {
    try {
      let dictHistory = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "words"
      );
      let books = await DatabaseService.getAllRecords("books");
      
      if (dictHistory.length > 0) {
        exportDictionaryHistory(dictHistory, books);
        toast.success(this.props.t("Export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportDictionaryAnki = async () => {
    try {
      let dictHistory = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "words"
      );
      let books = await DatabaseService.getAllRecords("books");
      
      if (dictHistory.length > 0) {
        exportDictionaryHistoryToAnki(dictHistory, books);
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
        className="dictionary-submenu-container"
        style={{
          left: this.props.position.x,
          top: this.props.position.y,
        }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div className="dictionary-submenu-arrow"></div>
        
        <div className="dictionary-submenu-section">
          <div className="dictionary-submenu-section-title">
            <Trans>Dictionary Export</Trans>
          </div>
          <div className="dictionary-submenu-item" onClick={this.handleExportDictionaryCSV}>
            <span className="dictionary-submenu-item-name">
              <Trans>Export Dictionary History (CSV)</Trans>
            </span>
          </div>
          <div className="dictionary-submenu-item" onClick={this.handleExportDictionaryAnki}>
            <span className="dictionary-submenu-item-name">
              <Trans>Export Dictionary History to Anki</Trans>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default DictionarySubmenu;

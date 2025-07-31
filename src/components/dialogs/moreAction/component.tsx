import React from "react";
import "./moreAction.css";
import { Trans } from "react-i18next";
import { MoreActionProps, MoreActionState } from "./interface";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/file/bookUtil";

import {
  BookHelper,
  ConfigService,
} from "../../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../../assets/lib/kookit.min";
import { isElectron } from "react-device-detect";
import { getPdfPassword, getStorageLocation } from "../../../utils/common";
import ExportSubmenu from "../exportSubmenu";
import DictionarySubmenu from "../dictionarySubmenu";
class ActionDialog extends React.Component<MoreActionProps, MoreActionState> {
  constructor(props: MoreActionProps) {
    super(props);
    this.state = {
      isShowExportSubmenu: false,
      isShowDictionarySubmenu: false,
      submenuPosition: { x: 0, y: 0 },
      dictionarySubmenuPosition: { x: 0, y: 0 },
    };
  }

  handleExportSubmenuToggle = (show: boolean, event?: React.MouseEvent) => {
    if (show && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      this.setState({
        isShowExportSubmenu: true,
        submenuPosition: {
          x: rect.right + 5,
          y: rect.top,
        },
      });
    } else {
      this.setState({ isShowExportSubmenu: false });
    }
  };

  handleExportOptionsMouseEnter = (event: React.MouseEvent) => {
    // 关闭其他子菜单
    this.setState({ isShowDictionarySubmenu: false });
    this.handleExportSubmenuToggle(true, event);
  };

  handleExportOptionsMouseLeave = () => {
    // 延迟隐藏，允许用户移动到子菜单
    setTimeout(() => {
      if (!this.state.isShowExportSubmenu) {
        this.handleExportSubmenuToggle(false);
      }
    }, 200);
  };

  handleDictionarySubmenuToggle = (show: boolean, event?: React.MouseEvent) => {
    if (show && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      this.setState({
        isShowDictionarySubmenu: true,
        dictionarySubmenuPosition: {
          x: rect.right + 5,
          y: rect.top,
        },
      });
    } else {
      this.setState({ isShowDictionarySubmenu: false });
    }
  };

  handleDictionaryOptionsMouseEnter = (event: React.MouseEvent) => {
    // 关闭其他子菜单
    this.setState({ isShowExportSubmenu: false });
    this.handleDictionarySubmenuToggle(true, event);
  };

  handleDictionaryOptionsMouseLeave = () => {
    // 延迟隐藏，允许用户移动到子菜单
    setTimeout(() => {
      if (!this.state.isShowDictionarySubmenu) {
        this.handleDictionarySubmenuToggle(false);
      }
    }, 200);
  };

  handleOtherMenuItemMouseEnter = () => {
    // 关闭所有子菜单
    this.setState({
      isShowExportSubmenu: false,
      isShowDictionarySubmenu: false,
    });
  };
  render() {
    return (
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          this.props.handleMoreAction(false);
          this.props.handleActionDialog(false);
        }}
        onMouseEnter={(event) => {
          this.props.handleMoreAction(true);
          this.props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          this.props.isShowExport
            ? {
                position: "fixed",
                left: this.props.left + (this.props.isExceed ? -195 : 195),
                top: this.props.top + 70,
              }
            : { display: "none" }
        }
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={this.handleOtherMenuItemMouseEnter}
            onClick={() => {
              BookUtil.fetchBook(
                this.props.currentBook.key,
                this.props.currentBook.format.toLowerCase(),
                true,
                this.props.currentBook.path
              ).then((result: any) => {
                toast.success(this.props.t("Export successful"));
                saveAs(
                  new Blob([result]),
                  this.props.currentBook.name +
                    `.${this.props.currentBook.format.toLocaleLowerCase()}`
                );
              });
            }}
          >
            <p className="action-name">
              <Trans>Export books</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit export-options-trigger"
            style={{ paddingLeft: "0px", position: "relative" }}
            onMouseEnter={this.handleExportOptionsMouseEnter}
            onMouseLeave={this.handleExportOptionsMouseLeave}
          >
            <p className="action-name">
              <Trans>Export Options</Trans>
              <span className="icon-dropdown submenu-arrow"></span>
            </p>
          </div>
          <div
            className="action-dialog-edit dictionary-options-trigger"
            style={{ paddingLeft: "0px", position: "relative" }}
            onMouseEnter={this.handleDictionaryOptionsMouseEnter}
            onMouseLeave={this.handleDictionaryOptionsMouseLeave}
          >
            <p className="action-name">
              <Trans>Export dictionary history</Trans>
              <span className="icon-dropdown submenu-arrow"></span>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={this.handleOtherMenuItemMouseEnter}
            onClick={() => {
              if (this.props.currentBook.format === "PDF") {
                toast(this.props.t("Not supported yet"));
                return;
              }
              toast(this.props.t("Pre-caching"));
              BookUtil.fetchBook(
                this.props.currentBook.key,
                this.props.currentBook.format.toLowerCase(),
                true,
                this.props.currentBook.path
              ).then(async (result: any) => {
                let rendition = BookHelper.getRendition(
                  result,
                  {
                    format: this.props.currentBook.format,
                    readerMode: "",
                    charset: this.props.currentBook.charset,
                    animation:
                      ConfigService.getReaderConfig("isSliding") === "yes"
                        ? "sliding"
                        : "",
                    convertChinese:
                      ConfigService.getReaderConfig("convertChinese"),
                    parserRegex: "",
                    isDarkMode: "no",
                    isMobile: "no",
                    password: getPdfPassword(this.props.currentBook),
                    isScannedPDF: "no",
                  },
                  Kookit
                );
                let cache = await rendition.preCache(result);
                if (cache !== "err" || cache) {
                  await BookUtil.addBook(
                    "cache-" + this.props.currentBook.key,
                    "zip",
                    cache
                  );
                  toast.success(this.props.t("Pre-caching successful"));
                } else {
                  toast.error(this.props.t("Pre-caching failed"));
                }
              });
            }}
          >
            <p className="action-name">
              <Trans>Pre-cache</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={this.handleOtherMenuItemMouseEnter}
            onClick={async () => {
              await BookUtil.deleteBook(
                "cache-" + this.props.currentBook.key,
                "zip"
              );
              toast.success(this.props.t("Deletion successful"));
            }}
          >
            <p className="action-name">
              <Trans>Delete pre-cache</Trans>
            </p>
          </div>
          {isElectron && (
            <div
              className="action-dialog-edit"
              style={{ paddingLeft: "0px" }}
              onMouseEnter={this.handleOtherMenuItemMouseEnter}
              onClick={async () => {
                if (!this.props.currentBook.path) {
                  toast.error(this.props.t("No path found for this book"));
                  return;
                }
                const fs = window.require("fs");
                const path = window.require("path");
                const bookPath =
                  this.props.currentBook.path ||
                  path.join(
                    getStorageLocation() || "",
                    `book`,
                    this.props.currentBook.key +
                      "." +
                      this.props.currentBook.format.toLowerCase()
                  );
                if (!fs.existsSync(bookPath)) {
                  toast.error(this.props.t("File not found"));
                  return;
                }
                const { ipcRenderer } = window.require("electron");
                ipcRenderer.invoke("open-explorer-folder", {
                  path: bookPath,
                  isFolder: false,
                });
              }}
            >
              <p className="action-name">
                <Trans>Locate in the folder</Trans>
              </p>
            </div>
          )}
        </div>

        {/* Export Submenu */}
        <ExportSubmenu
          currentBook={this.props.currentBook}
          books={this.props.books}
          notes={this.props.notes}
          isVisible={this.state.isShowExportSubmenu}
          position={this.state.submenuPosition}
          onClose={() => this.handleExportSubmenuToggle(false)}
          t={this.props.t}
        />

        {/* Dictionary Submenu */}
        <DictionarySubmenu
          currentBook={this.props.currentBook}
          books={this.props.books}
          isVisible={this.state.isShowDictionarySubmenu}
          position={this.state.dictionarySubmenuPosition}
          onClose={() => this.handleDictionarySubmenuToggle(false)}
          t={this.props.t}
        />
      </div>
    );
  }
}

export default ActionDialog;

import React from "react";
import "./moreAction.css";
import { Trans } from "react-i18next";
import { MoreActionProps, MoreActionState } from "./interface";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/file/bookUtil";
import {
  exportDictionaryHistory,
} from "../../../utils/file/export";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  BookHelper,
  ConfigService,
} from "../../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../../assets/lib/kookit.min";
import { isElectron } from "react-device-detect";
import { getPdfPassword, getStorageLocation } from "../../../utils/common";
class ActionDialog extends React.Component<MoreActionProps, MoreActionState> {
  private hoverTimeout: NodeJS.Timeout | null = null;

  constructor(props: MoreActionProps) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }


  render() {
    return (
      <div
        className="action-dialog-container more-action-container"
        onMouseLeave={(event) => {
          // Check if moving back to parent menu
          const relatedTarget = event.relatedTarget as HTMLElement;

          // Check if relatedTarget is a valid DOM element before calling closest()
          let isMovingToParent = false;
          if (relatedTarget && typeof relatedTarget.closest === 'function') {
            // Check if moving to the main action dialog (but not another more-action-container)
            isMovingToParent = !!relatedTarget.closest('.action-dialog-container') &&
              !relatedTarget.closest('.more-action-container');
          }

          if (isMovingToParent) {
            // Don't hide if moving back to parent
            return;
          }

          // Add delay for other cases - consistent with export dialog
          this.hoverTimeout = setTimeout(() => {
            this.props.handleMoreAction(false);
            this.props.handleActionDialog(false);
          }, 300);
        }}
        onMouseEnter={(event) => {
          // Clear any existing timeout
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
          }

          this.props.handleMoreAction(true);
          this.props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          this.props.isShowExport
            ? {
                position: "fixed",
                left: this.props.left + (this.props.isExceed ? -195 : 195),
                top: this.props.top + 130, // 使用原始项目的简单定位方式
              }
            : { display: "none" }
        }
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
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
          {/* 保留导出词典历史功能 */}
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
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
            }}
          >
            <p className="action-name">
              <Trans>Export dictionary history</Trans>
            </p>
          </div>

          {/* 笔记和高亮导出功能已移至统一导出，这里不再重复 */}
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
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

                const { shell } = window.require("electron");
                shell.showItemInFolder(bookPath);
              }}
            >
              <p className="action-name">
                <Trans>Locate in the folder</Trans>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ActionDialog;

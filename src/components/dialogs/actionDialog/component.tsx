import React from "react";
import "./actionDialog.css";
import { Trans } from "react-i18next";
import { ActionDialogProps, ActionDialogState } from "./interface";
import toast from "react-hot-toast";
import MoreAction from "../moreAction";
import FlomoExportAction from "../flomoExportAction";
import UnifiedExportDialog from "../unifiedExportDialog";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import FlomoBulkExportService from "../../../utils/service/flomoBulkExportService";
declare var window: any;
class ActionDialog extends React.Component<
  ActionDialogProps,
  ActionDialogState
> {
  constructor(props: ActionDialogProps) {
    super(props);
    this.state = {
      isShowExport: false, // 恢复更多操作菜单状态
      isShowDetail: false,
      isExceed: false,
      isShowFlomoExport: false,
      isShowUnifiedExport: false,
    };
    this.flomoHoverTimeout = null;
    this.exportHoverTimeout = null;
  }

  private flomoHoverTimeout: NodeJS.Timeout | null = null;
  private exportHoverTimeout: NodeJS.Timeout | null = null;

  componentWillUnmount() {
    if (this.flomoHoverTimeout) {
      clearTimeout(this.flomoHoverTimeout);
    }
    if (this.exportHoverTimeout) {
      clearTimeout(this.exportHoverTimeout);
    }
  }
  handleDeleteBook = () => {
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleDeleteDialog(true);
    this.props.handleActionDialog(false);
  };
  handleEditBook = () => {
    this.props.handleEditDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleDetailBook = () => {
    this.props.handleDetailDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleAddShelf = () => {
    this.props.handleAddDialog(true);
    this.props.handleReadingBook(this.props.currentBook);
    this.props.handleActionDialog(false);
  };
  handleRestoreBook = () => {
    ConfigService.deleteListConfig(this.props.currentBook.key, "deletedBooks");
    this.props.handleActionDialog(false);
    toast.success(this.props.t("Restore successful"));
    this.props.handleFetchBooks();
  };
  handleLoveBook = () => {
    ConfigService.setListConfig(this.props.currentBook.key, "favoriteBooks");
    toast.success(this.props.t("Addition successful"));
    this.props.handleActionDialog(false);
  };
  handleMultiSelect = () => {
    this.props.handleSelectBook(true);
    this.props.handleSelectedBooks([this.props.currentBook.key]);
    this.props.handleActionDialog(false);
  };
  handleCancelLoveBook = () => {
    ConfigService.deleteListConfig(this.props.currentBook.key, "favoriteBooks");
    if (
      Object.keys(ConfigService.getAllListConfig("favoriteBooks")).length ===
        0 &&
      this.props.mode === "favorite"
    ) {
      this.props.history.push("/manager/empty");
    }
    toast.success(this.props.t("Cancellation successful"));
    this.props.handleActionDialog(false);
    this.props.handleFetchBooks();
  };
  handleMoreAction = (isShow: boolean) => {
    this.setState({ isShowExport: isShow });
  };

  handleFlomoExportAction = (isShowFlomoExport: boolean) => {
    this.setState({ isShowFlomoExport });
  };

  handleUnifiedExportAction = (isShowUnifiedExport: boolean) => {
    this.setState({ isShowUnifiedExport });
  };

  handleFlomoExportNotes = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportNotesToFlomo(this.props.currentBook);
  };

  handleFlomoExportHighlights = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportHighlightsToFlomo(this.props.currentBook);
  };

  handleFlomoExportAll = async () => {
    const flomoBulkService = FlomoBulkExportService.getInstance();
    if (!flomoBulkService.canBulkExport()) {
      toast.error("请先在设置中配置 flomo");
      return;
    }
    this.props.handleActionDialog(false);
    await flomoBulkService.exportAllToFlomo(this.props.currentBook);
  };
  render() {
    const moreActionProps = {
      left: this.props.left,
      top: this.props.top,
      isShowExport: this.state.isShowExport,
      isExceed: this.state.isExceed,
      currentBook: this.props.currentBook,
      handleMoreAction: this.handleMoreAction,
      handleActionDialog: this.props.handleActionDialog,
      t: this.props.t,
    };

    const flomoExportActionProps = {
      currentBook: this.props.currentBook,
      left: this.props.left,
      top: this.props.top,
      isShowFlomoExport: this.state.isShowFlomoExport,
      isExceed: this.state.isExceed,
      handleFlomoExportAction: this.handleFlomoExportAction,
      handleActionDialog: this.props.handleActionDialog,
    };

    const unifiedExportDialogProps = {
      currentBook: this.props.currentBook,
      left: this.props.left,
      top: this.props.top,
      isShow: this.state.isShowUnifiedExport,
      isExceed: this.state.isExceed,
      handleUnifiedExportDialog: this.handleUnifiedExportAction,
      handleActionDialog: this.props.handleActionDialog,
      t: this.props.t,
    };
    if (this.props.mode === "trash") {
      return (
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          onMouseEnter={() => {
            this.props.handleActionDialog(true);
          }}
          style={{
            left: this.props.left,
            top: this.props.top,
          }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleRestoreBook();
              }}
            >
              <span className="icon-clockwise view-icon"></span>
              <span className="action-name">
                <Trans>Restore</Trans>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <div
          className="action-dialog-container"
          onMouseLeave={() => {
            this.props.handleActionDialog(false);
          }}
          onMouseEnter={() => {
            this.props.handleActionDialog(true);
          }}
          style={{ left: this.props.left, top: this.props.top }}
        >
          <div className="action-dialog-actions-container">
            <div
              className="action-dialog-add"
              onClick={() => {
                if (
                  ConfigService.getAllListConfig("favoriteBooks").indexOf(
                    this.props.currentBook.key
                  ) > -1
                ) {
                  this.handleCancelLoveBook();
                } else {
                  this.handleLoveBook();
                }
              }}
            >
              <span className="icon-heart view-icon"></span>
              <p className="action-name">
                {ConfigService.getAllListConfig("favoriteBooks").indexOf(
                  this.props.currentBook.key
                ) > -1 ? (
                  <Trans>Remove from favorite</Trans>
                ) : (
                  <Trans>Add to favorite</Trans>
                )}
              </p>
            </div>
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleAddShelf();
              }}
            >
              <span className="icon-bookshelf-line view-icon"></span>
              <p className="action-name">
                <Trans>Add to shelf</Trans>
              </p>
            </div>
            <div
              className="action-dialog-add"
              onClick={() => {
                this.handleMultiSelect();
              }}
            >
              <span className="icon-select view-icon"></span>
              <p className="action-name">
                <Trans>Multiple selection</Trans>
              </p>
            </div>
            <div
              className="action-dialog-delete"
              onClick={() => {
                this.handleDeleteBook();
              }}
            >
              <span className="icon-trash-line view-icon"></span>
              <p className="action-name">
                <Trans>Delete</Trans>
              </p>
            </div>
            <div
              className="action-dialog-edit"
              onClick={() => {
                this.handleEditBook();
              }}
            >
              <span className="icon-edit-line view-icon"></span>
              <p className="action-name">
                <Trans>Edit</Trans>
              </p>
            </div>
            <div
              className="action-dialog-edit"
              onClick={() => {
                this.handleDetailBook();
              }}
            >
              <span
                className="icon-idea-line view-icon"
                style={{ fontSize: "17px" }}
              ></span>
              <p className="action-name" style={{ marginLeft: "12px" }}>
                <Trans>Details</Trans>
              </p>
            </div>
            {ConfigService.getReaderConfig("isEnableFlomo") === "yes" && (
              <div
                className="action-dialog-edit"
                onMouseEnter={(event) => {
                  // Clear any existing timeout
                  if (this.flomoHoverTimeout) {
                    clearTimeout(this.flomoHoverTimeout);
                    this.flomoHoverTimeout = null;
                  }

                  this.setState({ isShowFlomoExport: true });
                  const e = event || window.event;
                  let x = e.clientX;
                  if (x > document.body.clientWidth - 300) {
                    this.setState({ isExceed: true });
                  } else {
                    this.setState({ isExceed: false });
                  }
                }}
                onMouseLeave={(event) => {
                  // Only add delay if not moving to child menu
                  const relatedTarget = event.relatedTarget as HTMLElement;

                  // Check if relatedTarget is a valid DOM element before calling closest()
                  let isMovingToChild = false;
                  if (relatedTarget && typeof relatedTarget.closest === 'function') {
                    isMovingToChild = !!relatedTarget.closest('.flomo-export-action-container');
                  }

                  if (isMovingToChild) {
                    // Don't hide immediately if moving to child menu
                    return;
                  }

                  // Add short delay for other cases
                  this.flomoHoverTimeout = setTimeout(() => {
                    this.setState({ isShowFlomoExport: false });
                  }, 100);
                  event.stopPropagation();
                }}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <p className="action-name" style={{ marginLeft: "0px" }}>
                  <span
                    className="icon-export view-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "12px",
                      marginLeft: "3px",
                      fontSize: "16px",
                      color: "#ff6b35"
                    }}
                  ></span>
                  <Trans>Export to flomo</Trans>
                </p>
                <span
                  className="icon-dropdown icon-export-all"
                  style={{ left: "95px" }}
                ></span>
              </div>
            )}

            {/* 统一导出按钮 */}
            <div
              className="action-dialog-edit"
              onMouseEnter={(event) => {
                // Clear any existing timeout - this is crucial for stability
                if (this.exportHoverTimeout) {
                  clearTimeout(this.exportHoverTimeout);
                  this.exportHoverTimeout = null;
                }

                // 关闭更多操作菜单，避免重叠
                this.setState({
                  isShowUnifiedExport: true,
                  isShowExport: false
                });
                const e = event || window.event;
                let x = e.clientX;
                if (x > document.body.clientWidth - 300) {
                  this.setState({ isExceed: true });
                } else {
                  this.setState({ isExceed: false });
                }
              }}
              onMouseLeave={(event) => {
                // 检查是否移动到子菜单
                const relatedTarget = event.relatedTarget as HTMLElement;
                let isMovingToChild = false;
                if (relatedTarget && typeof relatedTarget.closest === 'function') {
                  isMovingToChild = !!relatedTarget.closest('.unified-export-dialog-container');
                }

                if (isMovingToChild) {
                  // 如果移动到子菜单，不关闭
                  return;
                }

                // 添加延迟关闭 - 增加延迟时间给用户更多时间移动鼠标
                this.exportHoverTimeout = setTimeout(() => {
                  this.setState({ isShowUnifiedExport: false });
                }, 300); // 增加到300ms，与"更多操作"保持一致
                event.stopPropagation();
              }}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <p className="action-name" style={{ marginLeft: "0px" }}>
                <span
                  className="icon-export view-icon"
                  style={{
                    display: "inline-block",
                    marginRight: "12px",
                    marginLeft: "3px",
                    fontSize: "16px",
                    color: "#2196f3"
                  }}
                ></span>
                <Trans>Export</Trans>
              </p>
              <span
                className="icon-dropdown icon-export-all"
                style={{ left: "95px" }}
              ></span>
            </div>

            {/* 恢复更多操作菜单，但只保留非导出功能 */}
            <div
              className="action-dialog-edit"
              onMouseEnter={(event) => {
                // Clear any existing timeout
                if (this.exportHoverTimeout) {
                  clearTimeout(this.exportHoverTimeout);
                  this.exportHoverTimeout = null;
                }

                // 关闭统一导出对话框，避免重叠
                this.setState({
                  isShowExport: true,
                  isShowUnifiedExport: false
                });
                const e = event || window.event;
                let x = e.clientX;
                if (x > document.body.clientWidth - 300) {
                  this.setState({ isExceed: true });
                } else {
                  this.setState({ isExceed: false });
                }
              }}
              onMouseLeave={(event) => {
                // Only add delay if not moving to child menu
                const relatedTarget = event.relatedTarget as HTMLElement;

                // Check if relatedTarget is a valid DOM element before calling closest()
                let isMovingToChild = false;
                if (relatedTarget && typeof relatedTarget.closest === 'function') {
                  // Check if moving to the MoreAction component
                  isMovingToChild = !!relatedTarget.closest('.more-action-container');
                }

                if (isMovingToChild) {
                  // Don't hide immediately if moving to child menu
                  return;
                }

                // Add delay for other cases - consistent with export button
                this.exportHoverTimeout = setTimeout(() => {
                  this.setState({ isShowExport: false });
                }, 300);
                event.stopPropagation();
              }}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <p className="action-name" style={{ marginLeft: "0px" }}>
                <span
                  className="icon-more view-icon"
                  style={{
                    display: "inline-block",
                    marginRight: "12px",
                    marginLeft: "3px",
                    transform: "rotate(90deg)",
                    fontSize: "12px",
                  }}
                ></span>
                <Trans>More actions</Trans>
              </p>

              <span
                className="icon-dropdown icon-export-all"
                style={{ left: "95px" }}
              ></span>
            </div>
          </div>
        </div>
        <MoreAction {...moreActionProps} />
        <FlomoExportAction {...flomoExportActionProps} />
        <UnifiedExportDialog {...unifiedExportDialogProps} />
      </>
    );
  }
}

export default ActionDialog;

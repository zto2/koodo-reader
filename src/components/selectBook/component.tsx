import React from "react";
import BookModel from "../../models/Book";
import "./selectBook.css";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
import {
  exportBooks,
} from "../../utils/file/export";
import BookUtil from "../../utils/file/bookUtil";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import { preCacheAllBooks } from "../../utils/common";
import ExportSubmenu from "../dialogs/exportSubmenu";
import DictionarySubmenu from "../dialogs/dictionarySubmenu";
class SelectBook extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = {
      isOpenDelete: false,
      isShowExport: false,
      favoriteBooks: Object.keys(
        ConfigService.getAllListConfig("favoriteBooks")
      ).length,
      isShowExportSubmenu: false,
      isShowDictionarySubmenu: false,
      submenuPosition: { x: 0, y: 0 },
      dictionarySubmenuPosition: { x: 0, y: 0 },
    };
  }
  handleFilterShelfBook = (items: BookModel[]) => {
    if (this.props.shelfTitle) {
      let currentShelfTitle = this.props.shelfTitle;
      if (!currentShelfTitle) return items;
      let currentShelfList = ConfigService.getMapConfig(
        currentShelfTitle,
        "shelfList"
      );
      let shelfItems = items.filter((item: BookModel) => {
        return currentShelfList.indexOf(item.key) > -1;
      });
      return shelfItems;
    } else {
      if (ConfigService.getReaderConfig("isHideShelfBook") === "yes") {
        return items.filter((item) => {
          return (
            ConfigService.getFromAllMapConfig(item.key, "shelfList").length ===
            0
          );
        });
      }
      return items;
    }
  };
  handleShelf(items: any, index: number) {
    if (index < 1) return items;
    let shelfTitle = Object.keys(ConfigService.getAllMapConfig("shelfList"));
    let currentShelfTitle = shelfTitle[index];
    if (!currentShelfTitle) return items;
    let currentShelfList = ConfigService.getMapConfig(
      currentShelfTitle,
      "shelfList"
    );
    let shelfItems = items.filter((item: { key: number }) => {
      return currentShelfList.indexOf(item.key) > -1;
    });
    return shelfItems;
  }

  // 子菜单处理方法
  handleExportSubmenuToggle = (show: boolean, event?: React.MouseEvent) => {
    if (show && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const submenuHeight = 300; // 预估子菜单高度
      const windowHeight = window.innerHeight;
      const margin = 20; // 边距

      // 智能定位：如果是底部菜单且会被截断，则向上偏移
      const spaceBelow = windowHeight - rect.bottom;
      const shouldPositionAbove = spaceBelow < submenuHeight + margin;

      let yPosition: number;
      if (shouldPositionAbove) {
        // 向上显示，确保不超出屏幕顶部
        yPosition = Math.max(margin, rect.top - submenuHeight + rect.height);
      } else {
        // 向下显示
        yPosition = rect.top;
      }

      this.setState({
        isShowExportSubmenu: true,
        submenuPosition: {
          x: rect.right - 25, // 调整水平间距以匹配单个书籍菜单的视觉效果
          y: yPosition,
        },
      });
    } else {
      this.setState({ isShowExportSubmenu: false });
    }
  };

  handleDictionarySubmenuToggle = (show: boolean, event?: React.MouseEvent) => {
    if (show && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const submenuHeight = 150; // 预估词典子菜单高度
      const windowHeight = window.innerHeight;
      const margin = 20; // 边距

      // 智能定位：如果是底部菜单且会被截断，则向上偏移
      const spaceBelow = windowHeight - rect.bottom;
      const shouldPositionAbove = spaceBelow < submenuHeight + margin;

      let yPosition: number;
      if (shouldPositionAbove) {
        // 向上显示，确保不超出屏幕顶部
        yPosition = Math.max(margin, rect.top - submenuHeight + rect.height);
      } else {
        // 向下显示
        yPosition = rect.top;
      }

      this.setState({
        isShowDictionarySubmenu: true,
        dictionarySubmenuPosition: {
          x: rect.right - 25, // 调整水平间距以匹配单个书籍菜单的视觉效果
          y: yPosition + 35,  //悬浮窗向下偏移35px，即调整"export dictionary history"
        },
      });
    } else {
      this.setState({ isShowDictionarySubmenu: false });
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
        className="booklist-manage-container"
        style={this.props.isCollapsed ? { left: "75px" } : {}}
      >
        {this.props.isSelectBook && (
          <>
            <span
              onClick={() => {
                this.props.handleSelectBook(!this.props.isSelectBook);
                if (this.props.isSelectBook) {
                  this.props.handleSelectedBooks([]);
                }
              }}
              className="book-manage-title"
              style={{ color: "rgb(231, 69, 69)" }}
            >
              <Trans>Cancel</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                if (
                  this.props.books.filter(
                    (item: BookModel) =>
                      this.props.selectedBooks.indexOf(item.key) > -1
                  ).length > 0
                ) {
                  ConfigService.setAllListConfig(
                    this.props.books
                      .filter(
                        (item: BookModel) =>
                          this.props.selectedBooks.indexOf(item.key) > -1
                      )
                      .map((item: BookModel) => item.key),
                    "favoriteBooks"
                  );
                  this.props.handleSelectBook(!this.props.isSelectBook);
                  if (this.props.isSelectBook) {
                    this.props.handleSelectedBooks([]);
                  }
                  toast.success(this.props.t("Add successful"));
                } else {
                  toast(this.props.t("Nothing to add"));
                }
              }}
            >
              <Trans>Add to favorite</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleAddDialog(true);
              }}
            >
              <Trans>Add to shelf</Trans>
            </span>
            <span
              className="book-manage-title"
              onClick={() => {
                this.props.handleDeleteDialog(true);
              }}
            >
              <Trans>Delete</Trans>
            </span>
            <div className="select-more-actions-container">
              <span
                className="book-manage-title"
                onMouseEnter={() => {
                  this.setState({ isShowExport: true });
                }}
                onMouseLeave={(event) => {
                  this.setState({ isShowExport: false });
                  event.stopPropagation();
                }}
              >
                <Trans>More actions</Trans>
              </span>

              <div
                className="select-more-actions"
                style={this.state.isShowExport ? {} : { display: "none" }}
                onMouseLeave={(event) => {
                  const related = (event.relatedTarget as Element) || null;
                  const goingIntoSubmenu =
                    related instanceof Element &&
                    (related.closest('.export-submenu-container') ||
                      related.closest('.dictionary-submenu-container'));
                  if (!goingIntoSubmenu) {
                    this.setState({
                      isShowExport: false,
                      isShowExportSubmenu: false,
                      isShowDictionarySubmenu: false,
                    });
                  }
                }}
                onMouseEnter={(event) => {
                  this.setState({ isShowExport: true });
                  event?.stopPropagation();
                }}
              >
                <span
                  className="book-manage-title select-book-action"
                  onClick={async () => {
                    let books = await DatabaseService.getRecordsByBookKeys(
                      this.props.selectedBooks,
                      "books"
                    );
                    if (books.length > 0) {
                      await exportBooks(books);
                      toast.success(this.props.t("Export successful"));
                    } else {
                      toast(this.props.t("Nothing to export"));
                    }
                  }}
                  onMouseEnter={this.handleOtherMenuItemMouseEnter}
                >
                  <Trans>Export books</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action export-options-trigger"
                  style={{ position: "relative" }}
                  onMouseEnter={this.handleExportOptionsMouseEnter}
                  onMouseLeave={this.handleExportOptionsMouseLeave}
                >
                  <Trans>Export Options</Trans>
                  <span className="icon-dropdown submenu-arrow"></span>
                </span>
                <span
                  className="book-manage-title select-book-action dictionary-options-trigger" 
                  // className中的多个类名分别对应不同的CSS样式:
                  // - book-manage-title: 基础菜单项样式
                  // - select-book-action: 选择书籍操作的通用样式
                  // - dictionary-options-trigger: 触发词典子菜单的特定样式
                  // 要调整悬浮窗位置，可以修改handleDictionarySubmenuToggle方法中的y坐标计算:
                  // 比如 y: rect.top + 20 来向下偏移20px
                  style={{ position: "relative" }}
                  onMouseEnter={this.handleDictionaryOptionsMouseEnter}
                  onMouseLeave={this.handleDictionaryOptionsMouseLeave}
                >
                  <Trans>Export dictionary history</Trans>
                  <span className="icon-dropdown submenu-arrow"></span>
                </span>
                <span
                  className="book-manage-title select-book-action"
                  onClick={async () => {
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    if (selectedBooks.length > 0) {
                      await preCacheAllBooks(selectedBooks);
                      toast.success(this.props.t("Pre-caching successful"));
                    } else {
                      toast(this.props.t("Nothing to precache"));
                    }
                  }}
                  onMouseEnter={this.handleOtherMenuItemMouseEnter}
                >
                  <Trans>Pre-cache</Trans>
                </span>
                <span
                  className="book-manage-title select-book-action"
                  onClick={async () => {
                    let selectedBooks =
                      await DatabaseService.getRecordsByBookKeys(
                        this.props.selectedBooks,
                        "books"
                      );
                    if (selectedBooks.length === 0) {
                      toast(this.props.t("Nothing to delete"));
                      return;
                    }
                    for (let index = 0; index < selectedBooks.length; index++) {
                      const selectedBook = selectedBooks[index];
                      await BookUtil.deleteBook(
                        "cache-" + selectedBook.key,
                        "zip"
                      );
                      toast.success(this.props.t("Deletion successful"));
                    }
                  }}
                  onMouseEnter={this.handleOtherMenuItemMouseEnter}
                >
                  <Trans>Delete pre-cache</Trans>
                </span>
              </div>
            </div>

            <span
              className="book-manage-title select-book-action"
              onClick={() => {
                if (
                  this.props.selectedBooks.length ===
                  this.handleFilterShelfBook(this.props.books).length
                ) {
                  this.props.handleSelectedBooks([]);
                } else {
                  this.props.handleSelectedBooks(
                    this.handleFilterShelfBook(this.props.books).map(
                      (item) => item.key
                    )
                  );
                }
              }}
            >
              {this.props.selectedBooks.length ===
              this.handleFilterShelfBook(this.props.books).length ? (
                <Trans>Deselect all</Trans>
              ) : (
                <Trans>Select all</Trans>
              )}
            </span>
          </>
        )}

        {/* Export Submenu */}
        <ExportSubmenu
          currentBook={this.props.books[0] || {} as any}
          books={this.props.books}
          notes={this.props.notes}
          isVisible={this.state.isShowExportSubmenu}
          position={this.state.submenuPosition}
          onClose={() => this.handleExportSubmenuToggle(false)}
          t={this.props.t}
        />

        {/* Dictionary Submenu */}
        <DictionarySubmenu
          currentBook={this.props.books[0] || {} as any}
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

export default withRouter(SelectBook as any);

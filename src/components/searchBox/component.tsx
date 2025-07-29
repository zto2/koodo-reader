import React from "react";
import "./searchBox.css";
import { SearchBoxProps, SearchBoxState } from "./interface";
import {
  ConfigService,
  SearchUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import { EnhancedSearchUtil } from "../../utils/search/enhancedSearchUtil";

class SearchBox extends React.Component<SearchBoxProps, SearchBoxState> {
  constructor(props: SearchBoxProps) {
    super(props);
    this.state = {
      isFocused: false,
    };
  }
  componentDidMount() {
    if (this.props.isNavSearch) {
      let searchBox: any = document.querySelector(".header-search-box");
      searchBox && searchBox.focus();
    }
  }
  handleMouse = () => {
    let value = (this.refs.searchBox as any).value;
    if (this.props.isNavSearch) {
      value && this.search(value);
    }
    this.setState({ isFocused: false });
    if (this.props.mode === "nav") {
      this.props.handleNavSearchState("searching");
    }
    let results;

    if (this.props.tabMode === "knowledge") {
      // 知识库模式使用增强搜索
      const searchResults = EnhancedSearchUtil.search(value, this.props.notes, this.props.books, {
        includeNotes: true,
        includeTags: true,
        includeBooks: true,
        maxResults: 50
      });

      // 转换为原有格式的索引数组
      results = searchResults
        .filter(result => result.type === 'note')
        .map(result => {
          const noteIndex = this.props.notes.findIndex(note => note.key === (result.item as any).key);
          return noteIndex;
        })
        .filter(index => index !== -1);
    } else {
      results = this.props.tabMode === "note"
        ? SearchUtil.mouseNoteSearch(
            this.props.notes.filter((item) => item.notes !== "")
          )
        : this.props.tabMode === "digest"
        ? SearchUtil.mouseNoteSearch(
            this.props.notes.filter((item) => item.notes === "")
          )
        : SearchUtil.mouseSearch(this.props.books);
    }
    if (results) {
      this.props.handleSearchResults(results);
      this.props.handleSearch(true);
    }
  };
  handleKey = (event: any) => {
    if (event.keyCode !== 13) {
      return;
    }
    let value = (this.refs.searchBox as any).value;
    if (this.props.isNavSearch || this.props.isReading) {
      value && this.search(value);
    }
    this.setState({ isFocused: false });
    let results;

    if (this.props.tabMode === "knowledge") {
      // 知识库模式使用增强搜索
      const searchResults = EnhancedSearchUtil.search(value, this.props.notes, this.props.books, {
        includeNotes: true,
        includeTags: true,
        includeBooks: true,
        maxResults: 50
      });

      // 转换为原有格式的索引数组
      results = searchResults
        .filter(result => result.type === 'note')
        .map(result => {
          const noteIndex = this.props.notes.findIndex(note => note.key === (result.item as any).key);
          return noteIndex;
        })
        .filter(index => index !== -1);
    } else {
      results = this.props.tabMode === "note"
        ? SearchUtil.keyNoteSearch(
            event,
            this.props.notes.filter((item) => item.notes !== "")
          )
        : this.props.tabMode === "digest"
        ? SearchUtil.keyNoteSearch(
            event,
            this.props.notes.filter((item) => item.notes === "")
          )
        : SearchUtil.keySearch(event, this.props.books);
    }
    if (results) {
      this.props.handleSearchResults(results);
      this.props.handleSearch(true);
    }
  };
  search = async (q: string) => {
    this.props.handleNavSearchState("searching");
    let searchList = await this.props.htmlBook.rendition.doSearch(q);
    this.props.handleNavSearchState("pending");
    this.props.handleSearchList(
      searchList.map((item: any) => {
        item.excerpt = item.excerpt.replace(
          q,
          `<span class="content-search-text">${q}</span>`
        );
        return item;
      })
    );
  };

  handleCancel = () => {
    if (this.props.isNavSearch) {
      this.props.handleSearchList(null);
    }
    this.props.handleSearch(false);
    (document.querySelector(".header-search-box") as HTMLInputElement).value =
      "";
  };

  render() {
    return (
      <div style={{ position: "relative" }}>
        <input
          type="text"
          ref="searchBox"
          className="header-search-box"
          onKeyDown={(event) => {
            this.handleKey(event);
          }}
          onFocus={() => {
            this.setState({ isFocused: true });
            this.props.mode === "nav" &&
              this.props.handleNavSearchState("focused");
          }}
          placeholder={
            this.props.isNavSearch || this.props.mode === "nav"
              ? this.props.t("Search in the Book")
              : this.props.tabMode === "knowledge"
              ? this.props.t("Search notes, tags, and books...")
              : this.props.tabMode === "note"
              ? this.props.t("Search my notes")
              : this.props.tabMode === "digest"
              ? this.props.t("Search my highlights")
              : this.props.t("Search my library")
          }
          style={
            this.props.mode === "nav"
              ? {
                  width: this.props.width,
                  height: this.props.height,
                  paddingRight: "30px",
                }
              : {}
          }
          onCompositionStart={() => {
            if (this.props.isNavLocked) {
              return;
            } else {
              ConfigService.setReaderConfig("isTempLocked", "yes");
              ConfigService.setReaderConfig("isNavLocked", "yes");
            }
          }}
          onCompositionEnd={() => {
            if (ConfigService.getReaderConfig("isTempLocked") === "yes") {
              ConfigService.setReaderConfig("isNavLocked", "");
              ConfigService.setReaderConfig("isTempLocked", "");
            }
          }}
        />
        {this.props.isSearch && !this.state.isFocused ? (
          <span
            className="header-search-text"
            onClick={() => {
              this.handleCancel();
            }}
            style={
              this.props.mode === "nav" ? { right: "-9px", top: "14px" } : {}
            }
          >
            <span className="icon-close theme-color-delete"></span>
          </span>
        ) : (
          <span className="header-search-text">
            <span
              className="icon-search header-search-icon"
              onClick={() => {
                this.handleMouse();
              }}
              style={this.props.mode === "nav" ? { right: "5px" } : {}}
            ></span>
          </span>
        )}
      </div>
    );
  }
}

export default SearchBox;

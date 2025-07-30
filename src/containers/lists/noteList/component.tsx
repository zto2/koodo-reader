import React from "react";
import "./noteList.css";
import { NoteListProps, NoteListState } from "./interface";
import CardList from "../cardList";
import NoteTag from "../../../components/noteTag";
import NoteModel from "../../../models/Note";
import Empty from "../../emptyPage";

import { Trans } from "react-i18next";

class NoteList extends React.Component<NoteListProps, NoteListState> {
  constructor(props: NoteListProps) {
    super(props);
    this.state = {
      tag: [],
      currentSelectedBook: "",
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchNotes();
  }
  handleTag = (tag: string[]) => {
    this.setState({ tag });
  };


  handleFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });
    return itemArr;
  };
  filterTag = (notes: NoteModel[]) => {
    let temp: NoteModel[] = [];
    for (let i = 0; i < notes.length; i++) {
      let flag = false;
      for (let j = 0; j < this.state.tag.length; j++) {
        if (notes[i].tag && notes[i].tag.indexOf(this.state.tag[j]) > -1) {
          flag = true;
          break;
        }
      }
      if (flag) {
        temp.push(notes[i]);
      }
    }
    return temp;
  };
  render() {
    // Helper function to filter notes based on mode
    const filterNotesByMode = (notes: any[]) => {
      if (this.props.tabMode === "note") {
        // Show only notes (items with notes content)
        return notes.filter((item) => item.notes !== "");
      } else {
        // Show only highlights (items without notes content)
        return notes.filter((item) => item.notes === "");
      }
    };

    // Apply all filters in sequence
    let filteredNotes = filterNotesByMode(this.props.notes);

    // Apply search filter
    if (this.props.isSearch) {
      filteredNotes = this.handleFilter(filteredNotes, this.props.searchResults);
    }

    // Apply legacy tag filter (for backward compatibility)
    if (this.state.tag.length > 0) {
      filteredNotes = this.filterTag(filteredNotes);
    }



    // Apply book filter
    if (this.state.currentSelectedBook) {
      filteredNotes = filteredNotes.filter(
        (item) => item.bookKey === this.state.currentSelectedBook
      );
    }

    const noteProps = {
      cards: this.props.isSearch
        ? this.handleFilter(
            this.props.notes.filter((item) =>
              this.props.tabMode === "note"
                ? item.notes !== ""
                : item.notes === ""
            ),
            this.props.searchResults
          )
        : this.state.tag.length > 0
        ? this.filterTag(
            this.props.notes.filter((item) =>
              this.props.tabMode === "note"
                ? item.notes !== ""
                : item.notes === ""
            )
          )
        : this.state.currentSelectedBook
        ? this.props.notes
            .filter((item) =>
              this.props.tabMode === "note"
                ? item.notes !== ""
                : item.notes === ""
            )
            .filter((item) => item.bookKey === this.state.currentSelectedBook)
        : this.props.notes.filter((item) =>
            this.props.tabMode === "note"
              ? item.notes !== ""
              : item.notes === ""
          ),
      mode: this.props.tabMode,
    };
    return (
      <div
        className="note-list-container-parent"
        style={
          this.props.isCollapsed
            ? { width: "calc(100vw - 70px)", left: "70px" }
            : {}
        }
      >
        <div className="note-list-header">
          <div className="note-list-header-main">

            <div className="note-tags">
              <NoteTag {...{ handleTag: this.handleTag }} />
            </div>
          </div>

          {/* 右上角筛选器 */}
          {noteProps.cards.length > 0 && (
            <div className="note-list-filter-container">
              <span className="note-list-filter-label">
                <Trans>Filter by book</Trans>
              </span>

              <select
                name=""
                className="lang-setting-dropdown"
                value={this.state.currentSelectedBook}
                onChange={(event) => {
                  this.setState({
                    currentSelectedBook: event.target.value,
                  });
                }}
              >
                {[
                  { value: "", label: this.props.t("Please select") },
                  ...this.props.notes
                    .filter((item) => {
                      if (this.props.tabMode === "note") {
                        return item.notes !== "";
                      } else {
                        return item.notes === "";
                      }
                    })
                    .map((note) => {
                      let book = this.props.books.find(
                        (book) => book.key === note.bookKey
                      );
                      return {
                        label: book?.name || "Unknown book",
                        value: note.bookKey,
                      };
                    })
                    .filter(
                      (item, index, self) =>
                        self.findIndex((t) => t.value === item.value) === index
                    ),
                ].map((item) => (
                  <option
                    value={item.value}
                    key={item.value}
                    className="lang-setting-option"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {noteProps.cards.length === 0 ? (
          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              zIndex: -1,
            }}
          >
            {this.state.tag.length === 0 && <Empty />}
          </div>
        ) : (
          <CardList {...noteProps} />
        )}


      </div>
    );
  }
}

export default NoteList;

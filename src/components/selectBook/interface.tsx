import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];
  notes: NoteModel[];
  shelfTitle: string;
  deletedBooks: BookModel[];
  isSelectBook: boolean;
  isCollapsed: boolean;
  selectedBooks: string[];
  handleAddDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleDeleteDialog: (isShow: boolean) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface BookListState {
  isShowExport: boolean;
  isOpenDelete: boolean;
  favoriteBooks: number;
  isShowExportSubmenu: boolean;
  isShowDictionarySubmenu: boolean;
  submenuPosition: { x: number; y: number };
  dictionarySubmenuPosition: { x: number; y: number };
}

import BookModel from "../../../models/Book";

export interface DictionarySubmenuProps {
  currentBook: BookModel;
  books: BookModel[];
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  t: (title: string) => string;
}

export interface DictionarySubmenuState {
  isHovered: boolean;
}

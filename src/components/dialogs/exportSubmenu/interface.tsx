import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";

export interface ExportSubmenuProps {
  currentBook: BookModel;
  books: BookModel[];
  notes: NoteModel[];
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  t: (title: string) => string;
}

export interface ExportSubmenuState {
  isHovered: boolean;
}

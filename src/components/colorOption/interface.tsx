import BookModel from "../../models/Book";
export interface ColorProps {
  color: number;
  isEdit: boolean;
  currentBook: BookModel;
  handleColor: (color: number) => void;
  handleDigest: () => void;
  inNotePopup?: boolean;
}
export interface ColorStates {
  isLine: boolean;
}

import BookModel from "../../../models/Book";

export interface FlomoExportActionProps {
  currentBook: BookModel;
  left: number;
  top: number;
  isShowFlomoExport: boolean;
  isExceed: boolean;
  handleFlomoExportAction: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
}

export interface FlomoExportActionState {
  stats: {
    notesCount: number;
    highlightsCount: number;
    totalCount: number;
  };
}

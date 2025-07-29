import BookModel from "../../../models/Book";

export interface UnifiedExportDialogProps {
  currentBook: BookModel;
  isShow: boolean;
  left: number;
  top: number;
  isExceed: boolean;
  handleUnifiedExportDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  t: (key: string) => string;
}

export interface UnifiedExportDialogState {
  stats: {
    notesCount: number;
    highlightsCount: number;
    totalCount: number;
  };
  selectedContentType: 'notes' | 'highlights' | 'all';
  selectedFormat: 'flomo' | 'anki' | 'csv' | 'text';
  isLoading: boolean;
}

export interface ExportOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  disabled: boolean;
}

export interface FormatOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  supportedTypes: ('notes' | 'highlights' | 'all')[];
}

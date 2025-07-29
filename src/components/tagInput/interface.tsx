import NoteModel from "../../models/Note";
import { TagInfo } from "../../utils/service/tagService";

export interface TagInputProps {
  notes: NoteModel[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  t: (key: string) => string;
}

export interface TagInputState {
  inputValue: string;
  suggestions: TagInfo[];
  showSuggestions: boolean;
  selectedIndex: number;
  isComposing: boolean;
}

import NoteModel from "../../models/Note";
import { TagInfo, TagHierarchy } from "../../utils/service/tagService";

export interface TagSelectorProps {
  notes: NoteModel[];
  selectedTags?: string[];
  onTagsChange: (tags: string[]) => void;
  t: (key: string) => string;
}

export interface TagSelectorState {
  selectedTags: string[];
  searchQuery: string;
  isExpanded: boolean;
  tagHierarchy: TagHierarchy;
  filteredTags: TagInfo[];
}

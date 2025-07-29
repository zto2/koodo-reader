import NoteModel from "../../models/Note";
import { TagInfo, TagHierarchy } from "../../utils/service/tagService";

export interface TagManagerProps {
  notes: NoteModel[];
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated: () => void;
  t: (key: string) => string;
}

export interface TagManagerState {
  tagHierarchy: TagHierarchy;
  searchQuery: string;
  filteredTags: TagInfo[];
  selectedTag: TagInfo | null;
  isEditing: boolean;
  editingTagName: string;
  isCreating: boolean;
  newTagPath: string;
  showDeleteConfirm: boolean;
  tagToDelete: TagInfo | null;
  sortBy: 'name' | 'count' | 'recent';
  sortOrder: 'asc' | 'desc';
  expandedTags: Set<string>;
  statistics: {
    totalTags: number;
    totalUniqueNotes: number;
    averageTagsPerNote: number;
    mostUsedTags: TagInfo[];
  } | null;
}

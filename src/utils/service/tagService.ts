import NoteModel from "../../models/Note";

export interface TagInfo {
  name: string;
  count: number;
  children?: TagInfo[];
  parent?: string;
  level: number;
  fullPath: string; // 完整路径，如 "读书笔记/技术/前端"
  displayName: string; // 显示名称（最后一级）
  isExpanded?: boolean; // 是否展开子标签
  color?: string; // 标签颜色
}

export interface TagHierarchy {
  [key: string]: TagInfo;
}

export class TagService {
  private static instance: TagService;

  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  /**
   * 从文本中提取标签
   */
  public extractTags(text: string): string[] {
    if (!text) return [];
    
    const tagRegex = /#([^\s#]+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    
    return [...new Set(tags)]; // 去重
  }

  /**
   * 从笔记中提取所有标签
   */
  public extractTagsFromNote(note: NoteModel): string[] {
    const textTags = this.extractTags(note.text || "");
    const noteTags = this.extractTags(note.notes || "");
    
    return [...new Set([...textTags, ...noteTags])];
  }

  /**
   * 解析标签层级结构
   * 例如: "读书/小说/科幻" -> ["读书", "读书/小说", "读书/小说/科幻"]
   */
  public parseTagHierarchy(tag: string): string[] {
    const parts = tag.split('/');
    const hierarchy: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const currentTag = parts.slice(0, i + 1).join('/');
      hierarchy.push(currentTag);
    }
    
    return hierarchy;
  }

  /**
   * 构建标签层级结构
   */
  public buildTagHierarchy(notes: NoteModel[]): TagHierarchy {
    const tagCounts: { [key: string]: number } = {};
    const hierarchy: TagHierarchy = {};
    
    // 统计所有标签的使用次数
    for (const note of notes) {
      const tags = this.extractTagsFromNote(note);
      
      for (const tag of tags) {
        const hierarchyTags = this.parseTagHierarchy(tag);
        
        for (const hierarchyTag of hierarchyTags) {
          tagCounts[hierarchyTag] = (tagCounts[hierarchyTag] || 0) + 1;
        }
      }
    }
    
    // 构建层级结构
    for (const [tagName, count] of Object.entries(tagCounts)) {
      const parts = tagName.split('/');
      const level = parts.length - 1;
      const parent = level > 0 ? parts.slice(0, -1).join('/') : undefined;
      const displayName = parts[parts.length - 1];

      hierarchy[tagName] = {
        name: tagName,
        fullPath: tagName,
        displayName,
        count,
        level,
        parent,
        children: [],
        isExpanded: false
      };
    }
    
    // 建立父子关系
    for (const tagInfo of Object.values(hierarchy)) {
      if (tagInfo.parent && hierarchy[tagInfo.parent]) {
        if (!hierarchy[tagInfo.parent].children) {
          hierarchy[tagInfo.parent].children = [];
        }
        hierarchy[tagInfo.parent].children!.push(tagInfo);
      }
    }
    
    return hierarchy;
  }

  /**
   * 获取根级标签（没有父标签的标签）
   */
  public getRootTags(hierarchy: TagHierarchy): TagInfo[] {
    return Object.values(hierarchy)
      .filter(tag => !tag.parent)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 根据标签过滤笔记
   */
  public filterNotesByTag(notes: NoteModel[], targetTag: string): NoteModel[] {
    return notes.filter(note => {
      const tags = this.extractTagsFromNote(note);
      
      // 检查是否包含目标标签或其子标签
      return tags.some(tag => {
        const hierarchyTags = this.parseTagHierarchy(tag);
        return hierarchyTags.includes(targetTag);
      });
    });
  }

  /**
   * 根据多个标签过滤笔记（AND逻辑）
   */
  public filterNotesByTags(notes: NoteModel[], targetTags: string[]): NoteModel[] {
    if (targetTags.length === 0) return notes;
    
    return notes.filter(note => {
      const noteTags = this.extractTagsFromNote(note);
      const noteHierarchyTags = noteTags.flatMap(tag => this.parseTagHierarchy(tag));
      
      // 所有目标标签都必须存在
      return targetTags.every(targetTag => 
        noteHierarchyTags.includes(targetTag)
      );
    });
  }

  /**
   * 搜索标签
   */
  public searchTags(hierarchy: TagHierarchy, query: string): TagInfo[] {
    const lowerQuery = query.toLowerCase();
    
    return Object.values(hierarchy)
      .filter(tag => tag.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        // 优先显示完全匹配的标签
        const aExact = a.name.toLowerCase() === lowerQuery;
        const bExact = b.name.toLowerCase() === lowerQuery;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // 然后按使用次数排序
        return b.count - a.count;
      });
  }

  /**
   * 获取标签的完整路径
   */
  public getTagPath(tagName: string): string[] {
    return tagName.split('/');
  }

  /**
   * 获取标签的显示名称（最后一级）
   */
  public getTagDisplayName(tagName: string): string {
    const parts = tagName.split('/');
    return parts[parts.length - 1];
  }

  /**
   * 验证标签名称是否有效
   */
  public isValidTagName(tagName: string): boolean {
    // 标签不能为空，不能包含特殊字符
    return tagName.length > 0 && 
           !/[<>:"/\\|?*\s]/.test(tagName) &&
           !tagName.startsWith('#');
  }

  /**
   * 格式化标签为显示用的字符串
   */
  public formatTagForDisplay(tagName: string): string {
    return `#${tagName}`;
  }

  /**
   * 从显示字符串中提取标签名称
   */
  public extractTagFromDisplay(displayTag: string): string {
    return displayTag.startsWith('#') ? displayTag.slice(1) : displayTag;
  }

  /**
   * 获取相关标签（经常一起使用的标签）
   */
  public getRelatedTags(notes: NoteModel[], targetTag: string, limit: number = 10): TagInfo[] {
    const targetNotes = this.filterNotesByTag(notes, targetTag);
    const relatedTagCounts: { [key: string]: number } = {};
    
    for (const note of targetNotes) {
      const tags = this.extractTagsFromNote(note);
      
      for (const tag of tags) {
        const hierarchyTags = this.parseTagHierarchy(tag);
        
        for (const hierarchyTag of hierarchyTags) {
          if (hierarchyTag !== targetTag) {
            relatedTagCounts[hierarchyTag] = (relatedTagCounts[hierarchyTag] || 0) + 1;
          }
        }
      }
    }
    
    return Object.entries(relatedTagCounts)
      .map(([name, count]) => ({
        name,
        count,
        level: name.split('/').length - 1,
        children: []
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 清理文本中的标签（用于显示纯文本）
   */
  public cleanTextFromTags(text: string): string {
    if (!text) return "";
    return text.replace(/#([^\s#]+)/g, '').trim();
  }

  /**
   * 获取标签建议（自动补全）
   */
  public getTagSuggestions(hierarchy: TagHierarchy, input: string, limit: number = 10): TagInfo[] {
    if (!input.trim()) return this.getRootTags(hierarchy).slice(0, limit);

    const lowerInput = input.toLowerCase();
    const suggestions = Object.values(hierarchy)
      .filter(tag => {
        const displayName = tag.displayName.toLowerCase();
        const fullPath = tag.fullPath.toLowerCase();
        return displayName.includes(lowerInput) || fullPath.includes(lowerInput);
      })
      .sort((a, b) => {
        // 优先显示显示名称匹配的
        const aDisplayMatch = a.displayName.toLowerCase().startsWith(lowerInput);
        const bDisplayMatch = b.displayName.toLowerCase().startsWith(lowerInput);

        if (aDisplayMatch && !bDisplayMatch) return -1;
        if (!aDisplayMatch && bDisplayMatch) return 1;

        // 然后按使用次数排序
        return b.count - a.count;
      })
      .slice(0, limit);

    return suggestions;
  }

  /**
   * 创建新标签
   */
  public createTag(tagPath: string): TagInfo {
    const parts = tagPath.split('/');
    const level = parts.length - 1;
    const parent = level > 0 ? parts.slice(0, -1).join('/') : undefined;
    const displayName = parts[parts.length - 1];

    return {
      name: tagPath,
      fullPath: tagPath,
      displayName,
      count: 0,
      level,
      parent,
      children: [],
      isExpanded: false
    };
  }

  /**
   * 验证标签路径是否有效
   */
  public isValidTagPath(tagPath: string): boolean {
    if (!tagPath || tagPath.trim().length === 0) return false;

    const parts = tagPath.split('/');
    return parts.every(part => {
      const trimmed = part.trim();
      return trimmed.length > 0 &&
             !/[<>:"/\\|?*#]/.test(trimmed) &&
             trimmed.length <= 50; // 限制单个标签长度
    }) && parts.length <= 5; // 限制层级深度
  }

  /**
   * 格式化标签路径
   */
  public formatTagPath(tagPath: string): string {
    return tagPath
      .split('/')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .join('/');
  }

  /**
   * 获取标签的所有祖先标签
   */
  public getAncestorTags(tagPath: string): string[] {
    const parts = tagPath.split('/');
    const ancestors: string[] = [];

    for (let i = 0; i < parts.length - 1; i++) {
      ancestors.push(parts.slice(0, i + 1).join('/'));
    }

    return ancestors;
  }

  /**
   * 检查标签是否为另一个标签的子标签
   */
  public isChildTag(childTag: string, parentTag: string): boolean {
    return childTag.startsWith(parentTag + '/');
  }

  /**
   * 获取标签统计信息
   */
  public getTagStatistics(notes: NoteModel[]): {
    totalTags: number;
    totalUniqueNotes: number;
    averageTagsPerNote: number;
    mostUsedTags: TagInfo[];
  } {
    const hierarchy = this.buildTagHierarchy(notes);
    const allTags = Object.values(hierarchy);
    const notesWithTags = notes.filter(note => this.extractTagsFromNote(note).length > 0);

    const totalTagUsages = notes.reduce((sum, note) => {
      return sum + this.extractTagsFromNote(note).length;
    }, 0);

    return {
      totalTags: allTags.length,
      totalUniqueNotes: notesWithTags.length,
      averageTagsPerNote: notesWithTags.length > 0 ? totalTagUsages / notesWithTags.length : 0,
      mostUsedTags: allTags
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
}

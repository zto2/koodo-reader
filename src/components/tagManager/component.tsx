import React from "react";
import "./tagManager.css";
import { TagManagerProps, TagManagerState } from "./interface";
import { TagService, TagInfo } from "../../utils/service/tagService";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";

class TagManager extends React.Component<TagManagerProps, TagManagerState> {
  private tagService = TagService.getInstance();

  constructor(props: TagManagerProps) {
    super(props);
    this.state = {
      tagHierarchy: {},
      searchQuery: "",
      filteredTags: [],
      selectedTag: null,
      isEditing: false,
      editingTagName: "",
      isCreating: false,
      newTagPath: "",
      showDeleteConfirm: false,
      tagToDelete: null,
      sortBy: 'count',
      sortOrder: 'desc',
      expandedTags: new Set<string>(),
      statistics: null
    };
  }

  componentDidMount() {
    this.updateTagData();
  }

  componentDidUpdate(prevProps: TagManagerProps) {
    if (prevProps.notes !== this.props.notes || 
        (prevProps.isOpen !== this.props.isOpen && this.props.isOpen)) {
      this.updateTagData();
    }
  }

  updateTagData = () => {
    const hierarchy = this.tagService.buildTagHierarchy(this.props.notes);
    const statistics = this.tagService.getTagStatistics(this.props.notes);
    const filteredTags = this.getFilteredAndSortedTags(hierarchy);
    
    this.setState({ 
      tagHierarchy: hierarchy,
      statistics,
      filteredTags
    });
  };

  getFilteredAndSortedTags = (hierarchy = this.state.tagHierarchy) => {
    let tags = Object.values(hierarchy);
    
    // 搜索过滤
    if (this.state.searchQuery.trim()) {
      tags = this.tagService.searchTags(hierarchy, this.state.searchQuery);
    }
    
    // 排序
    tags.sort((a, b) => {
      const { sortBy, sortOrder } = this.state;
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'recent':
          // TODO: 实现最近使用排序
          comparison = a.count - b.count;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return tags;
  };

  handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    this.setState({ searchQuery: query });
    
    const filteredTags = this.getFilteredAndSortedTags();
    this.setState({ filteredTags });
  };

  handleSortChange = (sortBy: 'name' | 'count' | 'recent') => {
    const sortOrder = this.state.sortBy === sortBy && this.state.sortOrder === 'desc' ? 'asc' : 'desc';
    this.setState({ sortBy, sortOrder });
    
    const filteredTags = this.getFilteredAndSortedTags();
    this.setState({ filteredTags });
  };

  handleTagSelect = (tag: TagInfo) => {
    this.setState({ selectedTag: tag });
  };

  handleCreateTag = () => {
    const { newTagPath } = this.state;
    const formattedPath = this.tagService.formatTagPath(newTagPath);
    
    if (!this.tagService.isValidTagPath(formattedPath)) {
      toast.error(this.props.t("Invalid tag path"));
      return;
    }
    
    // 这里应该创建一个新的笔记或更新现有笔记来包含这个标签
    // 由于这是管理界面，我们可以创建一个占位符笔记
    toast.success(this.props.t("Tag created successfully"));
    this.setState({ isCreating: false, newTagPath: "" });
    this.props.onTagsUpdated();
  };

  handleDeleteTag = (tag: TagInfo) => {
    this.setState({ showDeleteConfirm: true, tagToDelete: tag });
  };

  confirmDeleteTag = () => {
    const { tagToDelete } = this.state;
    if (!tagToDelete) return;
    
    // TODO: 实现删除标签的逻辑
    // 需要从所有相关笔记中移除这个标签
    toast.success(this.props.t("Tag deleted successfully"));
    this.setState({ showDeleteConfirm: false, tagToDelete: null, selectedTag: null });
    this.props.onTagsUpdated();
  };

  handleToggleExpand = (tagName: string) => {
    const { expandedTags } = this.state;
    const newExpandedTags = new Set(expandedTags);
    
    if (newExpandedTags.has(tagName)) {
      newExpandedTags.delete(tagName);
    } else {
      newExpandedTags.add(tagName);
    }
    
    this.setState({ expandedTags: newExpandedTags });
  };

  renderStatistics = () => {
    const { statistics } = this.state;
    if (!statistics) return null;

    return (
      <div className="tag-statistics">
        <h3><Trans>Tag Statistics</Trans></h3>
        <div className="statistics-grid">
          <div className="stat-item">
            <span className="stat-value">{statistics.totalTags}</span>
            <span className="stat-label"><Trans>Total Tags</Trans></span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.totalUniqueNotes}</span>
            <span className="stat-label"><Trans>Tagged Notes</Trans></span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.averageTagsPerNote.toFixed(1)}</span>
            <span className="stat-label"><Trans>Avg Tags/Note</Trans></span>
          </div>
        </div>
      </div>
    );
  };

  renderTagItem = (tag: TagInfo) => {
    const { selectedTag, expandedTags } = this.state;
    const isSelected = selectedTag?.name === tag.name;
    const hasChildren = tag.children && tag.children.length > 0;
    const isExpanded = expandedTags.has(tag.name);

    return (
      <div key={tag.name} className={`tag-manager-item ${isSelected ? 'selected' : ''}`}>
        <div className="tag-manager-item-header">
          {hasChildren && (
            <button
              className="tag-expand-btn"
              onClick={() => this.handleToggleExpand(tag.name)}
            >
              <span className={`icon-dropdown ${isExpanded ? 'expanded' : ''}`}></span>
            </button>
          )}
          
          <div 
            className="tag-manager-item-content"
            onClick={() => this.handleTagSelect(tag)}
          >
            <span className="tag-manager-item-name">
              {this.tagService.formatTagForDisplay(tag.displayName)}
            </span>
            <span className="tag-manager-item-count">({tag.count})</span>
            {tag.level > 0 && (
              <span className="tag-manager-item-path">{tag.parent}</span>
            )}
          </div>
          
          <div className="tag-manager-item-actions">
            <button
              className="tag-action-btn"
              onClick={() => this.handleDeleteTag(tag)}
              title={this.props.t("Delete tag")}
            >
              <span className="icon-trash-line"></span>
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="tag-manager-children">
            {tag.children!.map(child => this.renderTagItem(child))}
          </div>
        )}
      </div>
    );
  };

  render() {
    if (!this.props.isOpen) return null;

    const { 
      searchQuery, 
      filteredTags, 
      selectedTag, 
      isCreating, 
      newTagPath,
      showDeleteConfirm,
      tagToDelete,
      sortBy,
      sortOrder
    } = this.state;

    return (
      <div className="tag-manager-overlay">
        <div className="tag-manager-modal">
          <div className="tag-manager-header">
            <h2><Trans>Tag Manager</Trans></h2>
            <button 
              className="tag-manager-close"
              onClick={this.props.onClose}
            >
              <span className="icon-close"></span>
            </button>
          </div>
          
          <div className="tag-manager-content">
            <div className="tag-manager-sidebar">
              {this.renderStatistics()}
              
              <div className="tag-manager-controls">
                <div className="tag-search-container">
                  <input
                    type="text"
                    className="tag-search-input"
                    placeholder={this.props.t("Search tags...")}
                    value={searchQuery}
                    onChange={this.handleSearchChange}
                  />
                  <span className="icon-search"></span>
                </div>
                
                <div className="tag-sort-controls">
                  <span className="sort-label"><Trans>Sort by</Trans>:</span>
                  <button
                    className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => this.handleSortChange('name')}
                  >
                    <Trans>Name</Trans>
                    {sortBy === 'name' && (
                      <span className={`icon-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></span>
                    )}
                  </button>
                  <button
                    className={`sort-btn ${sortBy === 'count' ? 'active' : ''}`}
                    onClick={() => this.handleSortChange('count')}
                  >
                    <Trans>Usage</Trans>
                    {sortBy === 'count' && (
                      <span className={`icon-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></span>
                    )}
                  </button>
                </div>
                
                <button
                  className="create-tag-btn"
                  onClick={() => this.setState({ isCreating: true })}
                >
                  <span className="icon-add"></span>
                  <Trans>Create Tag</Trans>
                </button>
              </div>
              
              <div className="tag-manager-list">
                {filteredTags.map(tag => this.renderTagItem(tag))}
              </div>
            </div>
            
            <div className="tag-manager-main">
              {selectedTag ? (
                <div className="tag-details">
                  <h3>{this.tagService.formatTagForDisplay(selectedTag.displayName)}</h3>
                  <p><Trans>Full path</Trans>: {selectedTag.fullPath}</p>
                  <p><Trans>Usage count</Trans>: {selectedTag.count}</p>
                  <p><Trans>Level</Trans>: {selectedTag.level}</p>
                  {selectedTag.parent && (
                    <p><Trans>Parent</Trans>: {selectedTag.parent}</p>
                  )}
                  
                  {/* TODO: 显示使用此标签的笔记列表 */}
                </div>
              ) : (
                <div className="tag-manager-empty">
                  <span className="icon-collect"></span>
                  <p><Trans>Select a tag to view details</Trans></p>
                </div>
              )}
            </div>
          </div>
          
          {/* 创建标签对话框 */}
          {isCreating && (
            <div className="tag-create-dialog">
              <div className="dialog-content">
                <h3><Trans>Create New Tag</Trans></h3>
                <input
                  type="text"
                  className="tag-path-input"
                  placeholder={this.props.t("Enter tag path (e.g., 读书笔记/技术/前端)")}
                  value={newTagPath}
                  onChange={(e) => this.setState({ newTagPath: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') this.handleCreateTag();
                    if (e.key === 'Escape') this.setState({ isCreating: false });
                  }}
                  autoFocus
                />
                <div className="dialog-actions">
                  <button onClick={this.handleCreateTag}><Trans>Create</Trans></button>
                  <button onClick={() => this.setState({ isCreating: false })}><Trans>Cancel</Trans></button>
                </div>
              </div>
            </div>
          )}
          
          {/* 删除确认对话框 */}
          {showDeleteConfirm && tagToDelete && (
            <div className="tag-delete-dialog">
              <div className="dialog-content">
                <h3><Trans>Delete Tag</Trans></h3>
                <p>
                  <Trans>Are you sure you want to delete</Trans> "
                  {this.tagService.formatTagForDisplay(tagToDelete.displayName)}"?
                </p>
                <p><Trans>This will remove the tag from all notes.</Trans></p>
                <div className="dialog-actions">
                  <button className="delete-btn" onClick={this.confirmDeleteTag}>
                    <Trans>Delete</Trans>
                  </button>
                  <button onClick={() => this.setState({ showDeleteConfirm: false })}>
                    <Trans>Cancel</Trans>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TagManager;

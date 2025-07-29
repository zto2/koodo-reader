import React from "react";
import "./tagSelector.css";
import { TagSelectorProps, TagSelectorState } from "./interface";
import { TagService, TagInfo } from "../../utils/service/tagService";
import { Trans } from "react-i18next";

class TagSelector extends React.Component<TagSelectorProps, TagSelectorState> {
  private tagService = TagService.getInstance();

  constructor(props: TagSelectorProps) {
    super(props);
    this.state = {
      selectedTags: props.selectedTags || [],
      searchQuery: "",
      isExpanded: false,
      tagHierarchy: {},
      filteredTags: [],
      suggestions: [],
      showSuggestions: false,
      expandedTags: new Set<string>(),
      isCreatingTag: false,
      newTagInput: ""
    };
  }

  componentDidMount() {
    this.updateTagHierarchy();
  }

  componentDidUpdate(prevProps: TagSelectorProps) {
    if (prevProps.notes !== this.props.notes) {
      this.updateTagHierarchy();
    }
  }

  updateTagHierarchy = () => {
    const hierarchy = this.tagService.buildTagHierarchy(this.props.notes);
    this.setState({ 
      tagHierarchy: hierarchy,
      filteredTags: this.tagService.getRootTags(hierarchy)
    });
  };

  handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    this.setState({ searchQuery: query });

    if (query.trim()) {
      const filteredTags = this.tagService.searchTags(this.state.tagHierarchy, query);
      const suggestions = this.tagService.getTagSuggestions(this.state.tagHierarchy, query);
      this.setState({
        filteredTags,
        suggestions,
        showSuggestions: true
      });
    } else {
      const rootTags = this.tagService.getRootTags(this.state.tagHierarchy);
      this.setState({
        filteredTags: rootTags,
        suggestions: [],
        showSuggestions: false
      });
    }
  };

  handleTagToggle = (tagName: string) => {
    const { selectedTags } = this.state;
    let newSelectedTags: string[];

    if (selectedTags.includes(tagName)) {
      newSelectedTags = selectedTags.filter(tag => tag !== tagName);
    } else {
      newSelectedTags = [...selectedTags, tagName];
    }

    this.setState({ selectedTags: newSelectedTags });
    this.props.onTagsChange(newSelectedTags);
  };

  handleClearAll = () => {
    this.setState({ selectedTags: [] });
    this.props.onTagsChange([]);
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

  handleCreateTag = () => {
    const { newTagInput } = this.state;
    const formattedTag = this.tagService.formatTagPath(newTagInput);

    if (!this.tagService.isValidTagPath(formattedTag)) {
      // TODO: 显示错误提示
      return;
    }

    // 添加到选中标签
    const newSelectedTags = [...this.state.selectedTags, formattedTag];
    this.setState({
      selectedTags: newSelectedTags,
      isCreatingTag: false,
      newTagInput: "",
      searchQuery: ""
    });
    this.props.onTagsChange(newSelectedTags);

    // 重新构建层级结构以包含新标签
    this.updateTagHierarchy();
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const { searchQuery, suggestions } = this.state;

      if (suggestions.length > 0) {
        // 选择第一个建议
        this.handleTagToggle(suggestions[0].name);
      } else if (searchQuery.trim()) {
        // 创建新标签
        const formattedTag = this.tagService.formatTagPath(searchQuery);
        if (this.tagService.isValidTagPath(formattedTag)) {
          this.handleTagToggle(formattedTag);
        }
      }

      this.setState({ searchQuery: "", showSuggestions: false });
    } else if (event.key === 'Escape') {
      this.setState({
        searchQuery: "",
        showSuggestions: false,
        isCreatingTag: false
      });
    }
  };

  renderTagItem = (tagInfo: TagInfo, isChild: boolean = false) => {
    const { selectedTags, expandedTags } = this.state;
    const isSelected = selectedTags.includes(tagInfo.name);
    const hasChildren = tagInfo.children && tagInfo.children.length > 0;
    const isExpanded = expandedTags.has(tagInfo.name);

    return (
      <div key={tagInfo.name} className={`tag-item ${isChild ? 'tag-item-child' : ''}`}>
        <div className={`tag-button ${isSelected ? 'tag-button-selected' : ''}`}>
          {hasChildren && (
            <button
              className="tag-expand-button"
              onClick={(e) => {
                e.stopPropagation();
                this.handleToggleExpand(tagInfo.name);
              }}
            >
              <span className={`icon-dropdown ${isExpanded ? 'expanded' : ''}`}></span>
            </button>
          )}

          <div
            className="tag-content"
            onClick={() => this.handleTagToggle(tagInfo.name)}
          >
            <span className="tag-name">
              {this.tagService.formatTagForDisplay(tagInfo.displayName)}
            </span>
            <span className="tag-count">({tagInfo.count})</span>
          </div>

          {tagInfo.level > 0 && (
            <span className="tag-path" title={tagInfo.fullPath}>
              {tagInfo.parent}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="tag-children">
            {tagInfo.children!.map(child => this.renderTagItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  renderSuggestions = () => {
    const { suggestions, showSuggestions, searchQuery } = this.state;

    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <div className="tag-suggestions">
        <div className="tag-suggestions-header">
          <span className="tag-suggestions-title">建议标签</span>
        </div>
        <div className="tag-suggestions-list">
          {suggestions.map(suggestion => (
            <div
              key={suggestion.name}
              className="tag-suggestion-item"
              onClick={() => {
                this.handleTagToggle(suggestion.name);
                this.setState({ searchQuery: "", showSuggestions: false });
              }}
            >
              <span className="tag-suggestion-name">
                {this.tagService.formatTagForDisplay(suggestion.displayName)}
              </span>
              {suggestion.level > 0 && (
                <span className="tag-suggestion-path">{suggestion.parent}</span>
              )}
              <span className="tag-suggestion-count">({suggestion.count})</span>
            </div>
          ))}

          {searchQuery.trim() && this.tagService.isValidTagPath(searchQuery) && (
            <div
              className="tag-suggestion-item tag-suggestion-create"
              onClick={() => {
                const formattedTag = this.tagService.formatTagPath(searchQuery);
                this.handleTagToggle(formattedTag);
                this.setState({ searchQuery: "", showSuggestions: false });
              }}
            >
              <span className="tag-suggestion-name">
                创建: {this.tagService.formatTagForDisplay(searchQuery)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { selectedTags, searchQuery, isExpanded, filteredTags, showSuggestions } = this.state;

    return (
      <div className="tag-selector">
        <div className="tag-selector-header">
          <div className="tag-search-container">
            <input
              type="text"
              className="tag-search-input"
              placeholder={this.props.t("Search or create tags... (e.g., #读书笔记/技术/前端)")}
              value={searchQuery}
              onChange={this.handleSearchChange}
              onKeyDown={this.handleKeyDown}
              onFocus={() => this.setState({ isExpanded: true })}
              onBlur={() => {
                // 延迟隐藏建议，以便点击建议项
                setTimeout(() => {
                  this.setState({ showSuggestions: false });
                }, 200);
              }}
            />
            <span className="icon-search tag-search-icon"></span>

            {showSuggestions && this.renderSuggestions()}
          </div>

          {selectedTags.length > 0 && (
            <button
              className="tag-clear-button"
              onClick={this.handleClearAll}
              title={this.props.t("Clear all tags")}
            >
              <span className="icon-close"></span>
            </button>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="selected-tags-container">
            <div className="selected-tags-label">
              <Trans>Selected tags</Trans>:
            </div>
            <div className="selected-tags">
              {selectedTags.map(tagName => (
                <div key={tagName} className="selected-tag">
                  <span className="selected-tag-name">
                    {this.tagService.formatTagForDisplay(tagName)}
                  </span>
                  <button
                    className="selected-tag-remove"
                    onClick={() => this.handleTagToggle(tagName)}
                  >
                    <span className="icon-close"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isExpanded || selectedTags.length > 0) && (
          <div className="tag-list-container">
            <div className="tag-list-header">
              <span className="tag-list-title">
                <Trans>Available tags</Trans>
              </span>
              <button
                className="tag-list-collapse"
                onClick={() => this.setState({ isExpanded: !isExpanded })}
              >
                <span className={`icon-dropdown ${isExpanded ? 'expanded' : ''}`}></span>
              </button>
            </div>
            
            {isExpanded && (
              <div className="tag-list">
                {filteredTags.length > 0 ? (
                  filteredTags.map(tagInfo => this.renderTagItem(tagInfo))
                ) : (
                  <div className="tag-list-empty">
                    <Trans>No tags found</Trans>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default TagSelector;

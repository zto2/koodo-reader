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
      filteredTags: []
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
      this.setState({ filteredTags });
    } else {
      const rootTags = this.tagService.getRootTags(this.state.tagHierarchy);
      this.setState({ filteredTags: rootTags });
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

  renderTagItem = (tagInfo: TagInfo, isChild: boolean = false) => {
    const { selectedTags } = this.state;
    const isSelected = selectedTags.includes(tagInfo.name);
    const displayName = this.tagService.getTagDisplayName(tagInfo.name);

    return (
      <div key={tagInfo.name} className={`tag-item ${isChild ? 'tag-item-child' : ''}`}>
        <div
          className={`tag-button ${isSelected ? 'tag-button-selected' : ''}`}
          onClick={() => this.handleTagToggle(tagInfo.name)}
        >
          <span className="tag-name">
            {this.tagService.formatTagForDisplay(displayName)}
          </span>
          <span className="tag-count">({tagInfo.count})</span>
        </div>
        
        {tagInfo.children && tagInfo.children.length > 0 && (
          <div className="tag-children">
            {tagInfo.children.map(child => this.renderTagItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { selectedTags, searchQuery, isExpanded, filteredTags } = this.state;

    return (
      <div className="tag-selector">
        <div className="tag-selector-header">
          <div className="tag-search-container">
            <input
              type="text"
              className="tag-search-input"
              placeholder={this.props.t("Search tags...")}
              value={searchQuery}
              onChange={this.handleSearchChange}
              onFocus={() => this.setState({ isExpanded: true })}
            />
            <span className="icon-search tag-search-icon"></span>
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

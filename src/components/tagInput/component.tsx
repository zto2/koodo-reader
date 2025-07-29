import React from "react";
import "./tagInput.css";
import { TagInputProps, TagInputState } from "./interface";
import { TagService } from "../../utils/service/tagService";
import { Trans } from "react-i18next";

class TagInput extends React.Component<TagInputProps, TagInputState> {
  private tagService = TagService.getInstance();
  private inputRef = React.createRef<HTMLInputElement>();

  constructor(props: TagInputProps) {
    super(props);
    this.state = {
      inputValue: "",
      suggestions: [],
      showSuggestions: false,
      selectedIndex: -1,
      isComposing: false
    };
  }

  componentDidMount() {
    this.updateSuggestions("");
  }

  componentDidUpdate(prevProps: TagInputProps) {
    if (prevProps.notes !== this.props.notes) {
      this.updateSuggestions(this.state.inputValue);
    }
  }

  updateSuggestions = (input: string) => {
    const hierarchy = this.tagService.buildTagHierarchy(this.props.notes);
    const suggestions = this.tagService.getTagSuggestions(hierarchy, input, 10);
    
    // 过滤掉已选择的标签
    const filteredSuggestions = suggestions.filter(
      suggestion => !this.props.selectedTags.includes(suggestion.name)
    );
    
    this.setState({ 
      suggestions: filteredSuggestions,
      selectedIndex: -1
    });
  };

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.state.isComposing) return;
    
    const value = event.target.value;
    this.setState({ inputValue: value });
    this.updateSuggestions(value);
    
    // 检查是否输入了完整的标签（以空格或逗号结尾）
    if (value.endsWith(' ') || value.endsWith(',')) {
      const tagText = value.slice(0, -1).trim();
      if (tagText) {
        this.addTag(tagText);
      }
    }
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { suggestions, selectedIndex, inputValue } = this.state;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.setState({
          selectedIndex: selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0,
          showSuggestions: true
        });
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.setState({
          selectedIndex: selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1,
          showSuggestions: true
        });
        break;
        
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          this.addTag(suggestions[selectedIndex].name);
        } else if (inputValue.trim()) {
          this.addTag(inputValue.trim());
        }
        break;
        
      case 'Escape':
        this.setState({ 
          showSuggestions: false, 
          selectedIndex: -1 
        });
        break;
        
      case 'Backspace':
        if (!inputValue && this.props.selectedTags.length > 0) {
          // 删除最后一个标签
          const newTags = [...this.props.selectedTags];
          newTags.pop();
          this.props.onTagsChange(newTags);
        }
        break;
    }
  };

  addTag = (tagText: string) => {
    const formattedTag = this.tagService.formatTagPath(tagText);
    
    if (!this.tagService.isValidTagPath(formattedTag)) {
      return;
    }
    
    if (this.props.selectedTags.includes(formattedTag)) {
      return;
    }
    
    if (this.props.maxTags && this.props.selectedTags.length >= this.props.maxTags) {
      return;
    }
    
    const newTags = [...this.props.selectedTags, formattedTag];
    this.props.onTagsChange(newTags);
    
    this.setState({ 
      inputValue: "",
      showSuggestions: false,
      selectedIndex: -1
    });
    
    this.updateSuggestions("");
  };

  removeTag = (tagToRemove: string) => {
    const newTags = this.props.selectedTags.filter(tag => tag !== tagToRemove);
    this.props.onTagsChange(newTags);
    this.updateSuggestions(this.state.inputValue);
  };

  handleSuggestionClick = (suggestion: string) => {
    this.addTag(suggestion);
  };

  handleFocus = () => {
    this.setState({ showSuggestions: true });
  };

  handleBlur = () => {
    // 延迟隐藏建议，以便点击建议项
    setTimeout(() => {
      this.setState({ showSuggestions: false });
    }, 200);
  };

  handleCompositionStart = () => {
    this.setState({ isComposing: true });
  };

  handleCompositionEnd = () => {
    this.setState({ isComposing: false });
  };

  render() {
    const { selectedTags, placeholder = "Add tags..." } = this.props;
    const { inputValue, suggestions, showSuggestions, selectedIndex } = this.state;

    return (
      <div className="tag-input-container">
        <div className="tag-input-wrapper">
          {/* 已选择的标签 */}
          <div className="selected-tags-inline">
            {selectedTags.map(tag => (
              <span key={tag} className="selected-tag-inline">
                <span className="tag-text">
                  {this.tagService.formatTagForDisplay(tag)}
                </span>
                <button
                  className="tag-remove-btn"
                  onClick={() => this.removeTag(tag)}
                  type="button"
                >
                  <span className="icon-close"></span>
                </button>
              </span>
            ))}
          </div>
          
          {/* 输入框 */}
          <input
            ref={this.inputRef}
            type="text"
            className="tag-input-field"
            value={inputValue}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onCompositionStart={this.handleCompositionStart}
            onCompositionEnd={this.handleCompositionEnd}
            placeholder={selectedTags.length === 0 ? placeholder : ""}
          />
        </div>
        
        {/* 建议列表 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="tag-suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                className={`tag-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => this.handleSuggestionClick(suggestion.name)}
              >
                <span className="suggestion-name">
                  {this.tagService.formatTagForDisplay(suggestion.displayName)}
                </span>
                {suggestion.level > 0 && (
                  <span className="suggestion-path">{suggestion.parent}</span>
                )}
                <span className="suggestion-count">({suggestion.count})</span>
              </div>
            ))}
            
            {/* 创建新标签选项 */}
            {this.props.allowCreate !== false && 
             inputValue.trim() && 
             this.tagService.isValidTagPath(inputValue.trim()) &&
             !suggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
              <div
                className="tag-suggestion-item create-new"
                onClick={() => this.handleSuggestionClick(inputValue.trim())}
              >
                <span className="suggestion-name">
                  <Trans>Create</Trans>: {this.tagService.formatTagForDisplay(inputValue.trim())}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* 提示文本 */}
        <div className="tag-input-hint">
          <Trans>Use "/" to create hierarchical tags (e.g., reading/tech/frontend)</Trans>
        </div>
      </div>
    );
  }
}

export default TagInput;

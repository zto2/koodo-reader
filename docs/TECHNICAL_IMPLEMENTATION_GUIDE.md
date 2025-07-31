# 技术实施指南：导出功能增强

## 实施顺序

### Phase 1: 词典历史Anki导出功能

#### Step 1.1: 创建DictionarySubmenu组件接口
```typescript
// src/components/dialogs/dictionarySubmenu/interface.tsx
import BookModel from "../../../models/Book";

export interface DictionarySubmenuProps {
  currentBook: BookModel;
  books: BookModel[];
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  t: (title: string) => string;
}

export interface DictionarySubmenuState {
  isHovered: boolean;
}
```

#### Step 1.2: 实现词典历史Anki导出函数
```typescript
// src/utils/file/ankiExport.ts 新增函数
export const exportDictionaryHistoryToAnki = (dictHistory: any[], books: Book[]) => {
  const ankiData: string[] = [];
  
  dictHistory.forEach((word) => {
    const book = books.find(b => b.key === word.bookKey);
    const bookName = book ? book.name : "Unknown Book";
    
    // Front: 问题格式
    const front = sanitizeTextForAnki(
      `What does "${word.word}" mean in "${bookName}"?`
    );
    
    // Back: 定义/翻译
    const back = sanitizeTextForAnki(
      word.definition || word.translation || word.word
    );
    
    // Tags: 词典标签
    const tags = generateAnkiTags(book || {} as Book, "Dictionary");
    
    ankiData.push(`${front}\t${back}\t${tags}`);
  });
  
  const fileContent = ankiData.join('\n');
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const fileName = `KoodoReader-Dictionary-Anki-${getCurrentDateString()}.txt`;
  
  saveAs(blob, fileName);
};
```

#### Step 1.3: 创建DictionarySubmenu组件
```typescript
// src/components/dialogs/dictionarySubmenu/component.tsx
import React from "react";
import "./dictionarySubmenu.css";
import { Trans } from "react-i18next";
import { DictionarySubmenuProps, DictionarySubmenuState } from "./interface";
import toast from "react-hot-toast";
import { exportDictionaryHistory } from "../../../utils/file/export";
import { exportDictionaryHistoryToAnki } from "../../../utils/file/ankiExport";
import DatabaseService from "../../../utils/storage/databaseService";

class DictionarySubmenu extends React.Component<DictionarySubmenuProps, DictionarySubmenuState> {
  private submenuRef: React.RefObject<HTMLDivElement>;

  constructor(props: DictionarySubmenuProps) {
    super(props);
    this.state = { isHovered: false };
    this.submenuRef = React.createRef();
  }

  handleExportDictionaryCSV = async () => {
    try {
      let dictHistory = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "words"
      );
      let books = await DatabaseService.getAllRecords("books");
      
      if (dictHistory.length > 0) {
        exportDictionaryHistory(dictHistory, books);
        toast.success(this.props.t("Export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  handleExportDictionaryAnki = async () => {
    try {
      let dictHistory = await DatabaseService.getRecordsByBookKey(
        this.props.currentBook.key,
        "words"
      );
      let books = await DatabaseService.getAllRecords("books");
      
      if (dictHistory.length > 0) {
        exportDictionaryHistoryToAnki(dictHistory, books);
        toast.success(this.props.t("Anki export successful"));
      } else {
        toast(this.props.t("Nothing to export"));
      }
    } catch (error) {
      toast.error(this.props.t("Export failed"));
    }
    this.props.onClose();
  };

  render() {
    if (!this.props.isVisible) return null;

    return (
      <div
        ref={this.submenuRef}
        className="dictionary-submenu-container"
        style={{
          left: this.props.position.x,
          top: this.props.position.y,
        }}
      >
        <div className="dictionary-submenu-arrow"></div>
        
        <div className="dictionary-submenu-section">
          <div className="dictionary-submenu-section-title">
            <Trans>Dictionary Export</Trans>
          </div>
          <div className="dictionary-submenu-item" onClick={this.handleExportDictionaryCSV}>
            <span className="dictionary-submenu-item-name">
              <Trans>Export Dictionary History (CSV)</Trans>
            </span>
          </div>
          <div className="dictionary-submenu-item" onClick={this.handleExportDictionaryAnki}>
            <span className="dictionary-submenu-item-name">
              <Trans>Export Dictionary History to Anki</Trans>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default DictionarySubmenu;
```

#### Step 1.4: 创建样式文件
```css
/* src/components/dialogs/dictionarySubmenu/dictionarySubmenu.css */
.dictionary-submenu-container {
  width: 200px;
  position: fixed;
  z-index: 10;
  animation: submenu-slide-in 0.15s ease-in-out;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.dictionary-submenu-section {
  padding: 5px 0;
}

.dictionary-submenu-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #666666;
  padding: 8px 15px 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dictionary-submenu-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 3px;
  margin: 2px 5px;
  transition: background-color 0.2s ease;
}

.dictionary-submenu-item:hover {
  background-color: #f5f5f5;
}

.dictionary-submenu-item-name {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #333333;
}

.dictionary-submenu-arrow {
  position: absolute;
  left: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #ffffff;
  filter: drop-shadow(-1px 0 1px rgba(0, 0, 0, 0.1));
}

/* Dark mode support */
[data-theme="dark"] .dictionary-submenu-container {
  background: #2a2a2a;
  border-color: #404040;
}

[data-theme="dark"] .dictionary-submenu-section-title {
  color: #cccccc;
}

[data-theme="dark"] .dictionary-submenu-item-name {
  color: #ffffff;
}

[data-theme="dark"] .dictionary-submenu-item:hover {
  background-color: #3a3a3a;
}

[data-theme="dark"] .dictionary-submenu-arrow {
  border-right-color: #2a2a2a;
}

@keyframes submenu-slide-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Phase 2: 修改MoreAction组件

#### Step 2.1: 更新接口定义
```typescript
// src/components/dialogs/moreAction/interface.tsx
export interface MoreActionState {
  isShowExportSubmenu: boolean;
  isShowDictionarySubmenu: boolean;  // 新增
  submenuPosition: { x: number; y: number };
  dictionarySubmenuPosition: { x: number; y: number };  // 新增
}
```

#### Step 2.2: 修改MoreAction组件
```typescript
// src/components/dialogs/moreAction/component.tsx
// 在构造函数中添加新状态
constructor(props: MoreActionProps) {
  super(props);
  this.state = {
    isShowExportSubmenu: false,
    isShowDictionarySubmenu: false,  // 新增
    submenuPosition: { x: 0, y: 0 },
    dictionarySubmenuPosition: { x: 0, y: 0 },  // 新增
  };
}

// 添加词典子菜单处理方法
handleDictionarySubmenuToggle = (show: boolean, event?: React.MouseEvent) => {
  if (show && event) {
    const rect = event.currentTarget.getBoundingClientRect();
    this.setState({
      isShowDictionarySubmenu: true,
      dictionarySubmenuPosition: {
        x: rect.right + 5,
        y: rect.top,
      },
    });
  } else {
    this.setState({ isShowDictionarySubmenu: false });
  }
};

// 替换现有的词典历史导出菜单项
<div
  className="action-dialog-edit dictionary-options-trigger"
  style={{ paddingLeft: "0px", position: "relative" }}
  onMouseEnter={(event) => this.handleDictionarySubmenuToggle(true, event)}
  onMouseLeave={() => {
    setTimeout(() => {
      if (!this.state.isShowDictionarySubmenu) {
        this.handleDictionarySubmenuToggle(false);
      }
    }, 200);
  }}
>
  <p className="action-name">
    <Trans>Export Dictionary History</Trans>
    <span className="icon-dropdown submenu-arrow"></span>
  </p>
</div>

// 在render方法末尾添加DictionarySubmenu组件
<DictionarySubmenu
  currentBook={this.props.currentBook}
  books={this.props.books}
  isVisible={this.state.isShowDictionarySubmenu}
  position={this.state.dictionarySubmenuPosition}
  onClose={() => this.handleDictionarySubmenuToggle(false)}
  t={this.props.t}
/>
```

### Phase 3: 修复箭头图标一致性

#### Step 3.1: 更新CSS样式
```css
/* src/components/dialogs/moreAction/moreAction.css */
.submenu-arrow {
  font-family: 'icomoon' !important;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
}

.submenu-arrow:before {
  content: "\e940"; /* icon-dropdown */
}

.export-options-trigger:hover .submenu-arrow,
.dictionary-options-trigger:hover .submenu-arrow {
  opacity: 1;
}

.dictionary-options-trigger {
  position: relative;
}
```

#### Step 3.2: 更新HTML结构
```typescript
// 将现有的
<span className="submenu-arrow">▶</span>

// 替换为
<span className="icon-dropdown submenu-arrow"></span>
```

### Phase 4: 国际化和测试

#### Step 4.1: 添加翻译
```json
// src/assets/locales/en/translation.json
{
  "Dictionary Export": "Dictionary Export",
  "Export Dictionary History (CSV)": "Export Dictionary History (CSV)",
  "Export Dictionary History to Anki": "Export Dictionary History to Anki"
}

// src/assets/locales/zh-CN/translation.json
{
  "Dictionary Export": "词典导出",
  "Export Dictionary History (CSV)": "导出词典历史 (CSV)",
  "Export Dictionary History to Anki": "导出词典历史到 Anki"
}
```

#### Step 4.2: 测试检查清单
- [ ] 词典历史子菜单正确显示/隐藏
- [ ] CSV导出功能正常工作
- [ ] Anki导出功能正常工作
- [ ] 图标显示一致性
- [ ] 主题切换兼容性
- [ ] 多语言支持正确
- [ ] 无TypeScript编译错误
- [ ] 无控制台错误或警告

## 关键注意事项

1. **事件处理**：确保鼠标事件正确处理，避免子菜单意外关闭
2. **内存管理**：及时清理事件监听器和定时器
3. **样式继承**：保持与现有组件的视觉一致性
4. **错误处理**：提供清晰的用户反馈
5. **性能优化**：避免不必要的重渲染

这个实施指南提供了完整的代码示例和步骤，确保功能的正确实现和高质量交付。

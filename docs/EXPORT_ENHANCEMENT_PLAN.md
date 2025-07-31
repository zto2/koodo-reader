# Koodo Reader 导出功能增强计划

## 项目概述

本文档详细规划了Koodo Reader导出功能的两个关键增强需求，旨在提升用户体验和功能完整性。

## 需求分析

### 需求1：词典历史导出Anki支持
**业务价值**：为语言学习用户提供更便捷的词汇复习工具，增强产品在教育领域的竞争力
**用户痛点**：当前词典历史只能导出CSV格式，无法直接用于Anki等记忆工具
**解决方案**：为词典历史导出创建独立子菜单，支持CSV和Anki两种格式

### 需求2：子菜单箭头视觉一致性
**业务价值**：提升UI/UX一致性，增强品牌专业度
**用户痛点**：当前子菜单使用的"▶"符号与应用其他部分的图标风格不一致
**解决方案**：统一使用应用内置的icon-dropdown图标系统

## 技术分析

### 当前架构分析

#### 图标系统
- **主要图标库**：icomoon字体图标系统
- **关键图标类**：
  - `.icon-dropdown` (content: "\e940") - 标准下拉箭头
  - `.icon-more` (content: "\e938") - 更多操作图标
  - `.icon-export` (content: "\e911") - 导出图标

#### 菜单结构
```
More Actions Menu (MoreAction组件)
├── Export books
├── Export Options ▶ (当前使用"▶"符号)
│   └── ExportSubmenu组件
├── Export Dictionary History (当前单一CSV导出)
└── [其他操作...]
```

#### 现有导出架构
- **导出工具**：`src/utils/file/export.ts`
- **Anki导出**：`src/utils/file/ankiExport.ts`
- **子菜单组件**：`src/components/dialogs/exportSubmenu/`

## 实施计划

### 任务1：词典历史Anki导出功能

#### 1.1 创建词典历史子菜单组件
**文件路径**：`src/components/dialogs/dictionarySubmenu/`
**组件结构**：
```
dictionarySubmenu/
├── component.tsx      # 主组件逻辑
├── interface.tsx      # TypeScript接口
├── dictionarySubmenu.css  # 样式文件
└── index.tsx         # 导出文件
```

#### 1.2 实现词典历史Anki导出函数
**文件路径**：`src/utils/file/ankiExport.ts`
**新增函数**：`exportDictionaryHistoryToAnki(dictHistory: Word[], books: Book[])`

**Anki卡片格式设计**：
```
Front: "What does '[word]' mean in [Book Name]?"
Back: "[definition/translation]"
Tags: "Dictionary::BookName::AuthorName"
```

#### 1.3 修改MoreAction组件
**变更内容**：
- 将"Export Dictionary History"改为带子菜单的触发器
- 添加词典历史子菜单状态管理
- 实现鼠标悬停交互逻辑

#### 1.4 数据模型分析
**词典历史数据结构**（基于现有代码分析）：
```typescript
interface Word {
  key: string;
  word: string;
  definition?: string;
  translation?: string;
  bookKey: string;
  // 其他字段...
}
```

### 任务2：子菜单箭头视觉一致性

#### 2.1 图标标准化分析
**当前问题**：
- Export Options使用Unicode"▶"符号
- 应用其他部分使用icomoon图标系统

**解决方案**：
- 统一使用`.icon-dropdown`类
- 保持与应用整体设计语言一致

#### 2.2 CSS样式更新
**文件路径**：`src/components/dialogs/moreAction/moreAction.css`
**变更内容**：
```css
.submenu-arrow {
  font-family: 'icomoon' !important;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
}

.submenu-arrow:before {
  content: "\e940"; /* icon-dropdown */
}
```

## 详细技术规范

### 组件接口设计

#### DictionarySubmenu组件接口
```typescript
interface DictionarySubmenuProps {
  currentBook: BookModel;
  books: BookModel[];
  dictHistory: Word[];
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  t: (title: string) => string;
}

interface DictionarySubmenuState {
  isHovered: boolean;
}
```

#### MoreAction状态扩展
```typescript
interface MoreActionState {
  isShowExportSubmenu: boolean;
  isShowDictionarySubmenu: boolean;  // 新增
  submenuPosition: { x: number; y: number };
  dictionarySubmenuPosition: { x: number; y: number };  // 新增
}
```

### 样式设计规范

#### 子菜单视觉一致性
- **容器样式**：复用ExportSubmenu的样式模式
- **动画效果**：保持0.15s ease-in-out过渡
- **定位逻辑**：相对于触发元素右侧+5px偏移
- **箭头指示器**：使用CSS三角形，与父菜单连接

#### 响应式设计考虑
- **最小宽度**：200px（与现有子菜单一致）
- **最大高度**：自适应内容，最大不超过视窗高度
- **边界检测**：防止子菜单超出屏幕边界

### 国际化支持

#### 新增翻译键
**英文**：
```json
{
  "Dictionary Export": "Dictionary Export",
  "Export Dictionary History (CSV)": "Export Dictionary History (CSV)",
  "Export Dictionary History to Anki": "Export Dictionary History to Anki"
}
```

**中文**：
```json
{
  "Dictionary Export": "词典导出",
  "Export Dictionary History (CSV)": "导出词典历史 (CSV)",
  "Export Dictionary History to Anki": "导出词典历史到 Anki"
}
```

### 错误处理策略

#### 数据验证
- 检查词典历史数据完整性
- 验证书籍关联关系
- 处理空数据集情况

#### 用户反馈
- 成功导出：toast.success消息
- 数据为空：toast提示"Nothing to export"
- 导出失败：toast.error错误消息

## 测试计划

### 功能测试
1. **词典历史子菜单**
   - 悬停显示/隐藏行为
   - 点击外部区域关闭
   - 键盘导航支持

2. **Anki导出功能**
   - 不同数据量的导出测试
   - 特殊字符处理验证
   - 文件格式正确性检查

3. **视觉一致性**
   - 图标显示正确性
   - 主题切换兼容性
   - 不同屏幕尺寸适配

### 兼容性测试
- 浏览器兼容性（Chrome, Firefox, Safari, Edge）
- 操作系统兼容性（Windows, macOS, Linux）
- 移动端响应式表现

## 风险评估

### 技术风险
- **低风险**：基于现有成熟的子菜单架构
- **依赖风险**：依赖现有的数据库服务和导出工具
- **性能影响**：最小化，仅增加少量DOM元素

### 用户体验风险
- **学习成本**：极低，遵循现有交互模式
- **向后兼容**：完全保持现有功能不变
- **可用性**：增强而非替换现有功能

## 交付计划

### 里程碑1：词典历史Anki导出（预计2天）
- Day 1：组件开发和Anki导出函数实现
- Day 2：集成测试和样式调优

### 里程碑2：视觉一致性优化（预计0.5天）
- 图标标准化和CSS更新

### 里程碑3：测试和文档（预计0.5天）
- 全面测试和用户文档更新

**总预计工期**：3个工作日

## 成功指标

### 功能指标
- ✅ 词典历史支持CSV和Anki两种导出格式
- ✅ 子菜单交互流畅，无UI异常
- ✅ 所有图标使用统一的icomoon系统

### 质量指标
- ✅ 零TypeScript编译错误
- ✅ 通过所有现有测试用例
- ✅ 代码覆盖率不降低

### 用户体验指标
- ✅ 导出操作响应时间<2秒
- ✅ UI交互延迟<200ms
- ✅ 支持键盘导航

这个增强计划将显著提升Koodo Reader的导出功能完整性和用户体验一致性，为用户提供更专业、更便捷的数据导出解决方案。

## 附录：实施细节

### A. 文件变更清单

#### 新增文件
```
src/components/dialogs/dictionarySubmenu/
├── component.tsx
├── interface.tsx
├── dictionarySubmenu.css
└── index.tsx
```

#### 修改文件
```
src/components/dialogs/moreAction/
├── component.tsx          # 添加词典子菜单逻辑
├── interface.tsx          # 扩展状态接口
└── moreAction.css        # 更新箭头图标样式

src/utils/file/ankiExport.ts  # 添加词典历史导出函数
src/assets/locales/en/translation.json  # 英文翻译
src/assets/locales/zh-CN/translation.json  # 中文翻译
```

### B. 代码复用策略

#### 组件复用
- DictionarySubmenu复用ExportSubmenu的架构模式
- 样式继承exportSubmenu.css的设计语言
- 交互逻辑参考现有子菜单实现

#### 工具函数复用
- 复用ankiExport.ts中的通用函数
- 继承现有的错误处理模式
- 使用统一的文件命名约定

### C. 性能优化考虑

#### 组件优化
- 使用React.memo优化不必要的重渲染
- 实现懒加载，仅在需要时渲染子菜单
- 优化事件监听器的添加和移除

#### 内存管理
- 及时清理事件监听器
- 避免内存泄漏的闭包引用
- 合理使用setTimeout的清理机制

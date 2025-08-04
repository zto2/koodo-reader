# Koodo Reader flomo导出功能开发文档

## 1. 项目概述

### 1.1 功能目标
为Koodo Reader添加flomo导出功能，允许用户将笔记和高亮内容直接导出到flomo笔记应用中，提升用户的知识管理工作流效率。

### 1.2 功能范围
1. **导出菜单集成**：在现有的导出子菜单中添加flomo导出选项
2. **阅读界面集成**：在划线/高亮弹出菜单中添加flomo导出选项
3. **设置界面配置**：添加flomo API配置和相关设置
4. **错误处理**：完整的错误处理和用户反馈机制

## 2. flomo API集成方案

### 2.1 API概述
flomo提供了Incoming Webhook API，允许第三方应用通过HTTP POST请求发送内容到用户的flomo账户。

### 2.2 API认证流程
1. **获取API URL**：用户需要在flomo网页端（https://flomoapp.com/mine?source=incoming_webhook）获取专属的API URL
2. **API URL格式**：`https://flomoapp.com/iwh/用户ID/密钥/`
3. **认证方式**：通过专属URL进行认证，无需额外的认证头
4. **会员要求**：flomo API功能需要Pro会员权限

### 2.3 API使用限制
- **每日调用限制**：100次/天
- **内容长度限制**：单条笔记最大5000字符
- **频率限制**：建议间隔至少1秒发送请求

### 2.4 API请求格式
```typescript
// 请求方法：POST
// Content-Type: application/json
// 请求体格式：
{
  "content": "笔记内容"  // 必填，支持Markdown格式
}
```

### 2.5 API响应处理
```typescript
// 成功响应：HTTP 200
{
  "code": 0,
  "message": "已记录",
  "memo": {
    "slug": "memo_id_string"  // 用于生成笔记详情链接
  }
}

// 错误响应：HTTP 4xx/5xx
{
  "code": -1,
  "message": "error message"
}
```

### 2.6 内容格式建议
基于flomo的设计理念，推荐的导出内容格式：
- **纯文本格式**：简洁明了，便于快速记录和回顾
- **支持Markdown**：可使用基础Markdown语法（加粗、斜体、链接等）
- **标签支持**：使用`#标签名`格式添加标签
- **换行处理**：保持原文的段落结构

## 3. UI/UX设计方案

### 3.1 导出子菜单设计

#### 3.1.1 菜单位置
在现有的ExportSubmenu组件中，为Notes和Highlights两个部分分别添加flomo导出选项：

```
Notes
├── Export Notes (CSV)
├── Export Notes to Anki
└── Export Notes to flomo        [新增]

Highlights  
├── Export Highlights (CSV)
├── Export Highlights to Anki
└── Export Highlights to flomo   [新增]
```

#### 3.1.2 视觉设计
- **图标**：使用统一的导出图标风格，建议使用`icon-flomo`类名
- **文本**：遵循现有命名规范，如"Export Notes to flomo"
- **样式**：保持与现有菜单项一致的样式和交互效果

### 3.2 阅读界面弹出菜单设计

#### 3.2.1 菜单位置
在PopupOption组件的菜单列表中添加flomo导出选项，位置建议在"Copy"之后：

```
现有菜单：
[Note] [Highlight] [Translate] [Copy] [Search] [Dict] [Browser] [Speaker]

新增后：
[Note] [Highlight] [Translate] [Copy] [flomo] [Search] [Dict] [Browser] [Speaker]
```

#### 3.2.2 交互流程
1. 用户选中文本
2. 弹出菜单显示
3. 点击flomo图标
4. 检查网络连接状态（离线时显示错误提示）
5. 检查API调用次数限制（接近100次时显示警告）
6. 显示导出确认/进度提示
7. 导出完成后显示成功/失败消息，成功时提供flomo链接

### 3.3 设置界面设计

#### 3.3.1 设置项位置
在设置对话框的"General"标签页中添加flomo相关配置，建议放在第三方服务集成区域。

#### 3.3.2 配置项设计
```
flomo集成设置
├── 启用flomo导出                [开关]
├── flomo API URL               [输入框]
├── 测试连接                    [按钮]
├── 今日已用次数                [显示：X/100]
├── 导出格式设置                [下拉选择]
│   ├── 仅内容
│   ├── 包含书籍信息
│   └── 包含章节信息
└── 批量导出设置                [开关]
    └── 超过100条时显示选择界面   [说明文字]
```

## 4. 技术实现架构

### 4.1 组件结构

#### 4.1.1 新增组件
```
src/
├── utils/
│   └── flomo/
│       ├── flomoService.ts      # flomo API服务
│       ├── flomoExport.ts       # 导出逻辑
│       └── flomoConfig.ts       # 配置管理
├── components/
│   └── dialogs/
│       └── flomoSettings/       # flomo设置组件
│           ├── component.tsx
│           ├── interface.tsx
│           └── flomoSettings.css
```

#### 4.1.2 修改的现有组件
- `src/components/dialogs/exportSubmenu/component.tsx`
- `src/components/popups/popupOption/component.tsx`
- `src/components/dialogs/settingDialog/component.tsx`
- `src/constants/popupList.tsx`
- `src/constants/settingList.tsx`

### 4.2 数据流设计

#### 4.2.1 配置数据流
```
用户输入 → ConfigService → 本地存储 → flomoConfig.ts → flomoService.ts
```

#### 4.2.2 导出数据流
```
笔记/高亮数据 → flomoExport.ts → 格式化 → flomoService.ts → flomo API → 用户反馈
```

### 4.3 状态管理

#### 4.3.1 配置状态
使用现有的ConfigService管理flomo相关配置：
- `flomoApiUrl`: flomo API URL
- `isFlomoEnabled`: 是否启用flomo导出
- `flomoExportFormat`: 导出格式选项
- `flomoDailyUsageCount`: 今日已使用次数
- `flomoLastResetDate`: 上次重置日期
- `flomoEnableBatchSelection`: 是否启用批量选择

#### 4.3.2 导出状态
使用React组件状态管理导出过程：
- `isExporting`: 是否正在导出
- `exportProgress`: 导出进度（批量导出时）
- `lastExportResult`: 最后一次导出结果
- `selectedItems`: 批量导出时选中的条目
- `isNetworkOnline`: 网络连接状态

#### 4.3.3 批量选择状态
批量导出选择界面的状态管理：
- `availableItems`: 可导出的条目列表
- `selectedItems`: 已选择的条目
- `sortOrder`: 排序方式（按书本位置、按添加时间）
- `isExporting`: 是否正在执行批量导出
- `exportResult`: 批量导出结果（成功/失败统计）

## 5. 设置界面配置项详细设计

### 5.1 配置项列表

#### 5.1.1 基础配置
```typescript
interface FlomoConfig {
  isEnabled: boolean;           // 是否启用flomo导出
  apiUrl: string;              // flomo API URL
  exportFormat: 'content' | 'with-book' | 'with-chapter'; // 导出格式
  dailyUsageCount: number;     // 今日已使用次数
  lastResetDate: string;       // 上次重置日期
  enableBatchSelection: boolean; // 是否启用批量选择
  retryCount: number;          // 失败重试次数
}
```

#### 5.1.2 高级配置
```typescript
interface FlomoAdvancedConfig {
  includeTimestamp: boolean;    // 是否包含时间戳
  includeHighlightColor: boolean; // 是否包含高亮颜色信息
  customTemplate: string;       // 自定义导出模板
  tagPrefix: string;           // 标签前缀（如：#读书笔记）
  maxContentLength: number;    // 内容最大长度（默认5000）
}
```

### 5.2 设置界面布局
```
flomo集成设置
┌─────────────────────────────────────┐
│ ☑ 启用flomo导出                      │
├─────────────────────────────────────┤
│ API URL: [___________________] [测试] │
├─────────────────────────────────────┤
│ 今日使用: 15/100 次                  │
├─────────────────────────────────────┤
│ 导出格式: [包含书籍信息 ▼]            │
├─────────────────────────────────────┤
│ ☑ 超过100条时显示选择界面             │
├─────────────────────────────────────┤
│ 高级设置:                           │
│ ☑ 包含时间戳                        │
│ ☑ 包含高亮颜色                      │
│ 标签前缀: [#读书笔记]                │
└─────────────────────────────────────┘
```

## 6. 错误处理和边界情况

### 6.1 API限制处理
- **每日限制检查**：导出前检查今日已用次数，接近100次时显示警告
- **批量导出策略**：超过100条时显示选择界面，让用户选择要导出的条目
- **使用次数统计规则**：
  - 笔记和高亮导出统一计数，不区分类型
  - 仅当flomo API返回成功响应时才计入使用次数
  - 失败请求不计数，避免浪费用户配额
  - 时区统一使用北京时间（UTC+8）进行每日重置

### 6.2 网络错误处理和重试机制
- **离线检测**：检测网络状态，离线时显示错误提示框，禁用导出功能
- **连接超时**：设置合理的超时时间（10秒），超时后显示错误提示
- **API错误处理**：根据flomo API错误码进行分类处理：
  ```typescript
  // flomo API错误码处理
  switch (response.code) {
    case 0:   // 成功
      return { success: true, data: response };
    case -1:  // 一般错误
      throw new Error(response.message || "导出失败");
    case -2:  // 内容为空
      throw new Error("内容不能为空");
    case -3:  // 内容过长
      throw new Error("内容超过5000字符限制");
    case -4:  // API调用频率过快
      throw new Error("请求过于频繁，请稍后再试");
    default:
      throw new Error("未知错误：" + response.message);
  }
  ```
- **重试机制**：
  - 网络错误：自动重试3次，间隔递增（1s, 2s, 4s）
  - API频率限制：等待5秒后重试
  - 其他错误：不重试，直接显示错误信息

### 6.3 数据验证和处理
- **API URL验证**：检查URL格式和有效性，支持测试连接功能
- **内容长度限制**：单条笔记限制5000字符，超长时自动截断并提示
- **特殊字符处理**：保持Markdown格式，处理可能导致问题的字符

### 6.4 批量导出选择界面
当笔记或高亮数量超过100条时，显示选择界面：
```
批量导出选择
┌─────────────────────────────────────┐
│ 检测到 150 条笔记，超过每日限制      │
│ 请选择要导出的笔记（最多100条）：     │
├─────────────────────────────────────┤
│ ☑ 全选 | ☐ 反选 | 按书本位置排序 ▼  │
├─────────────────────────────────────┤
│ ☑ 笔记1 - 《书名》第1章              │
│ ☑ 笔记2 - 《书名》第2章              │
│ ☐ 笔记3 - 《书名》第3章              │
│ ...                                │
├─────────────────────────────────────┤
│ 已选择: 85/100                      │
│ [取消] [确认导出]                    │
└─────────────────────────────────────┘
```

#### 6.4.1 选择界面功能规范
- **排序选项**：仅支持"按书本位置排序"和"按添加时间排序"
- **快速多选**：支持全选、反选、批量勾选功能
- **数量限制**：最多选择100条，实时显示已选择数量
- **界面简化**：暂不实现搜索和预览功能

### 6.5 批量导出的部分成功处理
当批量导出过程中出现部分失败时，采用以下策略：
```typescript
interface BatchExportResult {
  total: number;           // 总数
  success: number;         // 成功数量
  failed: number;          // 失败数量
  failedItems: Array<{     // 失败条目详情
    item: Note | Highlight;
    error: string;
  }>;
}
```

**处理流程**：
1. **继续执行**：单个条目失败不影响其他条目的导出
2. **详细记录**：记录每个失败条目的具体错误信息
3. **用户反馈**：显示详细的导出结果摘要
4. **重试选项**：为失败的条目提供单独重试功能

**结果显示界面**：
```
导出完成
┌─────────────────────────────────────┐
│ 导出结果：                          │
│ ✅ 成功：85条                       │
│ ❌ 失败：3条                        │
├─────────────────────────────────────┤
│ 失败详情：                          │
│ • 笔记1：内容过长                   │
│ • 笔记2：网络超时                   │
│ • 笔记3：API频率限制                │
├─────────────────────────────────────┤
│ [重试失败项] [查看成功项] [关闭]     │
└─────────────────────────────────────┘
```

### 6.6 用户体验优化
- **后台导出**：批量导出在后台执行，用户可继续使用其他功能
- **导出进度显示**：显示进度条和当前状态（"正在导出第X/Y条"）
- **间隔控制**：每次API调用间隔1秒，确保符合flomo频率限制
- **成功反馈**：导出成功后提供flomo笔记链接，方便用户查看
- **简化交互**：不实现导出取消功能，保持界面简洁

## 7. 导出内容格式设计

### 7.1 内容格式模板

#### 7.1.1 笔记导出格式
```markdown
《{{bookName}}》- {{author}}

📝 第{{chapterIndex}}章：{{chapterTitle}}

{{noteContent}}

{{#if includeTimestamp}}
📅 {{date}}
{{/if}}

{{#if includeHighlightColor}}
🎨 {{colorName}}
{{/if}}

#读书笔记 #{{bookNameTag}}
```

#### 7.1.2 高亮导出格式
```markdown
《{{bookName}}》- {{author}}

📖 第{{chapterIndex}}章：{{chapterTitle}}

> {{highlightText}}

{{#if includeTimestamp}}
📅 {{date}}
{{/if}}

{{#if includeHighlightColor}}
🎨 {{colorName}}
{{/if}}

#高亮摘录 #{{bookNameTag}}
```

### 7.2 格式选项说明

#### 7.2.1 仅内容格式
```markdown
{{content}}

#读书笔记
```

#### 7.2.2 包含书籍信息格式
```markdown
《{{bookName}}》- {{author}}

{{content}}

#读书笔记 #{{bookNameTag}}
```

#### 7.2.3 包含章节信息格式
```markdown
《{{bookName}}》- {{author}}

📖 第{{chapterIndex}}章：{{chapterTitle}}

{{content}}

#读书笔记 #{{bookNameTag}}
```

### 7.3 特殊字符处理

#### 7.3.1 标签名处理
- 移除特殊字符：`#`、`@`、空格等
- 长度限制：最大20个字符
- 中文支持：保持中文字符

#### 7.3.2 内容长度处理
- 单条笔记最大5000字符
- 超长时自动截断，添加"..."提示
- 优先保留原文内容，其次保留书籍信息

## 8. 与现有导出功能的集成方案

### 8.1 代码复用
- **数据获取逻辑**：复用现有的笔记和高亮数据获取代码
- **格式化工具**：扩展现有的数据格式化函数
- **错误处理模式**：遵循现有的toast消息和错误处理模式

### 8.2 UI一致性
- **菜单样式**：使用现有的菜单项样式类
- **图标系统**：遵循现有的图标命名和样式规范
- **交互模式**：保持与现有导出功能一致的交互流程

### 8.3 国际化集成
需要在所有语言文件中添加相关翻译：
```json
{
  "Export to flomo": "导出到flomo",
  "Export Notes to flomo": "导出笔记到flomo", 
  "Export Highlights to flomo": "导出高亮到flomo",
  "flomo export successful": "flomo导出成功",
  "flomo export failed": "flomo导出失败",
  "flomo API URL": "flomo API地址",
  "Test connection": "测试连接",
  "Connection successful": "连接成功",
  "Invalid API URL": "无效的API地址"
}
```

## 9. 开发阶段规划

### 9.1 第一阶段：基础功能
1. **核心API服务**：实现flomoService.ts，包含API调用、错误码处理、重试机制
2. **内容格式化引擎**：实现三种导出格式（仅内容、包含书籍信息、包含章节信息）
3. **基础设置界面**：API URL、启用开关、使用次数统计、API连接测试功能
4. **导出菜单集成**：在ExportSubmenu中添加flomo选项
5. **阅读界面集成**：在PopupOption中添加flomo选项
6. **单条导出功能**：实现单条笔记/高亮的完整导出流程
7. **基础错误处理**：离线检测、URL验证、内容长度限制
8. **核心国际化**：基础功能相关的翻译文本

### 9.2 第二阶段：批量导出和选择界面
1. **批量选择界面**：实现选择界面UI，支持按书本位置和时间排序
2. **快速多选功能**：全选、反选、批量勾选等交互功能
3. **后台批量导出**：实现批量导出核心逻辑，支持1秒间隔控制
4. **部分成功处理**：实现BatchExportResult接口和结果显示界面
5. **导出进度显示**：进度条、当前状态显示、后台执行管理
6. **失败重试功能**：为失败条目提供单独重试机制
7. **批量导出国际化**：选择界面、进度显示、结果统计相关翻译

### 9.3 第三阶段：高级功能和优化
1. **高级配置选项**：
   - 自定义导出模板功能
   - 标签前缀配置
   - 包含时间戳/高亮颜色选项
   - 内容最大长度配置
   - 失败重试次数配置
2. **特殊字符处理**：标签名处理、内容截断优化
3. **模板引擎增强**：支持条件渲染（`{{#if}}`语法）
4. **完整国际化**：所有错误消息、设置界面、高级功能的翻译
5. **测试覆盖**：单元测试、集成测试、用户界面测试
6. **性能优化**：内存使用优化、错误处理性能提升

## 10. 关键技术实现

### 10.1 使用次数统计实现
```typescript
// src/utils/flomo/flomoConfig.ts
export class FlomoUsageTracker {
  private static readonly BEIJING_TIMEZONE_OFFSET = 8; // UTC+8

  static getTodayUsageCount(): number {
    const today = this.getBeijingDateString();
    const lastResetDate = ConfigService.getReaderConfig("flomoLastResetDate");

    if (lastResetDate !== today) {
      // 新的一天，重置计数
      ConfigService.setReaderConfig("flomoDailyUsageCount", "0");
      ConfigService.setReaderConfig("flomoLastResetDate", today);
      return 0;
    }

    return parseInt(ConfigService.getReaderConfig("flomoDailyUsageCount") || "0");
  }

  static incrementUsageCount(): void {
    const currentCount = this.getTodayUsageCount();
    ConfigService.setReaderConfig("flomoDailyUsageCount", (currentCount + 1).toString());
  }

  private static getBeijingDateString(): string {
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (this.BEIJING_TIMEZONE_OFFSET * 60 * 60 * 1000));
    return beijingTime.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
```

### 10.2 批量导出核心逻辑
```typescript
// src/utils/flomo/flomoExport.ts
export class FlomoBatchExporter {
  private static readonly EXPORT_INTERVAL = 1000; // 1秒间隔

  static async exportBatch(items: (Note | Highlight)[], onProgress?: (progress: BatchExportProgress) => void): Promise<BatchExportResult> {
    const result: BatchExportResult = {
      total: items.length,
      success: 0,
      failed: 0,
      failedItems: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // 更新进度
        onProgress?.({
          current: i + 1,
          total: items.length,
          currentItem: item
        });

        // 导出单个条目
        await this.exportSingleItem(item);

        // 仅在成功时计入使用次数
        FlomoUsageTracker.incrementUsageCount();
        result.success++;

      } catch (error) {
        result.failed++;
        result.failedItems.push({
          item,
          error: error.message
        });
      }

      // 等待间隔（除了最后一个）
      if (i < items.length - 1) {
        await this.delay(this.EXPORT_INTERVAL);
      }
    }

    return result;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 11. 技术细节确认事项

### 11.1 已确认的技术细节
1. **API限制**：每日100次调用限制，需要本地统计和限制检查
2. **批量导出策略**：超过100条时显示选择界面，逐条发送API请求
3. **离线处理**：不实现离线支持，离线时显示错误提示
4. **导出范围**：仅调用API发送数据，不保存本地文件

### 11.2 内容格式规范
基于flomo官方文档和最佳实践：
1. **支持Markdown**：基础语法（加粗、斜体、链接等）
2. **标签格式**：使用`#标签名`格式
3. **内容结构**：
   ```
   《书名》- 作者名

   📖 第X章：章节名

   原文内容/笔记内容

   #读书笔记 #书名
   ```

### 11.3 性能和安全考虑
1. **请求频率控制**：每次请求间隔1秒，符合flomo API要求
2. **简化性能策略**：由于每日限制100条，无需复杂的性能优化
3. **后台执行**：批量导出在后台执行，不阻塞用户界面
4. **API URL安全**：使用ConfigService安全存储，不在日志中输出
5. **错误处理**：详细的错误分类和用户友好的提示信息
6. **时区统一**：使用北京时间（UTC+8）进行每日重置计算

### 11.4 测试策略

#### 11.4.1 单元测试
- **flomoService.ts**：API调用、错误处理、响应解析
- **flomoExport.ts**：内容格式化、长度限制、特殊字符处理
- **flomoConfig.ts**：配置管理、使用次数统计、日期重置

#### 11.4.2 集成测试
- **导出流程**：完整的导出流程测试
- **批量选择**：选择界面的交互和状态管理
- **部分成功场景**：批量导出中的部分失败处理
- **重试机制**：各种错误场景的重试逻辑
- **时区处理**：北京时间的每日重置功能

#### 11.4.3 用户界面测试
- **菜单集成**：导出菜单的显示和交互
- **设置界面**：配置项的保存和验证
- **反馈机制**：成功/失败消息的显示


## 12. 潜在功能扩展

### 12.1 第二期开发计划
1. **搜索和预览功能**：
   - 批量选择界面中的搜索功能
   - 导出前的内容预览功能
   - 支持按关键词筛选笔记和高亮

2. **标签系统集成**：
   - 将Koodo Reader本地的书籍标签融入到flomo标签系统
   - 支持自定义标签映射规则
   - 标签的批量管理和编辑功能

3. **高级功能扩展**：
   - 智能内容摘要（对于过长的笔记）
   - 本地导出历史记录功能（基于本地存储，不依赖flomo数据）

### 12.2 长期功能规划
1. **用户体验增强**：
   - 快捷键支持
   - 自定义导出模板

## 13. 可能遗漏的功能细节

### 13.1 错误恢复机制
1. **网络中断恢复**：网络恢复后自动重试失败的导出
2. **API限制重置**：每日零点自动重置使用次数计数
3. **配置备份**：flomo配置的备份和恢复功能

### 13.2 多语言支持细节
1. **日期格式本地化**：根据用户语言设置格式化日期
2. **内容方向支持**：支持RTL语言的内容导出
3. **字符编码处理**：确保各种语言字符正确传输

### 13.3 可访问性考虑
1. **键盘导航**：确保所有功能都可以通过键盘操作
2. **屏幕阅读器支持**：为视觉障碍用户提供适当的标签
3. **高对比度模式**：在高对比度模式下的界面适配


---

本文档为flomo导出功能的详细设计方案，涵盖了从基础功能到高级扩展的完整规划。后续开发过程中可根据实际情况和用户反馈进行调整和完善。

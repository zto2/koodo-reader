# flomo Integration for Koodo Reader

This document describes the flomo integration feature that allows users to export their reading highlights directly to their flomo account.

## Overview

The flomo integration enables Koodo Reader users to:
- Export selected text highlights to their flomo account
- Bulk export notes and highlights from book library
- Automatically format highlights with book metadata
- Configure and test their flomo webhook connection
- Seamlessly integrate reading notes with their flomo workflow

## Features

### 1. Individual Highlight Export
- **One-click export**: Select text and click "Export to flomo" in the popup menu
- **Rich formatting**: Automatically formats highlights with book title, author, chapter, and location information
- **Smart content**: Includes reading context and tags for better organization

### 2. Bulk Export from Library
- **Right-click context menu**: Access bulk export options from book library
- **Export notes**: Bulk export all notes from a specific book
- **Export highlights**: Bulk export all highlights from a specific book
- **Export all**: Export both notes and highlights in one operation
- **Progress feedback**: Real-time progress updates during bulk operations
- **Smart batching**: Automatic rate limiting to prevent API overload

### 3. Configuration Management
- **Webhook URL setup**: Easy configuration of flomo webhook URL in settings
- **Connection testing**: Built-in test functionality to verify webhook connectivity
- **Validation**: Automatic validation of webhook URL format

### 4. Error Handling
- **Network error handling**: Graceful handling of network connectivity issues
- **User feedback**: Clear success/failure messages with actionable information
- **Configuration validation**: Prevents export attempts with invalid configurations

## Setup Instructions

### Prerequisites
- flomo PRO account (required for webhook functionality)
- Active internet connection

### Configuration Steps

1. **Get your flomo webhook URL**:
   - Visit [flomo webhook settings](https://flomoapp.com/mine?source=incoming_webhook)
   - Copy your unique webhook URL (should start with `https://flomoapp.com/mine/`)

2. **Configure Koodo Reader**:
   - Open Koodo Reader settings
   - Navigate to the "flomo" tab
   - Enable flomo integration
   - Paste your webhook URL
   - Click "Save"
   - Use "Test Connection" to verify setup

3. **Start exporting highlights**:
   - Select any text while reading
   - Click "Export to flomo" in the popup menu
   - Check your flomo account for the exported note

## Usage

### Exporting Individual Highlights

1. **Select text**: Highlight any text in your book
2. **Access export menu**: The popup menu will appear with various options
3. **Click "Export to flomo"**: The flomo export option will be available if configured
4. **Confirmation**: You'll receive a success/failure notification

### Bulk Export from Library

1. **Navigate to Library**: Go to your book library/collection
2. **Right-click on book**: Right-click on any book to open context menu
3. **Select export option**: Choose from:
   - **Export notes to flomo**: Export all notes from the book
   - **Export highlights to flomo**: Export all highlights from the book
   - **Export all to flomo**: Export both notes and highlights
4. **Monitor progress**: Watch real-time progress updates during export
5. **Completion notification**: Receive summary of successful/failed exports

#### Bulk Export Features
- **Smart batching**: Automatic delays between exports to prevent API rate limiting
- **Progress tracking**: Real-time feedback on export progress
- **Error handling**: Individual item failures don't stop the entire process
- **Statistics display**: Shows count of notes/highlights before export

### Content Format

Exported highlights follow this format:

```
📖 《Book Title》- Author Name

"Your highlighted text content"

📍 Chapter Name | 页码：42 | 位置：25%
🏷️ #读书笔记 #KoodoReader
```

### Settings Management

- **Enable/Disable**: Toggle flomo integration on/off
- **Webhook URL**: Configure your unique flomo webhook URL
- **Test Connection**: Verify your webhook is working correctly
- **Clear Configuration**: Remove webhook URL if needed

## Technical Implementation

### Architecture

The flomo integration consists of several components:

1. **FlomoService** (`src/utils/service/flomoService.ts`):
   - Core service handling API communication
   - Content formatting and validation
   - Error handling and user feedback

2. **PopupOption Component** (`src/components/popups/popupOption/component.tsx`):
   - Integration with text selection popup
   - User interaction handling
   - Export trigger functionality

3. **FlomoSetting Component** (`src/containers/settings/flomoSetting/`):
   - Configuration interface
   - Webhook URL management
   - Connection testing

### API Integration

The integration uses flomo's webhook API:
- **Method**: POST
- **Content-Type**: application/json
- **Payload**: `{ "content": "formatted_note", "source": "Koodo Reader" }`

### Configuration Storage

Settings are stored using Koodo Reader's ConfigService:
- `isEnableFlomo`: Boolean flag for feature enablement
- `flomoWebhookUrl`: User's webhook URL

## Error Handling

The integration includes comprehensive error handling:

### Network Errors
- Connection timeouts
- DNS resolution failures
- Server unavailability

### Configuration Errors
- Invalid webhook URL format
- Missing webhook URL
- Disabled integration

### User Feedback
- Loading states during export
- Success confirmations
- Detailed error messages
- Actionable error guidance

## Security Considerations

- **Webhook URL**: Treated as sensitive data, stored locally
- **HTTPS Only**: Only HTTPS webhook URLs are accepted
- **No Data Logging**: Exported content is not logged or stored
- **Local Configuration**: All settings stored locally on user's device

## Troubleshooting

### Common Issues

1. **"flomo is not configured"**:
   - Ensure flomo integration is enabled in settings
   - Verify webhook URL is properly configured

2. **"Invalid webhook URL format"**:
   - Check that URL starts with `https://flomoapp.com/mine/`
   - Ensure URL is copied correctly from flomo settings

3. **"Connection test failed"**:
   - Verify internet connectivity
   - Check if flomo service is accessible
   - Confirm webhook URL is still valid

4. **"Network error occurred"**:
   - Check internet connection
   - Try again after a few moments
   - Verify flomo service status

### Debug Steps

1. Test webhook URL directly in browser
2. Verify flomo PRO account status
3. Check Koodo Reader console for detailed error messages
4. Try disabling and re-enabling the integration

## Limitations

- Requires flomo PRO account
- Internet connection required for export
- Limited to text content (no images or formatting)
- Webhook URL must be manually configured

## Future Enhancements

Potential improvements for future versions:
- Batch export of multiple highlights
- Custom content formatting options
- Integration with flomo tags and categories
- Offline queue for failed exports
- Auto-sync of reading progress

## Support

For issues related to:
- **Koodo Reader**: Check the main project documentation
- **flomo service**: Contact flomo support
- **Integration bugs**: Report to Koodo Reader issue tracker

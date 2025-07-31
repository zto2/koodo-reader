# Koodo Reader - Comprehensive Codebase Analysis

## Project Overview

Koodo Reader is a cross-platform ebook reader application built with modern web technologies and packaged as an Electron desktop application. It supports multiple ebook formats and provides a rich reading experience with extensive customization options.

## Technology Stack

### Core Technologies
- **Frontend Framework**: React 17.0.2 with TypeScript
- **Desktop Framework**: Electron 34.0.1
- **State Management**: Redux with Redux Thunk
- **Routing**: React Router DOM 5.2.0
- **Styling**: CSS with custom stylesheets
- **Build Tool**: React Scripts 5.0.1 (Create React App)
- **Package Manager**: Yarn (based on yarn.lock presence)

### Key Dependencies
- **Database**: better-sqlite3 for local data storage
- **File Processing**: 
  - JSZip for archive handling
  - mammoth for DOCX processing
  - marked for Markdown rendering
  - rangy for text selection/manipulation
- **UI Components**: 
  - react-tooltip for tooltips
  - react-hot-toast for notifications
  - react-lottie for animations
  - react-sortablejs for drag-and-drop
- **Cloud Storage**: AWS SDK, WebDAV, SSH2-SFTP, MEGA.js
- **Internationalization**: i18next with react-i18next

## Architecture Overview

### Application Structure
```
src/
├── assets/          # Static resources (images, styles, locales, libraries)
├── components/      # Reusable UI components
├── constants/       # Application constants and configuration lists
├── containers/      # Container components with business logic
├── models/          # TypeScript data models
├── pages/           # Main application pages
├── router/          # Routing configuration
├── store/           # Redux store, actions, and reducers
└── utils/           # Utility functions and services
```

### Main Application Pages
1. **Manager Page** (`/manager/*`): Book library management interface
2. **Reader Page** (`/epub`, `/pdf`, etc.): Reading interface for different formats
3. **Login Page** (`/login`): User authentication
4. **Redirect Page** (`/`): Default route handler

### Core Models
- **Book**: Main book entity with metadata (title, author, format, etc.)
- **HtmlBook**: Extended book model for rendered content with chapters and rendition
- **Note**: User annotations and notes
- **Bookmark**: Reading position markers
- **BookLocation**: Reading progress tracking

## Key Functional Areas

### 1. Reading Interface
- **Viewer Component**: Core reading interface with book rendering
- **Navigation Panel**: Table of contents, bookmarks, and search
- **Settings Panel**: Reading preferences and customization
- **Operation Panel**: Reading controls and tools
- **Multiple Reading Modes**: Single page, double page, continuous scroll

### 2. Book Management
- **Book Library**: Grid/list/cover view modes with pagination
- **Import System**: Local files and cloud storage integration
- **Format Support**: EPUB, PDF, MOBI, AZW3, TXT, FB2, CBR/CBZ, DOCX, MD, HTML
- **Metadata Management**: Cover images, descriptions, reading progress

### 3. Export Functionality (Current)
Located in `src/utils/file/export.ts`:
- **Book Export**: Individual books or batch export as ZIP files
- **Notes Export**: CSV format with book metadata
- **Highlights Export**: CSV format for highlighted text
- **Dictionary History Export**: CSV format for looked-up words
- **Backup System**: Complete data backup including books, notes, and configuration

### 4. Settings and Configuration
- **ConfigService**: Centralized configuration management
- **Reading Settings**: Font, theme, layout, behavior customization
- **Sync Settings**: Cloud storage configuration
- **General Settings**: Application behavior and preferences
- **Plugin System**: Extensible functionality through plugins

### 5. Data Storage and Synchronization
- **Local Database**: SQLite database for books, notes, bookmarks
- **Cloud Sync**: Multiple cloud storage providers support
- **Configuration Sync**: Settings synchronization across devices
- **Backup/Restore**: Complete data backup and restoration

### 6. User Interface Components
- **Responsive Design**: Adapts to different screen sizes
- **Theme System**: Multiple color themes and dark mode
- **Internationalization**: Support for 20+ languages
- **Touch Support**: Mobile-friendly interactions
- **Accessibility**: Screen reader and keyboard navigation support

## Development Environment

### Build Scripts
- `npm start`: Development server
- `npm run build`: Production build
- `npm run dev`: Concurrent React + Electron development
- `npm run release`: Electron app packaging
- `npm run rebuild`: Native module rebuilding

### Platform Support
- **Desktop**: Windows, macOS, Linux (via Electron)
- **Web**: Browser-based version
- **Mobile**: Android and iOS (separate builds)

## File Associations
The application registers handlers for:
- EPUB, PDF, MOBI, AZW3, AZW files
- Comic formats: CBR, CBZ, CBT, CB7
- Text formats: TXT, FB2, DOCX, MD, HTML, XML

## Key Strengths
1. **Comprehensive Format Support**: Wide range of ebook formats
2. **Cross-Platform**: Consistent experience across platforms
3. **Rich Feature Set**: Annotations, bookmarks, themes, sync
4. **Extensible Architecture**: Plugin system and modular design
5. **Modern Tech Stack**: React, TypeScript, Electron
6. **Cloud Integration**: Multiple cloud storage providers
7. **Internationalization**: Extensive language support

## Areas for Enhancement
1. **Export Functionality**: Limited to basic CSV and ZIP formats
2. **Statistics Dashboard**: No comprehensive reading analytics
3. **Advanced Search**: Basic search functionality
4. **Collaboration Features**: No sharing or social features
5. **Advanced Annotations**: Limited annotation types
6. **Performance**: Large library handling could be optimized

This analysis provides a solid foundation for implementing various enhancements to the Koodo Reader application.

# Collection Compatibility Guide

## Overview

The Open Bible Stories app supports collections that follow the **Door43 OBS format standards**. This guide explains what makes a collection compatible and how to troubleshoot issues.

## ✅ Supported Collections

### Required Structure
Collections must have one of the following directory structures:

**Standard Format (content directory):**
```
repository-root/
└── content/
    ├── 01.md    # Story 1: The Creation
    ├── 02.md    # Story 2: Sin Enters the World
    ├── 03.md    # Story 3: The Flood
    ├── ...
    └── 50.md    # Story 50: Jesus Returns
```

**Burrito Format (ingredients directory):**
```
repository-root/
└── ingredients/
    ├── 01.md    # Story 1: The Creation
    ├── 02.md    # Story 2: Sin Enters the World
    ├── 03.md    # Story 3: The Flood
    ├── ...
    └── 50.md    # Story 50: Jesus Returns
```

### Content Format Requirements

#### 1. Sequential Numbering
- Files must be numbered **01.md** through **50.md**
- Zero-padded numbers (01, 02, not 1, 2)
- All 50 stories must be present

#### 2. Markdown Format
Each story file should follow this structure:

```markdown
# Story Title

![Image Description](image-url)

Text content for frame 1.

![Image Description](image-url)

Text content for frame 2.

![Image Description](image-url)

Text content for frame 3.

_Story source reference_
```

#### 3. Frame Structure
- Each frame consists of an image and text
- Images use standard markdown syntax: `![alt](url)`
- Text follows immediately after the image
- Frames are separated by blank lines

#### 4. Source References
- Last non-blank line should contain biblical source reference
- Format: `_Source reference text_` (text between underscores)
- Example: `_A story from Genesis 1-5_`
- This provides biblical context for each story

## 🟡 Unsupported Collections

### Common Issues

#### Missing Required Directory
```
❌ repository-root/
    ├── 01.md     # Wrong: files in root
    ├── 02.md
    └── ...
```
**Note:** Must have either a `content/` or `ingredients/` directory.

#### Non-Sequential File Numbering
```
❌ content/    # or ingredients/
    ├── 1.md      # Wrong: not zero-padded
    ├── 2.md
    ├── story3.md # Wrong: different naming
    └── ...
```

#### Non-Markdown Files
```
❌ content/    # or ingredients/
    ├── 01.txt    # Wrong: not markdown
    ├── 02.docx   # Wrong: not markdown
    └── ...
```

#### Incomplete Collection
```
❌ content/    # or ingredients/
    ├── 01.md
    ├── 02.md
    └── 03.md     # Wrong: missing stories 4-50
```

## 🔧 Collection Validation

### Automatic Validation
The app automatically validates collections before allowing downloads:

1. **Structure Check**: Verifies `content/` or `ingredients/` directory exists
2. **File Count**: Ensures all 50 stories are present
3. **Naming Convention**: Validates sequential numbering (01.md-50.md)
4. **Content Format**: Checks for proper markdown structure

### Validation Status Indicators

| Icon | Status | Description |
|------|--------|-------------|
| ✅ | **Supported** | Collection meets all requirements |
| 🔧⏱️ | **Unsupported** | Collection has structural issues |
| 📥 | **Downloadable** | Ready for download |
| 📱 | **Downloaded** | Already available offline |

### Implementation Details
- Validation via `CollectionsManager.validateCollectionStructure()`
- Status returned by `getRemoteCollectionsByLanguage()`
- Invalid collections marked with `isValid: false`

## 🌍 Language Support

### Language Detection
- Automatic language detection from collection metadata
- ISO language codes (e.g., "en", "es", "fr")
- RTL (Right-to-Left) support for Arabic, Hebrew, etc.

### Collection Naming
Collections typically follow this pattern:
- `[language]_obs` (e.g., `en_obs`, `es_obs`, `fr_obs`)
- Language code + "_obs" suffix
- Consistent with Door43 repository naming

## 🚫 Legacy Format Issues

### Common Legacy Problems

#### Old Repository Structure
Some older repositories may have:
- Stories in root directory instead of `content/` or `ingredients/`
- Different file naming conventions
- Non-standard markdown formatting

#### Migration Requirements
Legacy collections need updating by content creators:
1. Move files to `content/` or `ingredients/` directory
2. Rename files to use zero-padded numbering
3. Ensure all 50 stories are present
4. Validate markdown formatting

## 🔍 Troubleshooting

### Collection Not Showing Up

#### Check Repository Structure
1. Verify the repository has a `content/` or `ingredients/` directory
2. Count files - should be exactly 50 markdown files
3. Check file naming: 01.md, 02.md, ..., 50.md

#### Validate Content Format
1. Open a few story files
2. Ensure they use markdown syntax
3. Check for proper frame structure (image + text)
4. Verify source references are included

### Collection Shows as Unsupported

#### Common Fixes
1. **Add missing required directory** (either `content/` or `ingredients/`)
2. **Rename files** to use zero-padded numbers (01.md not 1.md)
3. **Add missing stories** - all 50 must be present
4. **Convert to markdown** if using other formats

#### Repository Owner Actions
If you're a repository owner:
1. Follow the required structure guidelines (use either format)
2. Test with the OBS app before publishing
3. Update legacy repositories to new format
4. Contact support if validation still fails

### Getting Help

#### For Users
If you encounter a collection that should work but shows as unsupported:

1. **Create an Issue**: [GitHub Issues](https://github.com/unfoldingword/obs-app/issues)
2. **Include Details**:
   - Language name and ISO code
   - Repository URL
   - Expected vs. actual behavior
   - Screenshots if applicable

#### For Content Creators
If you're creating or maintaining OBS collections:

1. **Follow Structure Guidelines**: Use either the `content/` or `ingredients/` format shown above
2. **Test Before Publishing**: Download with the app to verify
3. **Check Examples**: Look at working collections for reference
4. **Contact Support**: Reach out if you need assistance

## 📚 Example Collections

### Working Examples
- **English**: `en_obs` - Standard reference implementation
- **Spanish**: `es_obs` - Example of proper localization
- **French**: `fr_obs` - Another working multilingual example

### Reference Implementation
For the most up-to-date example of proper structure, check the official English OBS repository as a reference for your language adaptation.

## 🔄 Collection Updates

### Automatic Updates
- App checks for collection updates periodically
- Users notified when updates are available
- Can re-download to get latest content

### Version Management
- Collections can include version metadata
- App tracks download timestamps
- Users can manage storage by removing old collections

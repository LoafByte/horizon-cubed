# Search Bar Implementation Plan

## Overview
Transform the current modal-based search into a visible, centered search bar positioned below the header with predictive search functionality.

## Current Implementation Analysis

### Existing Search System
- **Location**: [`snippets/search.liquid`](snippets/search.liquid:1)
- **Type**: Modal-triggered search (icon button opens dialog)
- **Modal**: [`snippets/search-modal.liquid`](snippets/search-modal.liquid:1)
- **Predictive Search**: Already implemented in modal with [`predictive-search.js`](snippets/search-modal.liquid:7)
- **Header Integration**: Search icon positioned via [`header-row.liquid`](snippets/header-row.liquid:67) based on settings

### Header Structure
The header in [`sections/header.liquid`](sections/header.liquid:1) uses a row-based system:
- **Top Row**: Contains logo, menu, search icon, actions, localization
- **Bottom Row**: Optional row for additional elements (menu, search, localization)
- **Mobile Navigation Bar**: Separate mobile menu row

Key variables:
- `search_style` (line 9): Controls search display ('none' or 'modal')
- `search_position` (lines 70-90): Controls left/right positioning
- `search_row` (lines 123-131): Controls top/bottom row placement

## Implementation Strategy

### 1. Create Inline Search Bar Component

**New File**: `snippets/search-bar-inline.liquid`

This will be a new snippet that:
- Displays a visible search input field (not a button)
- Includes the search icon inside the input
- Integrates predictive search dropdown
- Uses similar styling to the modal search but adapted for inline display
- Maintains accessibility features

**Key Features**:
```liquid
- <predictive-search-component> wrapper
- Visible <input type="search"> field
- Search icon positioned inside input (left side)
- Predictive results dropdown below input
- Centered layout with max-width constraint
- Responsive padding and sizing
```

### 2. Modify Header Structure

**File**: [`sections/header.liquid`](sections/header.liquid:274)

Add a new dedicated search row after the existing header rows (after line 357):

```liquid
{% if section.settings.show_inline_search %}
  <div class="header__row header__row--search color-{{ section.settings.color_scheme_search }} section section--full-width-margin">
    <div class="header__search-container">
      {% render 'search-bar-inline' %}
    </div>
  </div>
{% endif %}
```

**Location**: Insert after the closing `{% endfor %}` loop (line 351) and before the mobile navigation bar (line 353)

### 3. Add CSS Styling

**Approach**: Use inline `{% stylesheet %}` blocks in the new snippet

**Key Styles**:
```css
.header__row--search {
  /* Dedicated search row styling */
  padding-block: var(--padding-sm);
  border-bottom: var(--border-width) solid var(--color-border);
}

.header__search-container {
  /* Center the search bar */
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding-inline: var(--page-margin);
}

.search-bar-inline {
  /* Search bar component */
  position: relative;
  width: 100%;
}

.search-bar-inline__input {
  /* Input field styling */
  width: 100%;
  padding: var(--padding-sm) var(--padding-xl);
  padding-left: calc(var(--icon-size-lg) + var(--padding-lg));
  border: var(--style-border-width-inputs) solid var(--color-input-border);
  border-radius: var(--style-border-radius-inputs);
  background-color: var(--color-input-background);
  font-size: var(--font-paragraph--size);
}

.search-bar-inline__icon {
  /* Search icon inside input */
  position: absolute;
  left: var(--padding-md);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-bar-inline__results {
  /* Predictive search dropdown */
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--margin-2xs);
  background: var(--color-background);
  border: var(--style-border-width) solid var(--color-border);
  border-radius: var(--style-border-radius-popover);
  box-shadow: var(--shadow-popover);
  max-height: 60vh;
  overflow-y: auto;
  z-index: var(--layer-overlay);
}
```

### 4. Predictive Search Integration

**Reuse Existing Components**:
- [`predictive-search.js`](snippets/search-modal.liquid:7) - Already handles search logic
- [`predictive-search-empty-state.liquid`](snippets/search-modal.liquid:112) - Empty state display
- [`predictive-search-products-list.liquid`](snippets/predictive-search-products-list.liquid:1) - Product results
- [`predictive-search-resource-carousel.liquid`](snippets/predictive-search-resource-carousel.liquid:1) - Other results

**Implementation**:
```liquid
<predictive-search-component
  class="search-bar-inline"
  data-section-id="inline-search"
  role="search"
>
  <form action="{{ routes.search_url }}" method="get">
    <div class="search-bar-inline__wrapper">
      <span class="search-bar-inline__icon">
        {{ 'icon-search.svg' | inline_asset_content }}
      </span>
      <input
        type="search"
        name="q"
        class="search-bar-inline__input"
        placeholder="{{ 'content.search_input_placeholder' | t }}"
        autocomplete="off"
        ref="searchInput"
        on:input="/search"
      />
      <input name="options[prefix]" type="hidden" value="last">
    </div>
    
    <div class="search-bar-inline__results" ref="predictiveSearchResults" hidden>
      <!-- Predictive search results rendered here -->
    </div>
  </form>
</predictive-search-component>
```

### 5. Settings Schema Updates

**File**: [`sections/header.liquid`](sections/header.liquid:755) (schema section)

Add new settings:

```json
{
  "type": "header",
  "content": "Inline Search Bar"
},
{
  "type": "checkbox",
  "id": "show_inline_search",
  "label": "Show inline search bar",
  "info": "Display a search bar below the header instead of a search icon",
  "default": false
},
{
  "type": "color_scheme",
  "id": "color_scheme_search",
  "label": "Search bar color scheme",
  "default": "primary",
  "visible_if": "{{ section.settings.show_inline_search }}"
}
```

**Logic Update**: Modify search icon visibility (around line 11):
```liquid
{% if section.settings.show_search and section.settings.show_inline_search == false %}
  assign search_style = 'modal'
{% endif %}
```

### 6. Responsive Behavior

**Mobile Considerations**:
- Reduce max-width on mobile (e.g., `calc(100% - var(--page-margin) * 2)`)
- Adjust padding for smaller screens
- Ensure touch-friendly input size (min 44px height)
- Predictive results should be full-width on mobile

**Desktop Considerations**:
- Fixed max-width (600px) for centered appearance
- Larger padding for comfortable interaction
- Dropdown results constrained to search bar width

```css
@media screen and (max-width: 749px) {
  .header__search-container {
    max-width: 100%;
    padding-inline: var(--padding-xs);
  }
  
  .search-bar-inline__input {
    font-size: max(1rem, var(--font-paragraph--size)); /* Prevent iOS zoom */
    min-height: 44px;
  }
}

@media screen and (min-width: 750px) {
  .header__search-container {
    max-width: 600px;
  }
}
```

## Implementation Steps

### Step 1: Create Search Bar Snippet
- [ ] Create `snippets/search-bar-inline.liquid`
- [ ] Add predictive search component structure
- [ ] Include search input with icon
- [ ] Add results dropdown container
- [ ] Include inline CSS styles

### Step 2: Modify Header
- [ ] Update [`sections/header.liquid`](sections/header.liquid:274)
- [ ] Add conditional logic for inline search display
- [ ] Insert new search row after existing rows
- [ ] Update search icon visibility logic

### Step 3: Update Settings
- [ ] Add `show_inline_search` checkbox setting
- [ ] Add `color_scheme_search` color scheme setting
- [ ] Add conditional visibility rules

### Step 4: Test & Refine
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Chrome Mobile)
- [ ] Verify predictive search functionality
- [ ] Check keyboard navigation
- [ ] Validate accessibility (screen readers, focus states)
- [ ] Test with different color schemes

## Technical Considerations

### Z-Index Management
- Search bar row: `z-index: var(--layer-flat)`
- Predictive results dropdown: `z-index: var(--layer-overlay)`
- Ensure dropdown appears above other content

### Performance
- Reuse existing predictive search JavaScript
- Lazy load predictive results
- Debounce search input (already handled by existing JS)

### Accessibility
- Maintain ARIA labels and roles
- Ensure keyboard navigation works
- Provide clear focus indicators
- Screen reader announcements for results

### Sticky Header Compatibility
- If header is sticky, search bar should stick with it
- Adjust z-index accordingly
- Consider dropdown positioning when scrolled

## Files to Create/Modify

### New Files
1. `snippets/search-bar-inline.liquid` - Main inline search bar component

### Modified Files
1. [`sections/header.liquid`](sections/header.liquid:1) - Add search row and settings
2. Potentially [`assets/predictive-search.js`](snippets/search-modal.liquid:7) - May need minor adjustments for inline context

## Rollback Plan

If issues arise:
1. Set `show_inline_search` to `false` in theme settings
2. Original modal search remains functional
3. No breaking changes to existing functionality

## Future Enhancements

- [ ] Add animation for search bar appearance
- [ ] Add option to toggle between modal and inline
- [ ] Add search suggestions/popular searches
- [ ] Add recent searches functionality
- [ ] Add voice search capability

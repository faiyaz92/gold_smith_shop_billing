# Section Badge System

A reusable component system for adding numbered section badges to UI components for better AI context and developer experience.

## Components

### SectionBadge
A component that displays numbered section badges with customizable colors and labels.

```tsx
import { SectionBadge } from '@/components/SectionBadge';

// Basic usage
<SectionBadge id={1} label="Order Details" />

// With custom color and devMode override
<SectionBadge id={2} label="User Info" color="blue" devMode={true} />
```

**Props:**
- `id: number` - Section number (required)
- `label: string` - Section label (required)
- `devMode?: boolean` - Override global dev mode setting
- `color?: 'gray' | 'purple' | 'blue' | 'orange' | 'green' | 'red' | 'yellow'` - Badge color theme
- `className?: string` - Additional CSS classes

### DevModeToggle
A dashboard component that provides global control over section badge visibility.

```tsx
import { DevModeToggle } from '@/components/DevModeToggle';

// Add to dashboard header
<DevModeToggle />
```

## Global Configuration

### SHOW_SECTION_BADGES Constant
Set this to `true` in `SectionBadge.tsx` to show badges globally:
```tsx
export const SHOW_SECTION_BADGES = true; // Set to true to show badges everywhere
```

### LocalStorage Setting
The system also checks `localStorage.getItem('goldsmith-dev-mode')` for persistent dev mode setting.

## Usage Examples

### In a Component
```tsx
import { SectionBadge, useDevMode } from '@/components/SectionBadge';

function MyComponent() {
  const { devMode } = useDevMode();

  return (
    <div>
      <SectionBadge id={1} label="Basic Info" devMode={devMode} color="gray" />

      <div className="p-4">
        {/* Component content */}
      </div>

      <SectionBadge id={2} label="Advanced Settings" devMode={devMode} color="blue" />
    </div>
  );
}
```

### In Dashboard
```tsx
import { DevModeToggle } from '@/components/DevModeToggle';

function Dashboard() {
  return (
    <div>
      <header className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <DevModeToggle />
      </header>

      {/* Dashboard content */}
    </div>
  );
}
```

## Color Themes

- `gray` - Default, neutral sections
- `purple` - Form sections, input areas
- `blue` - Information displays, calculations
- `orange` - Warnings, additional actions
- `green` - Success states, actions
- `red` - Error states, critical sections
- `yellow` - Highlights, important notices

## Benefits

1. **AI Context**: Numbered sections make it easy to reference specific UI areas
2. **Developer Experience**: Toggle visibility without code changes
3. **Consistent Design**: Standardized badge appearance across the app
4. **Zero Production Impact**: Completely hidden when dev mode is off
5. **Persistent Settings**: Remembers user preference via localStorage

## Current Implementation

- ✅ Orders page pickup dialog (Sections 1-5)
- ✅ Dashboard toggle button
- ✅ Global dev mode control
- ✅ LocalStorage persistence
- ✅ Multiple color themes

## Future Enhancements

- Add section badges to other pages (customers, inventory, etc.)
- Create a section registry for automatic numbering
- Add keyboard shortcuts for toggling dev mode
- Export section map for documentation
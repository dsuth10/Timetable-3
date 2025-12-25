# Research: Task Card Enhancements

**Feature**: `008-each-task-card`
**Status**: Completed

## Decision Log

### Decision: Icon Library Choice
- **Decision**: Use `@mui/icons-material` (Park, School, Groups, Person).
- **Rationale**: Already used in the project, provides a consistent look and feel, and matches the user's description.
- **Alternatives considered**: FontAwesome (not installed), custom SVGs (overly complex for this requirement).

### Decision: Layout of Icons and Text
- **Decision**: Use a flexible `Box` with `flexDirection: row` for the card content. Icons will be on the right in a vertical or horizontal stack depending on height, and text will be on the left with `textOverflow: ellipsis`.
- **Rationale**: Matches the clarification that icons should be on the right and text on the left. Flexbox allows for easy scaling and wrapping.
- **Alternatives considered**: Absolute positioning (harder to manage with wrapping text).

### Decision: Classroom Badge/Chip
- **Decision**: Use the MUI `Chip` component with `variant="outlined"` and `icon={<School />}`.
- **Rationale**: Matches the user's provided image from the task bank. Provides a clean, distinct look for classroom information.
- **Alternatives considered**: Plain text with icon (less visual structure).

### Decision: Multi-Aide Display in Class View
- **Decision**: Map through assigned aides and `join(', ')`.
- **Rationale**: Simple and meets the user's clarified requirement for displaying multiple aide names.
- **Alternatives considered**: Tooltips (less "at-a-glance"), Chips for each aide (might take up too much space).

## Technical Unknowns Resolved
- **Unknown**: How to handle icons in very small cards?
- **Resolution**: Use conditional rendering or CSS scaling (transform: scale) if the height is below a certain threshold. Prioritize title and icons as per Option D clarification.
- **Unknown**: What if a task has no classroom?
- **Resolution**: Display the generic `School` icon as clarified.

## Best Practices
- **Component Reusability**: Ensure `TaskCard` remains the primary component for all timetable views, using props to toggle between "Aide Mode" and "Class Mode".
- **Performance**: Use `memo` on `TaskCard` to prevent unnecessary re-renders during drag operations.


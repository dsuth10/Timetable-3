# Research: Daily Display Timetable Implementation

## Topic: Horizontal Timeline with Sticky Columns
- **Decision**: Use `display: sticky` on the first column of a CSS Grid or a standard table-like structure.
- **Rationale**: Modern browsers support `position: sticky` natively for grid and flex items. This avoids complex scroll-syncing logic between separate header and body containers.
- **Alternatives considered**: Separate `AideList` and `ScrollableTimeline` containers synced via a custom scroll hook. Rejected due to maintenance complexity and potential performance lag (jank).

## Topic: Drag and Drop between Fixed and Scrolling Panels
- **Decision**: Use `@hello-pangea/dnd`.
- **Rationale**: It is already specified in the project constitution and handles horizontal/vertical lists well. We will define the `TaskBank` as a `Droppable` and the `TimelineArea` as a collection of `Droppable` slots.
- **Note**: Dropping into a specific slot in a horizontal scroll container requires ensuring the `Droppable` coordinates are correctly calculated. @hello-pangea/dnd handles this natively by relative positioning.

## Topic: Overlapping Assignment Display
- **Decision**: Use `display: flex` with `flex-direction: column` or `display: grid` within each 30-minute time slot container.
- **Rationale**: When multiple assignments occupy the same slot, the container will share the available height (or width if vertical strips are desired as per user clarification). The clarification specified "thinner strips", which in a horizontal timeline means they should be stacked vertically (thinner height) or horizontally (thinner width) within the slot. Since the timeline is horizontal (time on X axis), overlapping assignments at the SAME time would need to be stacked vertically within the aide's row to be visible, or use a "split" approach where each takes 50% width if they overlap partially.
- **Refinement**: To satisfy "thinner strips side-by-side", we will use a relative container for the time slot and absolute positioning for the assignments, calculating their horizontal positions and widths based on their start/end times. If they overlap, they will be given a reduced height and stacked vertically or a reduced width if they occupy the same sub-slot.

## Topic: Variable Slot Durations
- **Decision**: Use a configuration-driven grid generator.
- **Rationale**: The user mentioned the first slot is 20m and others are 30m. We will define a `TimelineConfig` that maps slots to their start times and durations. The UI will render columns with `grid-template-columns` using `minmax` or specific percentage/fr units derived from these durations.

## Topic: "Reddened Out" Absence Rows
- **Decision**: Apply a CSS class `is-absent` to the `AideRow` container.
- **Rationale**: This class will apply a light red background (`bg-red-50` or similar) and potentially a semi-transparent overlay to "mute" the interactions while keeping existing assignments visible. This matches the existing individual schedule styling.



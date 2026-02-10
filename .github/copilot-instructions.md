
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## Math-ilde Project Specific Guidelines

### Project Overview
Math-ilde is an educational web application for primary school students (ages 6-11) to practice basic arithmetic operations (addition, subtraction, multiplication, division) with visual feedback and representation.

### Target Audience Considerations
- **Design for children:** All UI/UX decisions must prioritize simplicity and clarity for young users
- **Independent usage:** The application must be intuitive enough for a child to use without adult supervision
- **Positive reinforcement:** Always provide encouraging feedback, never punitive messages

### Design System

#### Color Palette
- Use **pastel colors** throughout the application
- Ensure WCAG AA contrast ratios even with soft colors
- Define CSS custom properties for consistent theming:
  - Primary colors (soft pastels)
  - Success color (for correct answers)
  - Encouraging color (for retry messages)
  - Background colors (light, calm tones)

#### Typography
- Use large, clear, sans-serif fonts
- Mathematical operations should be prominently displayed (large font size)
- Ensure readability on both desktop and mobile devices

#### Visual Elements
- All shapes must be **soft and rounded** (border-radius)
- Use simple geometric shapes for visual representations (circles, squares, stars)
- Implement smooth, non-intrusive animations
- Icons and graphics should be child-friendly and joyful

### Component Architecture

#### Core Components
1. **HomeComponent:** Main menu for section selection
2. **Exercise Components:** One for each operation type
   - AdditionSubtractionComponent
   - MultiplicationComponent
   - DivisionComponent
3. **VisualRepresentationComponent:** Reusable component for graphical representation of numbers/operations
4. **OptionsComponent:** Configuration panel for exercise settings

#### Component Structure Pattern
Each exercise component should:
- Use signals for reactive state management
- Display the mathematical operation clearly
- Show visual representation of the operation
- Provide an input field for the answer
- Include a verification button
- Display feedback messages (success/retry)
- Allow configuration of difficulty options

### Business Logic

#### Mathematical Operations Generation
- **Addition:**
  - Generate random numbers within the selected level (10, 100, or 1000)
  - Support 2 or 3 addends
  - Result must be within the level range
- **Subtraction:**
  - Ensure result is always **positive or zero** (never negative)
  - Generate minuend larger than subtrahend
  - For multiple subtrahends, verify the result remains non-negative
- **Multiplication:**
  - Generate appropriate factors based on difficulty level
  - Support simple multiplication tables for lower levels
- **Division:**
  - Generate only divisions with **integer results** (no remainders)
  - Create by multiplying first, then dividing (to ensure integer result)

#### Visual Representation Logic
- **Addition (4 + 2):** Show 4 visual elements + 2 visual elements
- **Subtraction (6 - 2):** Show 6 elements with 2 crossed out or faded
- **Multiplication (3 × 4):** Show 3 groups of 4 elements
- **Division (12 ÷ 3):** Show 12 elements divided into 3 groups

### State Management with Signals

Define signals for:
- `currentOperation` - The current mathematical operation
- `userAnswer` - The answer input by the user
- `showFeedback` - Whether to display feedback
- `isCorrect` - Whether the answer is correct
- `exerciseOptions` - Current configuration (type, level, number of operands)

Use computed signals for:
- `correctAnswer` - Calculated result of the operation
- `visualElements` - Array of elements to display graphically
- `feedbackMessage` - Dynamic feedback based on result

### Routing Structure
```
/                      → Home menu
/addizioni-sottrazioni → Addition and subtraction exercises
/moltiplicazioni       → Multiplication exercises
/divisioni             → Division exercises
```

Implement lazy loading for each section route.

### Accessibility Requirements (Child-Focused)
- Large touch targets (minimum 44x44px)
- Clear focus indicators for keyboard navigation
- Screen reader support with appropriate ARIA labels in Italian
- Support for keyboard-only navigation (arrow keys, Enter, Space)
- No time pressure or auto-advancing content

### Feedback Messages (Italian)
**Success messages (rotate randomly):**
- "Bravo!"
- "Perfetto!"
- "Complimenti!"
- "Ottimo lavoro!"
- "Sei un campione!"

**Retry messages (always encouraging):**
- "Ritenta!"
- "Prova ancora!"
- "Quasi! Riprova!"
- "Puoi farcela!"

### Implementation Priorities
1. Start with Addition/Subtraction section (most fundamental)
2. Implement visual representation system
3. Create positive feedback system
4. Add Multiplication section
5. Add Division section
6. Polish and optimize UX

### Testing Considerations
- Test with actual target age group if possible
- Verify all operations generate valid results (no negative numbers, no remainders)
- Ensure visual representations match the operations correctly
- Validate accessibility with keyboard-only navigation
- Check color contrast ratios meet WCAG AA standards

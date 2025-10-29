# Zama DEX Design Guidelines

## Design Approach
**Selected Framework**: Material Design with DeFi-specific patterns
**Reference Inspiration**: Uniswap, Curve Finance, 1inch (industry-leading DEX interfaces)
**Core Principle**: Trust, precision, and clarity for encrypted financial transactions

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for addresses, hashes, numeric values)

**Type Scale**:
- Hero numbers (balances, amounts): text-4xl font-bold (36px)
- Page headers: text-2xl font-semibold (24px)
- Section titles: text-lg font-semibold (18px)
- Body text: text-base font-medium (16px)
- Labels/captions: text-sm font-medium (14px)
- Micro-text (timestamps, status): text-xs font-normal (12px)
- Token symbols: text-sm font-bold uppercase
- Numeric displays: Use monospace font with tabular-nums

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Card spacing: space-y-4 or space-y-6
- Inline elements: gap-2 or gap-4

**Grid Structure**:
- Max container width: max-w-7xl mx-auto
- Main trading interface: Single column on mobile, max-w-md centered on desktop
- Portfolio/Analytics: Grid layout - grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Transaction table: Full-width responsive table

**Component Sizing**:
- Input fields: h-12 (48px) for better touch targets
- Buttons: h-12 primary actions, h-10 secondary
- Cards: min-h-[120px] for balance cards
- Modals: max-w-lg for settings, max-w-2xl for pool creation

## Core Components

**Navigation Header**:
- Fixed top navigation with h-16
- Logo/brand left-aligned
- Tab navigation centered (Swap, Liquidity, Portfolio, Analytics)
- Wallet connection button right-aligned (h-10 px-6)
- Settings icon button (h-10 w-10)

**Trading Card (Swap/Liquidity)**:
- Rounded-2xl card with p-6
- Token selector: Dropdown with token icon + symbol, h-12
- Amount input: text-2xl font-bold with monospace numbers
- Balance display below input: text-sm with "Max" button
- Swap direction arrow: Centered, h-10 w-10 rounded-full button
- Action button: w-full h-12 rounded-xl font-semibold
- Transaction summary: Bordered section with p-4, text-sm details

**Balance/Portfolio Cards**:
- Grid of token balance cards
- Each card: p-6 rounded-xl
- Token icon + symbol at top
- Encrypted state indicator (Lock icon)
- Balance: text-3xl font-bold monospace
- Decrypt/View toggle: Icon button h-8 w-8
- USD value below: text-sm opacity-70

**Transaction History Table**:
- Sticky header row with font-semibold text-sm
- Row height: h-16 with hover state
- Columns: Type icon, Tokens, Amount (monospace), Time, Status badge, Actions
- Status badges: Rounded-full px-3 py-1 text-xs font-medium
- Filter dropdown above table: h-10 with Filter icon

**Charts/Analytics**:
- Price chart container: h-64 rounded-xl p-6
- Stat cards in grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Each stat: p-4 rounded-lg with icon, label (text-sm), value (text-2xl font-bold)

**Modals/Overlays**:
- Backdrop: Fixed inset with backdrop-blur-sm
- Modal container: rounded-2xl p-6 max-w-lg
- Header: Flex justify-between items-center with close button
- Content: space-y-6
- Actions: Flex gap-4 at bottom

**Settings Panel**:
- Slide-in from right: Fixed right-0 top-16 w-80
- Sections divided by borders with py-4
- Slippage presets: Grid of button pills (0.1%, 0.5%, 1%)
- Custom input with % suffix
- Toggle switches for advanced features

## Icon Library
**Selected**: Lucide React (already imported in code)
- Wallet, ArrowDownUp, Droplets, TrendingUp, Lock, Eye, EyeOff, RefreshCw, Settings, X, Plus, Clock, Filter, Download, Activity
- Icon size: w-5 h-5 for inline, w-6 h-6 for standalone buttons

## Interaction Patterns

**Loading States**:
- Processing button: Disabled with RefreshCw spinning icon
- Skeleton loaders: Animate-pulse on cards during data fetch
- Progress indicator: Linear progress bar below header for transactions

**Encrypted/Decrypted Toggle**:
- Default: Show Lock icon with encrypted value (0x...)
- On decrypt: Smooth transition revealing actual value
- Toggle button: Eye/EyeOff icon

**Form Validation**:
- Real-time balance checking with inline warnings
- Insufficient balance: Border accent with warning icon
- Success state: Checkmark icon briefly shown

**Token Selection**:
- Dropdown modal with search input at top
- Token list with icons, symbols, balances
- Each token row: h-14 hover state

## Responsive Breakpoints
- Mobile (<768px): Single column, full-width cards, stacked navigation
- Tablet (768-1024px): 2-column grids, horizontal tabs
- Desktop (>1024px): 3-column grids, optimal trading card width (480px)

## Accessibility Implementation
- All interactive elements: min h-10 (40px) touch targets
- Focus states: ring-2 ring-offset-2 on all interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML: nav, main, section elements
- Form labels: Always visible or sr-only with aria-label
- Loading announcements: aria-live regions for transaction status
- Keyboard navigation: Tab order follows visual flow
- Color-independent status indicators: Icons + text

## Images
No hero images or decorative imagery required. This is a functional trading application where clarity and data take precedence over visual storytelling.
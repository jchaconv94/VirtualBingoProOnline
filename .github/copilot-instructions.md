# VirtualBingoProOnline - AI Agent Instructions

## Project Architecture

**VirtualBingoProOnline** is a React + TypeScript web app for virtual bingo games with admin and player roles. It uses Google Sheets as a backend via Google Apps Script for user management and data persistence.

### Key Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Google Apps Script (GAS) deployed as web app
- **Data**: Google Sheets (users, cartons/cards, game state)
- **Build**: `npm run dev` (Vite dev server), `npm run build` (TSC + Vite bundle)
- **Export**: Excel, PDF, ZIP downloads via jsPDF, jszip, xlsx

### Critical File Structure
- `App.tsx` - Auth state, role-based routing (LoginRegister → PlayerDashboard/GameRoom)
- `components/GameRoom.tsx` - Main admin interface (671 lines) with bingo logic
- `services/googleSheetService.ts` - All API calls to GAS endpoint
- `types.ts` - Interfaces: `UserData`, `BingoCard`, `Participant`, `Winner`, `GameState`
- `contexts/AlertContext.tsx` - Global alert/confirm system (use `useAlert()`)
- `google-apps-script/*.gs` - User registration, login, card generation

## Data Flow & Patterns

### Authentication Flow
1. User enters credentials in `LoginRegister.tsx`
2. `SheetAPI.login()` POSTs to GAS endpoint with `{ action: 'login', usuario, contraseña }`
3. GAS returns `{ success, user: UserData, role: 'admin'|'player', userData }`
4. Frontend stores in sessionStorage: `bingo_user_role`, `bingo_user_data`, `bingo_session`
5. Role determines view: admin → `GameRoom`, player → `PlayerDashboard`

### Bingo Card Logic
- **Generation**: `generateBingoCardNumbers()` creates 5x5 grid (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75), center is 0 (free space)
- **Storage**: Each `Participant` has array of `BingoCard[]` with uuid `id` and `numbers[]` array
- **Import**: Parse Excel/CSV via `parseExcel()`, validate column ranges
- **Patterns**: `WIN_PATTERNS` object defines 17 patterns (FULL, X, CORNERS, FRAME, etc.) as index arrays [0-24]

### LocalStorage Scoping
GameRoom uses prefixed keys for persistence (v1 suffix for backwards compatibility):
```
bingo_participants_v1, bingo_gamestate_v1, bingo_winners_v1, 
bingo_prizes_v1, bingo_title_v1, bingo_sheet_url_v1, bingo_auto_sync_v1
```
**Note**: Credentials never stored locally (except sessionStorage for session state).

### Google Apps Script Integration
- Single endpoint deployed as web app (macro URL in DEFAULT_SHEET_URL)
- All requests via `fetch()` with `Content-Type: text/plain;charset=utf-8`
- Request body: `JSON.stringify({ action: '...', ...params })`
- Responses include `{ success: boolean, data?, message?, role?, user?, cards? }`

## Role System (Critical)

- **Admin**: Can create rooms, draw balls, add/remove participants, manage prizes, export data
- **Player**: Can only view assigned cards, purchase additional cards (if enabled), see winners

Enforce via:
1. `userRole` state in App.tsx
2. `isRoomAdmin` prop passed to GameRoom
3. Conditional renders in components (e.g., GamePanel, PrizesPanel)
4. GAS validates `action` permissions server-side

## Common Patterns

### Alert/Confirm Usage
```tsx
const { showAlert, showConfirm } = useAlert();
await showAlert({ title: 'Success', message: 'Action done', type: 'success' });
const confirmed = await showConfirm({ message: 'Delete?', type: 'confirm' });
```

### API Calls
```tsx
const response = await SheetAPI.login(sheetUrl, user, pass);
if (!response.success) {
  showAlert({ message: response.message || 'Error', type: 'danger' });
  return;
}
```

### Winner Detection
`checkWinners(participants, gameState, selectedPattern)` returns winners for current pattern. Called after each ball draw. Checks all cards against pattern indices.

### Data Export
- Excel: `exportToExcel(participants, winners)` - Downloads multi-sheet workbook
- PDF: `generateBingoCardsPDF(participants)` - One card per page
- ZIP: `downloadAllCardsZip(participants)` - Individual PNG card images

## Build & Deploy

```bash
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Creates dist/ folder (TSC checks, Vite bundles with chunks)
npm run preview      # Test production build locally
```

GAS script deployment: Copy `google-apps-script/CODIGO_COMPLETO_RESTRUCTURED.gs` to Apps Script editor, deploy as new version, update DEFAULT_SHEET_URL if needed.

## Caveats & Known Quirks

1. **sessionStorage vs localStorage**: Session data expires on browser close; config persists across sessions
2. **Free Space Center**: Index 12 is always 0 in bingo card arrays
3. **Pattern Win Validation**: A pattern wins when ALL indices match. CENTER pattern only checks index 12.
4. **GAS Rate Limits**: Multiple concurrent requests may fail; retry logic recommended
5. **No Direct DB**: All state is in localStorage or Google Sheets; no real-time sync (polling via setInterval in GameRoom)

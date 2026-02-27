# SnapPro Camera

## Current State
A full-featured mobile camera app with:
- CameraView with 12 filters, 8 modes, manual (Pro) controls, 20x zoom strip
- GalleryView with localStorage photo storage
- PhotoDetail with editing and save
- qr-code component (useQRScanner hook) is already installed but not wired to any UI

## Requested Changes (Diff)

### Add
- QR Scanner mode accessible from the camera app (a new "QR" mode tab or dedicated button in the mode strip)
- QRScannerView component that:
  - Shows camera viewfinder with scanning overlay (animated scan line + corner brackets)
  - Auto-starts scanning on mount using `useQRScanner` hook
  - Displays the latest decoded QR result prominently (text + copy button + open-link button if URL)
  - Shows history of up to 5 recent scans
  - Switch camera (front/back) button
  - Clear results button
  - Back button to return to camera view

### Modify
- App.tsx: add `"qr"` to the AppView union type and render QRScannerView when view === "qr"
- CameraView: add a "QR" button/tab to open the QR scanner view (calls onQROpen prop)

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/components/QRScannerView.tsx` using the `useQRScanner` hook
   - Full-screen dark layout matching the app's style
   - Animated scanning overlay (CSS keyframes scan line)
   - Result display: latest QR data with copy + open-URL action
   - Recent scan history list
   - Switch camera + Clear + Back buttons
2. Update `App.tsx`:
   - Add `"qr"` to AppView type
   - Render `<QRScannerView onBack={() => setView("camera")} />` when view === "qr"
3. Update `CameraView.tsx`:
   - Add `onQROpen` prop
   - Add QR scan icon button in the top bar (or bottom strip)

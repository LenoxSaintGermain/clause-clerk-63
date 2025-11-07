# Changelog

## 2025-11-07 - Scrolling Behavior Improvements

### Fixed
- **Page-level scrolling issue**: Fixed unwanted whole-page scrolling when interacting with findings in Analysis view
- **Independent panel scrolling**: Both document viewer and analysis panel now scroll independently without affecting each other

### Changed
- **Finding interaction model**: 
  - **Hover**: Now only highlights text in the document viewer without triggering scroll
  - **Click**: Explicitly clicking a finding card now scrolls the document viewer to the relevant clause and highlights it
  - **Accept button**: Maintains existing behavior of scrolling to clause before applying redline

### Technical Updates
- Modified `src/components/FindingCard.tsx`:
  - Added `onSelect` prop for click-based navigation
  - Separated hover highlighting from scroll behavior
  - Added `cursor-pointer` styling and `onClick` handler to card
  
- Modified `src/components/AnalysisPanel.tsx`:
  - Added `onSelect` prop to bubble selection events to parent
  - Passed `onSelect` down to individual FindingCard components

- Modified `src/pages/Index.tsx`:
  - Implemented `handleSelectFinding` callback to manage finding selection and highlighting
  - Added `overflow-hidden` to main container when document is loaded to prevent page-level scroll chaining
  
- Modified `src/utils/highlighter.ts`:
  - Changed `scrollToText` to use `container.scrollTo` instead of `element.scrollIntoView`
  - Ensures only the target container scrolls, not the entire page

- Modified `src/components/ContractViewer.tsx` and `src/components/AnalysisPanel.tsx`:
  - Added `overscroll-contain` CSS class to prevent scroll chaining to parent elements

### Impact
- Users can now freely scroll the document viewer without interference from the analysis panel
- Hovering over findings provides a preview highlight without disruptive auto-scrolling
- Clicking findings provides intentional navigation to specific clauses
- Page remains locked during analysis, preventing browser-level scrolling issues

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { Finding } from '@/types/finding.types';
import { ParsedDocument } from '@/types/document.types';
import { saveState, loadState } from '@/utils/state.utils';
import { contractReducer, initialState } from '@/reducers/contractReducer';

export interface AppState { // Exporting for use in state.utils
  originalContract: string;
  currentContract: string;
  document: ParsedDocument | null;
  findings: Finding[];
  selectedFindingId: string | null;
  isAnalyzing: boolean;
  highlightedText: string;
  previousState: { contract: string; findings: Finding[] } | null;
  viewMode: 'analysis' | 'comparison';
  customInstructions: string;
}

export type Action =
  | { type: 'SET_DOCUMENT'; payload: ParsedDocument }
  | { type: 'SET_FINDINGS'; payload: Finding[] }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_HIGHLIGHTED_TEXT'; payload: string }
  | { type: 'SET_SELECTED_FINDING'; payload: string | null }
  | { type: 'ACCEPT_FINDING'; payload: { id: string; redline: string } }
  | { type: 'DISMISS_FINDING'; payload: string }
  | { type: 'ACCEPT_ALL_FINDINGS' }
  | { type: 'UNDO_ACCEPT_ALL' }
  | { type: 'UPDATE_FINDING_REDLINE'; payload: { id: string; redline: string } }
  | { type: 'INCREMENT_REFINEMENT_COUNT'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'analysis' | 'comparison' }
  | { type: 'SET_CUSTOM_INSTRUCTIONS'; payload: string }
  | { type: 'RESET_STATE' };


interface ContractContextType {
  state: AppState;
  setDocument: (document: ParsedDocument) => void;
  setFindings: (findings: Finding[]) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setHighlightedText: (text: string) => void;
  setSelectedFinding: (id: string | null) => void;
  acceptFinding: (id: string, redline: string) => void;
  dismissFinding: (id: string) => void;
  acceptAllFindings: () => void;
  undoAcceptAll: () => void;
  updateFindingRedline: (id: string, redline: string) => void;
  incrementRefinementCount: (id: string) => void;
  setViewMode: (mode: 'analysis' | 'comparison') => void;
  setCustomInstructions: (instructions: string) => void;
  resetState: () => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contractReducer, loadState() || initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setDocument = useCallback((document: ParsedDocument) => {
    dispatch({ type: 'SET_DOCUMENT', payload: document });
  }, []);

  const setFindings = useCallback((findings: Finding[]) => {
    dispatch({ type: 'SET_FINDINGS', payload: findings });
  }, []);

  const setAnalyzing = useCallback((isAnalyzing: boolean) => {
    dispatch({ type: 'SET_ANALYZING', payload: isAnalyzing });
  }, []);

  const setHighlightedText = useCallback((text: string) => {
    dispatch({ type: 'SET_HIGHLIGHTED_TEXT', payload: text });
  }, []);

  const setSelectedFinding = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_FINDING', payload: id });
  }, []);

  const acceptFinding = useCallback((id: string, redline: string) => {
    dispatch({ type: 'ACCEPT_FINDING', payload: { id, redline } });
  }, []);

  const dismissFinding = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_FINDING', payload: id });
  }, []);

  const acceptAllFindings = useCallback(() => {
    dispatch({ type: 'ACCEPT_ALL_FINDINGS' });
  }, []);

  const undoAcceptAll = useCallback(() => {
    dispatch({ type: 'UNDO_ACCEPT_ALL' });
  }, []);

  const updateFindingRedline = useCallback((id: string, redline: string) => {
    dispatch({ type: 'UPDATE_FINDING_REDLINE', payload: { id, redline } });
  }, []);

  const incrementRefinementCount = useCallback((id: string) => {
    dispatch({ type: 'INCREMENT_REFINEMENT_COUNT', payload: id });
  }, []);

  const setViewMode = useCallback((mode: 'analysis' | 'comparison') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setCustomInstructions = useCallback((instructions: string) => {
    dispatch({ type: 'SET_CUSTOM_INSTRUCTIONS', payload: instructions });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return (
    <ContractContext.Provider
      value={{
        state,
        setDocument,
        setFindings,
        setAnalyzing,
        setHighlightedText,
        setSelectedFinding,
        acceptFinding,
        dismissFinding,
        acceptAllFindings,
        undoAcceptAll,
        updateFindingRedline,
        incrementRefinementCount,
        setViewMode,
        setCustomInstructions,
        resetState,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}

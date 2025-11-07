import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Finding } from '@/types/finding.types';
import { ParsedDocument } from '@/types/document.types';

interface AppState {
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

type Action =
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
  | { type: 'SET_CUSTOM_INSTRUCTIONS'; payload: string };

const initialState: AppState = {
  originalContract: '',
  currentContract: '',
  document: null,
  findings: [],
  selectedFindingId: null,
  isAnalyzing: false,
  highlightedText: '',
  previousState: null,
  viewMode: 'analysis',
  customInstructions: '',
};

function contractReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return {
        ...state,
        document: action.payload,
        originalContract: action.payload.text,
        currentContract: action.payload.text,
        findings: [],
      };

    case 'SET_FINDINGS':
      return {
        ...state,
        findings: action.payload,
      };

    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload,
      };

    case 'SET_HIGHLIGHTED_TEXT':
      return {
        ...state,
        highlightedText: action.payload,
      };

    case 'SET_SELECTED_FINDING':
      return {
        ...state,
        selectedFindingId: action.payload,
      };

    case 'ACCEPT_FINDING': {
      const finding = state.findings.find(f => f.id === action.payload.id);
      if (!finding) return state;

      const updatedContract = state.currentContract.replace(
        finding.originalText,
        action.payload.redline
      );

      return {
        ...state,
        currentContract: updatedContract,
        findings: state.findings.map(f =>
          f.id === action.payload.id
            ? { ...f, status: 'accepted' as const, suggestedRedline: action.payload.redline }
            : f
        ),
      };
    }

    case 'DISMISS_FINDING':
      return {
        ...state,
        findings: state.findings.map(f =>
          f.id === action.payload ? { ...f, status: 'dismissed' as const } : f
        ),
      };

    case 'ACCEPT_ALL_FINDINGS': {
      // Save current state for undo
      const previousState = {
        contract: state.currentContract,
        findings: state.findings,
      };

      let updatedContract = state.currentContract;
      const pendingFindings = state.findings.filter(f => f.status === 'pending');

      // Apply all findings sequentially
      pendingFindings.forEach(finding => {
        updatedContract = updatedContract.replace(
          finding.originalText,
          finding.suggestedRedline
        );
      });

      return {
        ...state,
        currentContract: updatedContract,
        findings: state.findings.map(f =>
          f.status === 'pending' ? { ...f, status: 'accepted' as const } : f
        ),
        previousState,
      };
    }

    case 'UNDO_ACCEPT_ALL':
      if (!state.previousState) return state;
      return {
        ...state,
        currentContract: state.previousState.contract,
        findings: state.previousState.findings,
        previousState: null,
      };

    case 'UPDATE_FINDING_REDLINE':
      return {
        ...state,
        findings: state.findings.map(f =>
          f.id === action.payload.id
            ? { ...f, suggestedRedline: action.payload.redline }
            : f
        ),
      };

    case 'INCREMENT_REFINEMENT_COUNT':
      return {
        ...state,
        findings: state.findings.map(f =>
          f.id === action.payload
            ? { ...f, refinementCount: (f.refinementCount || 0) + 1 }
            : f
        ),
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };

    case 'SET_CUSTOM_INSTRUCTIONS':
      return {
        ...state,
        customInstructions: action.payload,
      };

    default:
      return state;
  }
}

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
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contractReducer, initialState);

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

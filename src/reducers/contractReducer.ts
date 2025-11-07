import { AppState, Action } from '@/contexts/ContractContext';
import { nthIndexOf, replaceNthOccurrence } from '@/utils/replacement.utils';

export const initialState: AppState = {
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

export function contractReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return {
        ...initialState,
        document: action.payload,
        originalContract: action.payload.text,
        currentContract: action.payload.text,
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

      const updatedContract = replaceNthOccurrence(
        state.currentContract,
        finding.originalText,
        action.payload.redline,
        finding.occurrenceIndex
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
      const previousState = {
        contract: state.currentContract,
        findings: state.findings,
      };

      let updatedContract = state.currentContract;
      const pendingFindings = state.findings.filter(f => f.status === 'pending');

      const indexedFindings = pendingFindings.map(finding => {
        const index = nthIndexOf(
          updatedContract,
          finding.originalText,
          finding.occurrenceIndex
        );
        return { ...finding, index };
      }).filter(f => f.index !== -1);

      indexedFindings.sort((a, b) => b.index - a.index);

      indexedFindings.forEach(finding => {
        updatedContract = replaceNthOccurrence(
          updatedContract,
          finding.originalText,
          finding.suggestedRedline,
          finding.occurrenceIndex
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

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

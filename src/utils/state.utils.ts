import { AppState } from "@/contexts/ContractContext";

const STATE_STORAGE_KEY = 'contractAppState';

export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STATE_STORAGE_KEY, serializedState);
  } catch (error) {
    console.warn("Could not save state to localStorage", error);
  }
};

export const loadState = (): AppState | undefined => {
  try {
    const serializedState = localStorage.getItem(STATE_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.warn("Could not load state from localStorage", error);
    return undefined;
  }
};

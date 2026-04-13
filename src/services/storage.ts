import type { AppState } from '@/types'
import { DEFAULT_APP_STATE } from './defaults'

const STORAGE_KEY = 'debtvision_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_APP_STATE }

    const parsed = JSON.parse(raw) as AppState
    if (!parsed.schemaVersion) return { ...DEFAULT_APP_STATE }

    return parsed
  } catch {
    return { ...DEFAULT_APP_STATE }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

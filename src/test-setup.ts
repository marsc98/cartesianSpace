import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// jsdom 29.x doesn't initialize localStorage unless a file path is provided.
// Provide a working in-memory implementation so storage tests work normally.
const _store = new Map<string, string>()
const localStorageMock: Storage = {
  getItem: (key: string) => _store.get(key) ?? null,
  setItem: (key: string, value: string) => { _store.set(key, String(value)) },
  removeItem: (key: string) => { _store.delete(key) },
  clear: () => { _store.clear() },
  get length() { return _store.size },
  key: (index: number) => [..._store.keys()][index] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

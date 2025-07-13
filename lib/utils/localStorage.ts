/**
 * Safe localStorage utilities with error handling
 */

export const safeLocalStorage = {
  /**
   * Safely get and parse JSON from localStorage
   */
  getItem: <T>(key: string, defaultValue: T | null = null): T | null => {
    if (typeof window === 'undefined') return defaultValue

    try {
      const item = localStorage.getItem(key)
      if (!item || item === 'undefined' || item === 'null') {
        return defaultValue
      }

      const parsed = JSON.parse(item)
      return parsed && typeof parsed === 'object' ? parsed : defaultValue
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error)
      // Clean up invalid data
      localStorage.removeItem(key)
      return defaultValue
    }
  },

  /**
   * Safely set JSON to localStorage
   */
  setItem: (key: string, value: any): boolean => {
    if (typeof window === 'undefined') return false

    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key)
        return true
      }

      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Failed to save to localStorage key "${key}":`, error)
      return false
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove localStorage key "${key}":`, error)
      return false
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false

    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}
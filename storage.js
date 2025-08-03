// storage.js - Handles saving and loading simulation data

export const Storage = {
  KEY: 'animal-population-sim',
  
  init() {
    // Check if localStorage is available
    if (!this._isAvailable()) {
      console.warn('LocalStorage is not available. Saving disabled.');
    }
  },
  
  // Save simulation state to localStorage
  save(data) {
    if (!this._isAvailable()) return false;
    
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  },
  
  // Load simulation state from localStorage
  load() {
    if (!this._isAvailable()) return null;
    
    try {
      const savedData = localStorage.getItem(this.KEY);
      if (!savedData) return null;
      
      return JSON.parse(savedData);
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  },
  
  // Clear saved data
  clear() {
    if (!this._isAvailable()) return false;
    
    try {
      localStorage.removeItem(this.KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  },
  
  // Check if localStorage is available
  _isAvailable() {
    if (typeof localStorage === 'undefined') return false;
    
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};

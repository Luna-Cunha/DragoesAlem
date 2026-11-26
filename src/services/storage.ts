import type { CompiledCompendium } from '../types/5etools';
import type { Character } from '../types/character';

const DB_NAME = 'dragoes_alem_db';
const DB_VERSION = 1;
const STORE_COMPENDIUM = 'compendium';
const STORE_CHARACTERS = 'characters';
const COMPENDIUM_KEY = 'active_compendium';
const LAST_URL_KEY = 'dragoes_alem_last_data_url';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_COMPENDIUM)) {
        db.createObjectStore(STORE_COMPENDIUM);
      }
      if (!db.objectStoreNames.contains(STORE_CHARACTERS)) {
        db.createObjectStore(STORE_CHARACTERS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCompendium(compendium: CompiledCompendium): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COMPENDIUM, 'readwrite');
    tx.objectStore(STORE_COMPENDIUM).put(compendium, COMPENDIUM_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadCompendium(): Promise<CompiledCompendium | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMPENDIUM, 'readonly');
      const req = tx.objectStore(STORE_COMPENDIUM).get(COMPENDIUM_KEY);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as CompiledCompendium | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function clearCompendium(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COMPENDIUM, 'readwrite');
    tx.objectStore(STORE_COMPENDIUM).delete(COMPENDIUM_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveCharacter(character: Character): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHARACTERS, 'readwrite');
    tx.objectStore(STORE_CHARACTERS).put(character);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadAllCharacters(): Promise<Character[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHARACTERS, 'readonly');
      const req = tx.objectStore(STORE_CHARACTERS).getAll();
      req.onsuccess = () => {
        db.close();
        const list = (req.result as Character[]) ?? [];
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        resolve(list);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

export async function loadCharacterById(id: string): Promise<Character | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHARACTERS, 'readonly');
      const req = tx.objectStore(STORE_CHARACTERS).get(id);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Character | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteCharacterById(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHARACTERS, 'readwrite');
    tx.objectStore(STORE_CHARACTERS).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function getSavedDataUrl(): string {
  try {
    return localStorage.getItem(LAST_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedDataUrl(url: string): void {
  try {
    localStorage.setItem(LAST_URL_KEY, url);
  } catch {
    // ignore storage quota errors
  }
}

import type { Book, Message } from '@/types';

const DB_NAME = 'chat-reader-db';
const DB_VERSION = 1;
const BOOK_STORE = 'book';
const MESSAGES_STORE = 'messages';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BOOK_STORE)) {
        db.createObjectStore(BOOK_STORE);
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE);
      }
    };
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readwrite');
    tx.objectStore(BOOK_STORE).put(book, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBook(): Promise<Book | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOK_STORE, 'readonly');
    const request = tx.objectStore(BOOK_STORE).get('current');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearBook(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BOOK_STORE, MESSAGES_STORE], 'readwrite');
    tx.objectStore(BOOK_STORE).clear();
    tx.objectStore(MESSAGES_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveMessages(messages: Message[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite');
    tx.objectStore(MESSAGES_STORE).put(messages, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadMessages(): Promise<Message[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readonly');
    const request = tx.objectStore(MESSAGES_STORE).get('current');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function hasExistingBook(): Promise<boolean> {
  const book = await loadBook();
  return book !== null;
}

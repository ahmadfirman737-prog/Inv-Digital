import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { InventoryItem, SchoolSettings, User } from './types';
import { DEFAULT_INVENTORY_ITEMS, DEFAULT_SCHOOL_SETTINGS, DEFAULT_USERS } from './utils/storage';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by Firestore integration skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or connecting...');
    }
    return false;
  }
}

// ==========================================
// REALTIME INVENTORY REPOSITORY
// ==========================================
export function subscribeToInventory(
  onData: (items: InventoryItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'inventory_items';
  const collRef = collection(db, path);

  const unsubscribe = onSnapshot(
    collRef,
    async (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }

      const items: InventoryItem[] = [];
      const legacyDemoDocRefs: ReturnType<typeof doc>[] = [];

      snapshot.forEach((docSnap) => {
        const itemData = docSnap.data() as InventoryItem;
        const itemId = String(itemData.id || docSnap.id);

        // Identify legacy demo items (inv-1, inv-2, inv-3, inv-4, inv-5) to auto-clean
        if (itemId.startsWith('inv-') && /^inv-[1-5]$/.test(itemId)) {
          legacyDemoDocRefs.push(docSnap.ref);
        } else {
          items.push({
            ...itemData,
            id: itemId
          });
        }
      });

      // Automatically purge legacy sample items from Firestore if present
      if (legacyDemoDocRefs.length > 0) {
        try {
          await Promise.all(legacyDemoDocRefs.map((ref) => deleteDoc(ref)));
        } catch (err) {
          console.warn('Legacy demo items cleanup error:', err);
        }
      }

      // Sort newest created first
      items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      onData(items);
    },
    (error) => {
      console.error('Realtime inventory subscription error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}

export async function saveInventoryItemToFirestore(item: InventoryItem): Promise<void> {
  const path = `inventory_items/${item.id}`;
  try {
    const docRef = doc(db, 'inventory_items', String(item.id));
    await setDoc(docRef, { ...item, id: String(item.id) }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInventoryItemFromFirestore(id: string | number): Promise<void> {
  const path = `inventory_items/${id}`;
  try {
    const docRef = doc(db, 'inventory_items', String(id));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllInventoryFromFirestore(): Promise<void> {
  const path = 'inventory_items';
  try {
    const collRef = collection(db, path);
    const snap = await getDocs(collRef);
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// REALTIME SCHOOL SETTINGS REPOSITORY
// ==========================================
export function subscribeToSchoolSettings(
  onData: (settings: SchoolSettings) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'school_settings/main';
  const docRef = doc(db, 'school_settings', 'main');

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        // Seed default school settings
        setDoc(docRef, DEFAULT_SCHOOL_SETTINGS, { merge: true }).catch(console.error);
        onData(DEFAULT_SCHOOL_SETTINGS);
        return;
      }
      const data = snapshot.data() as SchoolSettings;
      // Ensure official logo fallback
      if (!data.logo) {
        data.logo = DEFAULT_SCHOOL_SETTINGS.logo;
      }
      onData(data);
    },
    (error) => {
      console.error('Realtime school settings subscription error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function saveSchoolSettingsToFirestore(settings: SchoolSettings): Promise<void> {
  const path = 'school_settings/main';
  try {
    const docRef = doc(db, 'school_settings', 'main');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// REALTIME USERS REPOSITORY
// ==========================================
export function subscribeToUsers(
  onData: (users: User[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'users';
  const collRef = collection(db, path);

  const unsubscribe = onSnapshot(
    collRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed default users (with Ahmad Firmansyah admin)
        seedDefaultUsers().catch(console.error);
        onData(DEFAULT_USERS);
        return;
      }
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as User);
      });
      // Ensure Ahmad Firmansyah exists
      const hasAhmad = users.some((u) => u.username.toLowerCase() === 'ahmadfirmansyah');
      if (!hasAhmad) {
        saveUserToFirestore(DEFAULT_USERS[0]).catch(console.error);
      }
      onData(users);
    },
    (error) => {
      console.error('Realtime users subscription error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const docRef = doc(db, 'users', String(user.id));
    await setDoc(docRef, { ...user, id: String(user.id) }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(id: string | number): Promise<void> {
  const path = `users/${id}`;
  try {
    const docRef = doc(db, 'users', String(id));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

async function seedDefaultUsers(): Promise<void> {
  try {
    for (const u of DEFAULT_USERS) {
      const docRef = doc(db, 'users', String(u.id));
      await setDoc(docRef, u, { merge: true });
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

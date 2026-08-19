import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  SchoolSettings as SchoolSettingsType,
  User,
  ActiveMenu,
  ToastNotification
} from './types';
import {
  getStoredInventory,
  saveStoredInventory,
  getStoredUsers,
  saveStoredUsers,
  getStoredSchoolSettings,
  saveStoredSchoolSettings,
  getStoredCurrentUser,
  saveStoredCurrentUser
} from './utils/storage';
import {
  subscribeToInventory,
  subscribeToSchoolSettings,
  subscribeToUsers,
  fetchInventoryFromFirestore,
  saveInventoryItemToFirestore,
  deleteInventoryItemFromFirestore,
  saveSchoolSettingsToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  testConnection
} from './firebase';
import { ToastContainer } from './components/ToastContainer';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InputBarang } from './components/InputBarang';
import { DataInventaris } from './components/DataInventaris';
import { ScanBarcode } from './components/ScanBarcode';
import { UserManagement } from './components/UserManagement';
import { SchoolSettings } from './components/SchoolSettings';

export default function App() {
  // Application State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getStoredInventory());
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettingsType>(() => getStoredSchoolSettings());
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('input');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Test Firebase Firestore Connection and Initial Cloud Fetch on Mount
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    // Initial direct fetch to ensure immediate cross-device sync
    fetchInventoryFromFirestore()
      .then((items) => {
        if (items) {
          setInventoryItems(items);
          saveStoredInventory(items);
        }
      })
      .catch((err) => {
        console.warn('Initial direct fetch warning:', err);
      });
  }, []);

  // Realtime Subscriptions to Firebase Firestore
  useEffect(() => {
    const unsubInventory = subscribeToInventory(
      (items) => {
        setInventoryItems(items);
        saveStoredInventory(items);
      },
      () => setIsFirebaseConnected(false)
    );

    const unsubSettings = subscribeToSchoolSettings(
      (settings) => {
        setSchoolSettings(settings);
        saveStoredSchoolSettings(settings);
      },
      () => setIsFirebaseConnected(false)
    );

    const unsubUsers = subscribeToUsers(
      (userList) => {
        setUsers(userList);
        saveStoredUsers(userList);
      },
      () => setIsFirebaseConnected(false)
    );

    return () => {
      unsubInventory();
      unsubSettings();
      unsubUsers();
    };
  }, []);

  // Manual Cloud Sync Helper
  const handleSyncCloudNow = async () => {
    setIsSyncing(true);
    try {
      const items = await fetchInventoryFromFirestore();
      if (items) {
        setInventoryItems(items);
        saveStoredInventory(items);
        setIsFirebaseConnected(true);
        showToast(`Sinkronisasi Cloud Berhasil! (${items.length} item aktif di database)`, 'success');
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      showToast('Gagal menyinkronkan data dengan Firebase', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Persist current session locally
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  // Toast dispatch helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveMenu('input');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Anda telah berhasil keluar dari sistem inventaris.', 'info');
  };

  // Inventory Handlers (Realtime Firestore)
  const handleAddItem = async (newItem: InventoryItem): Promise<boolean> => {
    const exists = inventoryItems.some(
      (item) => item.serial.toUpperCase() === newItem.serial.toUpperCase()
    );

    if (exists) {
      showToast(`Barang dengan Nomor Seri "${newItem.serial}" sudah terdaftar di sistem!`, 'error');
      return false;
    }

    try {
      // Save to Firestore Realtime (broadcasts immediately to all devices via onSnapshot)
      await saveInventoryItemToFirestore(newItem);
      setInventoryItems((prev) => {
        if (prev.some((item) => String(item.id) === String(newItem.id))) {
          return prev;
        }
        return [newItem, ...prev];
      });
      showToast(`Barang "${newItem.name}" (${newItem.serial}) berhasil disimpan & disiarkan ke semua device!`, 'success');
      return true;
    } catch (err) {
      console.error('Error saving item to Firestore:', err);
      showToast('Gagal menyimpan barang ke cloud database. Cek koneksi.', 'error');
      return false;
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    try {
      // Save to Firestore Realtime
      await saveInventoryItemToFirestore(updatedItem);
      setInventoryItems((prev) =>
        prev.map((item) => (String(item.id) === String(updatedItem.id) ? updatedItem : item))
      );
      showToast('Perubahan data berhasil disinkronkan ke seluruh device!', 'success');
    } catch (err) {
      console.error('Error updating item in Firestore:', err);
      showToast('Gagal memperbarui barang di cloud database.', 'error');
    }
  };

  const handleDeleteItem = async (id: string | number) => {
    const target = inventoryItems.find((i) => String(i.id) === String(id));

    // Delete immediately from Firestore Realtime Cloud Database
    try {
      await deleteInventoryItemFromFirestore(id);
      setInventoryItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
      showToast(`Barang ${target?.name || ''} telah dihapus dari cloud realtime.`, 'info');
    } catch (err) {
      console.error('Error deleting item from Firestore:', err);
      showToast('Gagal menghapus barang dari cloud', 'error');
    }
  };

  // User Handlers (Realtime Firestore)
  const handleAddUser = (newUser: User): boolean => {
    const exists = users.some(
      (u) => u.username.toLowerCase() === newUser.username.toLowerCase()
    );

    if (exists) {
      showToast(`Gagal! Username "${newUser.username}" sudah digunakan pengguna lain.`, 'error');
      return false;
    }

    // Save to Firestore Realtime
    saveUserToFirestore(newUser).catch((err) => {
      console.error('Error saving user to Firestore:', err);
    });

    setUsers((prev) => [...prev, newUser]);
    showToast(`Pengguna baru "${newUser.name}" berhasil ditambahkan ke cloud.`, 'success');
    return true;
  };

  const handleDeleteUser = (id: string | number) => {
    // Delete from Firestore Realtime
    deleteUserFromFirestore(id).catch((err) => {
      console.error('Error deleting user from Firestore:', err);
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('Akun pengguna telah dihapus dari cloud.', 'info');
  };

  // Settings Handlers (Realtime Firestore)
  const handleSaveSettings = (newSettings: SchoolSettingsType) => {
    setSchoolSettings(newSettings);
    // Save to Firestore Realtime
    saveSchoolSettingsToFirestore(newSettings).catch((err) => {
      console.error('Error saving settings to Firestore:', err);
    });
  };

  const handleImportBackup = (
    importedItems: InventoryItem[],
    importedSettings: SchoolSettingsType,
    importedUsers: User[]
  ) => {
    setInventoryItems(importedItems);
    setSchoolSettings(importedSettings);
    setUsers(importedUsers);

    // Sync imported backup into Firestore Realtime
    saveSchoolSettingsToFirestore(importedSettings).catch(console.error);
    importedItems.forEach((item) => saveInventoryItemToFirestore(item).catch(console.error));
    importedUsers.forEach((u) => saveUserToFirestore(u).catch(console.error));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-[#009B4C] selection:text-white">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Conditional Rendering: Login View vs Main Application View */}
      {!currentUser ? (
        <LoginView
          schoolSettings={schoolSettings}
          users={users}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
      ) : (
        <div id="app-view" className="flex h-screen w-full overflow-hidden bg-slate-50">
          {/* Sidebar Navigation */}
          <Sidebar
            activeMenu={activeMenu}
            onSelectMenu={(menu) => setActiveMenu(menu)}
            onLogout={handleLogout}
            schoolSettings={schoolSettings}
            currentUser={currentUser}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header with Title & User Profile */}
            <Header
              activeMenu={activeMenu}
              currentUser={currentUser}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              totalItemsCount={inventoryItems.length}
              isFirebaseSyncing={isFirebaseConnected}
              onSyncCloud={handleSyncCloudNow}
              isSyncing={isSyncing}
            />

            {/* View Switching Router */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/60">
              {activeMenu === 'input' && (
                <InputBarang
                  onAddItem={handleAddItem}
                  onNavigateToList={() => setActiveMenu('list')}
                  showToast={showToast}
                />
              )}

              {activeMenu === 'list' && (
                <DataInventaris
                  items={inventoryItems}
                  schoolSettings={schoolSettings}
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                  onNavigateToInput={() => {
                    setInventorySearchQuery('');
                    setActiveMenu('input');
                  }}
                  showToast={showToast}
                  onSyncCloud={handleSyncCloudNow}
                  isSyncing={isSyncing}
                  initialSearch={inventorySearchQuery}
                />
              )}

              {activeMenu === 'scan' && (
                <ScanBarcode
                  items={inventoryItems}
                  showToast={showToast}
                  onNavigateToInventory={(searchSerial) => {
                    if (searchSerial) {
                      setInventorySearchQuery(searchSerial);
                    }
                    setActiveMenu('list');
                  }}
                />
              )}

              {activeMenu === 'users' && (
                <UserManagement
                  users={users}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  currentUser={currentUser}
                  showToast={showToast}
                />
              )}

              {activeMenu === 'settings' && (
                <SchoolSettings
                  settings={schoolSettings}
                  onSaveSettings={handleSaveSettings}
                  inventoryItems={inventoryItems}
                  users={users}
                  onImportBackup={handleImportBackup}
                  showToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

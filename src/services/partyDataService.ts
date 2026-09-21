import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Room, Booking, VaultMedia, AddOnItem, ContactMessage, EventFolder } from '../types';
import { INITIAL_ROOMS, INITIAL_ADDONS } from '../data/defaultData';

// Seed initial rooms into Firestore if empty
export async function ensureInitialRoomsSeeded(): Promise<void> {
  try {
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    if (roomsSnap.empty) {
      for (const room of INITIAL_ROOMS) {
        await setDoc(doc(db, 'rooms', room.id), {
          ...room,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn('Rooms seeding fallback to defaults:', error);
  }
}

// Subscribe to real-time rooms list
export function subscribeRooms(callback: (rooms: Room[]) => void): () => void {
  const applyLocalSync = (list: Room[]): Room[] => {
    let result = [...list];
    try {
      const localOverrides: Record<string, Partial<Room>> = JSON.parse(localStorage.getItem('celebrato_rooms_overrides') || '{}');
      result = result.map(r => localOverrides[r.id] ? { ...r, ...localOverrides[r.id] } : r);
      const localNewRooms: Room[] = JSON.parse(localStorage.getItem('celebrato_custom_rooms') || '[]');
      for (const nr of localNewRooms) {
        const idx = result.findIndex(r => r.id === nr.id);
        if (idx >= 0) result[idx] = { ...result[idx], ...nr };
        else result.push(nr);
      }
      const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_rooms') || '[]');
      result = result.filter(r => !deletedIds.includes(r.id));
    } catch {}
    return result;
  };

  try {
    const q = collection(db, 'rooms');
    return onSnapshot(q, (snapshot) => {
      let list: Room[] = [];
      if (snapshot.empty) {
        list = [...INITIAL_ROOMS];
      } else {
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Room);
        });
      }
      callback(applyLocalSync(list));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rooms');
      callback(applyLocalSync([...INITIAL_ROOMS]));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rooms');
    callback(applyLocalSync([...INITIAL_ROOMS]));
    return () => {};
  }
}

// Update room pricing or details (Admin)
export async function updateRoomDetails(roomId: string, updates: Partial<Room>): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }

  try {
    const localOverrides: Record<string, Partial<Room>> = JSON.parse(localStorage.getItem('celebrato_rooms_overrides') || '{}');
    localOverrides[roomId] = { ...(localOverrides[roomId] || {}), ...updates };
    localStorage.setItem('celebrato_rooms_overrides', JSON.stringify(localOverrides));

    const localNewRooms: Room[] = JSON.parse(localStorage.getItem('celebrato_custom_rooms') || '[]');
    const idx = localNewRooms.findIndex(r => r.id === roomId);
    if (idx >= 0) {
      localNewRooms[idx] = { ...localNewRooms[idx], ...updates };
      localStorage.setItem('celebrato_custom_rooms', JSON.stringify(localNewRooms));
    }
  } catch {}
}

// Create or update full room
export async function saveRoom(room: Room): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', room.id);
    await setDoc(roomRef, {
      ...room,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rooms/${room.id}`);
  }

  try {
    const localNewRooms: Room[] = JSON.parse(localStorage.getItem('celebrato_custom_rooms') || '[]');
    const idx = localNewRooms.findIndex(r => r.id === room.id);
    if (idx >= 0) localNewRooms[idx] = room;
    else localNewRooms.unshift(room);
    localStorage.setItem('celebrato_custom_rooms', JSON.stringify(localNewRooms));

    const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_rooms') || '[]');
    const updatedDeleted = deletedIds.filter(id => id !== room.id);
    localStorage.setItem('celebrato_deleted_rooms', JSON.stringify(updatedDeleted));
  } catch {}
}

// Delete room
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomId}`);
  }

  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_rooms') || '[]');
    if (!deletedIds.includes(roomId)) {
      deletedIds.push(roomId);
      localStorage.setItem('celebrato_deleted_rooms', JSON.stringify(deletedIds));
    }
    const localNewRooms: Room[] = JSON.parse(localStorage.getItem('celebrato_custom_rooms') || '[]');
    const updatedNew = localNewRooms.filter(r => r.id !== roomId);
    localStorage.setItem('celebrato_custom_rooms', JSON.stringify(updatedNew));
  } catch {}
}

// Subscribe to user bookings
export function subscribeUserBookings(userId: string, callback: (bookings: Booking[]) => void): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Booking);
      });
      // Sort in memory by date/createdAt descending
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `bookings[userId=${userId}]`);
      callback([]);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `bookings[userId=${userId}]`);
    callback([]);
    return () => {};
  }
}

// Subscribe to ALL bookings (Admin Panel)
export function subscribeAllBookings(callback: (bookings: Booking[]) => void): () => void {
  try {
    const q = collection(db, 'bookings');
    return onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Booking);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bookings');
      callback([]);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookings');
    callback([]);
    return () => {};
  }
}

// Create new booking
export async function createBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
  const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullBooking: Booking = {
    ...bookingData,
    id: bookingId,
  };

  try {
    await setDoc(doc(db, 'bookings', bookingId), fullBooking);
    return bookingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookings/${bookingId}`);
    throw error;
  }
}

// Update booking status (Admin / Host)
export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    throw error;
  }
}

// Real-time Event Media Vault
export function subscribeVaultMedia(bookingId: string | null, callback: (media: VaultMedia[]) => void): () => void {
  try {
    let q;
    if (bookingId) {
      q = query(collection(db, 'vault_media'), where('bookingId', '==', bookingId));
    } else {
      q = collection(db, 'vault_media');
    }

    return onSnapshot(q, (snapshot) => {
      const list: VaultMedia[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as VaultMedia);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'vault_media');
      callback([]);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'vault_media');
    callback([]);
    return () => {};
  }
}

// Add picture or video to party event vault
export async function addMediaToVault(mediaData: Omit<VaultMedia, 'id'>): Promise<string> {
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullItem: VaultMedia = {
    ...mediaData,
    id: mediaId,
  };

  try {
    await setDoc(doc(db, 'vault_media', mediaId), fullItem);
    return mediaId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `vault_media/${mediaId}`);
    throw error;
  }
}

// Like/cheer media item in vault
export async function cheerVaultMedia(mediaId: string, currentLikes: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'vault_media', mediaId), {
      likesCount: currentLikes + 1
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `vault_media/${mediaId}`);
  }
}

// Delete media item (uploader or admin)
export async function deleteVaultMedia(mediaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'vault_media', mediaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `vault_media/${mediaId}`);
    throw error;
  }
}

// Send a new contact form message to Firestore
export async function sendContactMessage(msg: Omit<ContactMessage, 'id' | 'status' | 'createdAt'>): Promise<string> {
  const contactId = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullMessage: ContactMessage = {
    ...msg,
    id: contactId,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'contacts', contactId), fullMessage);
    return contactId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `contacts/${contactId}`);
    try {
      const existing = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
      existing.push(fullMessage);
      localStorage.setItem('celebrato_offline_contacts', JSON.stringify(existing));
    } catch {}
    return contactId;
  }
}

// Subscribe to contact messages for Admin
export function subscribeContactMessages(callback: (messages: ContactMessage[]) => void): () => void {
  try {
    const q = collection(db, 'contacts');
    return onSnapshot(q, (snapshot) => {
      const list: ContactMessage[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContactMessage);
      });
      try {
        const offline = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
        for (const off of offline) {
          if (!list.some(item => item.id === off.id)) {
            list.push(off);
          }
        }
      } catch {}

      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'contacts');
      try {
        const offline = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
        callback(offline);
      } catch {
        callback([]);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'contacts');
    try {
      const offline = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
      callback(offline);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

// Update contact message status (Admin)
export async function updateContactMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'contacts', id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contacts/${id}`);
  }
  try {
    const existing: ContactMessage[] = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
    const updated = existing.map(m => m.id === id ? { ...m, status } : m);
    localStorage.setItem('celebrato_offline_contacts', JSON.stringify(updated));
  } catch {}
}

// Delete contact message (Admin)
export async function deleteContactMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'contacts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `contacts/${id}`);
  }
  try {
    const existing: ContactMessage[] = JSON.parse(localStorage.getItem('celebrato_offline_contacts') || '[]');
    const filtered = existing.filter(m => m.id !== id);
    localStorage.setItem('celebrato_offline_contacts', JSON.stringify(filtered));
  } catch {}
}

// ─── Add-Ons (Admin-managed) ────────────────────────────────────────────────

// Subscribe to real-time add-ons list (falls back to INITIAL_ADDONS with local sync)
export function subscribeAddOns(callback: (addons: AddOnItem[]) => void): () => void {
  const applyLocalSync = (list: AddOnItem[]): AddOnItem[] => {
    let result = [...list];
    try {
      const localAddons: AddOnItem[] = JSON.parse(localStorage.getItem('celebrato_addons') || '[]');
      for (const item of localAddons) {
        const idx = result.findIndex(a => a.id === item.id);
        if (idx >= 0) result[idx] = { ...result[idx], ...item };
        else result.push(item);
      }
      const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_addons') || '[]');
      result = result.filter(a => !deletedIds.includes(a.id));
    } catch {}
    return result;
  };

  try {
    const q = collection(db, 'addons');
    return onSnapshot(q, (snapshot) => {
      let list: AddOnItem[] = [];
      if (snapshot.empty) {
        list = [...INITIAL_ADDONS];
      } else {
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as AddOnItem);
        });
      }
      callback(applyLocalSync(list));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'addons');
      callback(applyLocalSync([...INITIAL_ADDONS]));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'addons');
    callback(applyLocalSync([...INITIAL_ADDONS]));
    return () => {};
  }
}

// Create or update an add-on (Admin)
export async function saveAddOn(addon: AddOnItem): Promise<void> {
  try {
    await setDoc(doc(db, 'addons', addon.id), addon, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `addons/${addon.id}`);
  }

  try {
    const localAddons: AddOnItem[] = JSON.parse(localStorage.getItem('celebrato_addons') || '[]');
    const idx = localAddons.findIndex(a => a.id === addon.id);
    if (idx >= 0) localAddons[idx] = addon;
    else localAddons.unshift(addon);
    localStorage.setItem('celebrato_addons', JSON.stringify(localAddons));

    const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_addons') || '[]');
    const updatedDeleted = deletedIds.filter(id => id !== addon.id);
    localStorage.setItem('celebrato_deleted_addons', JSON.stringify(updatedDeleted));
  } catch {}
}

// Delete an add-on (Admin)
export async function deleteAddOn(addonId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'addons', addonId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `addons/${addonId}`);
  }

  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('celebrato_deleted_addons') || '[]');
    if (!deletedIds.includes(addonId)) {
      deletedIds.push(addonId);
      localStorage.setItem('celebrato_deleted_addons', JSON.stringify(deletedIds));
    }
    const localAddons: AddOnItem[] = JSON.parse(localStorage.getItem('celebrato_addons') || '[]');
    const updated = localAddons.filter(a => a.id !== addonId);
    localStorage.setItem('celebrato_addons', JSON.stringify(updated));
  } catch {}
}

// ─── Mem Vault Event Folders ────────────────────────────────────────────────

export const INITIAL_EVENT_FOLDERS: EventFolder[] = [
  {
    id: 'folder_neon_launch',
    name: 'Celebrato Grand Launch Night',
    date: '2026-09-15',
    description: 'Acoustic suite opening bash with pro DJ booth, lasers, and champagne tower.',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    shareCode: 'NEON-2026',
    createdAt: '2026-09-15T20:00:00.000Z'
  },
  {
    id: 'folder_retro_synth',
    name: 'Midnight Retro Laser Party',
    date: '2026-09-18',
    description: 'Retro 80s synthwave night with private lounge seating and karaoke jam.',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    shareCode: 'RETRO-8821',
    createdAt: '2026-09-18T21:00:00.000Z'
  }
];

export function subscribeEventFolders(callback: (folders: EventFolder[]) => void): () => void {
  try {
    const q = collection(db, 'event_folders');
    return onSnapshot(q, (snapshot) => {
      const list: EventFolder[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as EventFolder);
      });

      // Merge local fallback
      try {
        const local = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
        for (const f of local) {
          if (!list.some(x => x.id === f.id)) list.push(f);
        }
      } catch {}

      if (list.length === 0) {
        callback(INITIAL_EVENT_FOLDERS);
      } else {
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'event_folders');
      try {
        const local = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
        callback(local.length > 0 ? local : INITIAL_EVENT_FOLDERS);
      } catch {
        callback(INITIAL_EVENT_FOLDERS);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'event_folders');
    try {
      const local = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
      callback(local.length > 0 ? local : INITIAL_EVENT_FOLDERS);
    } catch {
      callback(INITIAL_EVENT_FOLDERS);
    }
    return () => {};
  }
}

export async function createEventFolder(folderData: Omit<EventFolder, 'id' | 'createdAt'>): Promise<EventFolder> {
  const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const shareCode = `VAULT-${Math.floor(1000 + Math.random() * 9000)}`;
  const fullFolder: EventFolder = {
    ...folderData,
    id: folderId,
    shareCode: folderData.shareCode || shareCode,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'event_folders', folderId), fullFolder);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `event_folders/${folderId}`);
  }

  try {
    const local = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
    local.unshift(fullFolder);
    localStorage.setItem('celebrato_event_folders', JSON.stringify(local));
  } catch {}

  return fullFolder;
}

export async function deleteEventFolder(folderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'event_folders', folderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `event_folders/${folderId}`);
  }

  try {
    const local: EventFolder[] = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
    const updated = local.filter(f => f.id !== folderId);
    localStorage.setItem('celebrato_event_folders', JSON.stringify(updated));
  } catch {}
}

export async function findEventFolderByCode(codeOrLink: string): Promise<EventFolder | null> {
  const clean = codeOrLink.trim();
  if (!clean) return null;

  // 1. Try local storage cache
  try {
    const local: EventFolder[] = JSON.parse(localStorage.getItem('celebrato_event_folders') || '[]');
    const found = local.find(f => 
      (f.shareCode && f.shareCode.toLowerCase() === clean.toLowerCase()) || 
      (f.id && f.id.toLowerCase() === clean.toLowerCase())
    );
    if (found) return found;
  } catch {}

  // 2. Try Firestore by shareCode
  try {
    const q = query(collection(db, 'event_folders'), where('shareCode', '==', clean.toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as EventFolder;
    }
  } catch {}

  // 3. Try Firestore by direct document ID
  try {
    const docSnap = await getDoc(doc(db, 'event_folders', clean));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EventFolder;
    }
  } catch {}

  return null;
}

export function subscribeFolderMedia(folderId: string, callback: (media: VaultMedia[]) => void): () => void {
  try {
    const q = query(
      collection(db, 'vault_media'),
      where('folderId', '==', folderId)
    );
    return onSnapshot(q, (snapshot) => {
      const list: VaultMedia[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as VaultMedia);
      });

      // Merge local fallback
      try {
        const local = JSON.parse(localStorage.getItem(`celebrato_media_${folderId}`) || '[]');
        for (const m of local) {
          if (!list.some(x => x.id === m.id)) list.push(m);
        }
      } catch {}

      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `vault_media?folderId=${folderId}`);
      try {
        const local = JSON.parse(localStorage.getItem(`celebrato_media_${folderId}`) || '[]');
        callback(local);
      } catch {
        callback([]);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `vault_media?folderId=${folderId}`);
    try {
      const local = JSON.parse(localStorage.getItem(`celebrato_media_${folderId}`) || '[]');
      callback(local);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

export async function addMediaToFolder(folderId: string, mediaData: Omit<VaultMedia, 'id'>): Promise<string> {
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullItem: VaultMedia = {
    ...mediaData,
    folderId,
    id: mediaId,
  };

  try {
    await setDoc(doc(db, 'vault_media', mediaId), fullItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `vault_media/${mediaId}`);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`celebrato_media_${folderId}`) || '[]');
    local.unshift(fullItem);
    localStorage.setItem(`celebrato_media_${folderId}`, JSON.stringify(local));
  } catch {}

  return mediaId;
}



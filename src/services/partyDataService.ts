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
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Room, Booking, VaultMedia, AddOnItem } from '../types';
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
  try {
    const q = collection(db, 'rooms');
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_ROOMS);
      } else {
        const list: Room[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Room);
        });
        callback(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rooms');
      callback(INITIAL_ROOMS);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rooms');
    callback(INITIAL_ROOMS);
    return () => {};
  }
}

// Update room pricing, points, or details (Admin)
export async function updateRoomDetails(roomId: string, updates: Partial<Room>): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    throw error;
  }
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
    throw error;
  }
}

// Delete room
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomId}`);
    throw error;
  }
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

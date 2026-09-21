import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { EventFolder, VaultMedia } from '../types';
import { 
  subscribeEventFolders, 
  createEventFolder, 
  deleteEventFolder,
  findEventFolderByCode,
  subscribeFolderMedia,
  addMediaToFolder,
  cheerVaultMedia,
  deleteVaultMedia
} from '../services/partyDataService';
import { 
  FolderLock, 
  Calendar, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  ArrowLeft, 
  Share2, 
  Heart, 
  Trash2, 
  Play, 
  X, 
  Upload, 
  Check, 
  Sparkles, 
  Search,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  Link,
  LogOut
} from 'lucide-react';

// Fast client-side image compression using HTML5 canvas
const compressImage = (file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};

// Storage helpers for user joined vaults
const getStoredJoinedVaultIds = (uid: string): string[] => {
  try {
    const raw = localStorage.getItem(`celebrato_joined_vaults_${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => (typeof item === 'string' ? item : item.folderId || item.id || item.shareCode));
    }
    return [];
  } catch {
    return [];
  }
};

const storeJoinedVault = (uid: string, folderId: string, shareCode?: string) => {
  try {
    const key = `celebrato_joined_vaults_${uid}`;
    const raw = localStorage.getItem(key);
    let list: any[] = raw ? JSON.parse(raw) : [];
    const alreadyExists = list.some((item: any) => 
      (typeof item === 'string' && (item === folderId || item === shareCode)) ||
      (typeof item === 'object' && (item.folderId === folderId || (shareCode && item.shareCode === shareCode)))
    );
    if (!alreadyExists) {
      list.push({ folderId, shareCode, joinedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {}
};

const removeStoredJoinedVault = (uid: string, folderId: string) => {
  try {
    const key = `celebrato_joined_vaults_${uid}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    let list: any[] = JSON.parse(raw);
    list = list.filter((item: any) => {
      const id = typeof item === 'string' ? item : item.folderId;
      return id !== folderId;
    });
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
};

interface MemVaultPageProps {
  onBackToHome?: () => void;
  initialFolderId?: string | null;
  onNavigateAuth?: (mode?: 'login' | 'signup') => void;
}

export const MemVaultPage: React.FC<MemVaultPageProps> = ({ 
  onBackToHome,
  initialFolderId = null,
  onNavigateAuth
}) => {
  const { currentUser, profile, isAdmin } = useAuth();

  // Folders State
  const [folders, setFolders] = useState<EventFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<EventFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedFolderIds, setJoinedFolderIds] = useState<string[]>([]);

  // Guest verification state when not logged in
  const [guestVerifiedFolder, setGuestVerifiedFolder] = useState<EventFolder | null>(null);
  const [verifyingGuestCode, setVerifyingGuestCode] = useState(false);

  // Create Folder Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDate, setNewFolderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Folder Media State
  const [folderMedia, setFolderMedia] = useState<VaultMedia[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [uploaderFilter, setUploaderFilter] = useState<'all' | 'mine'>('all');
  const [lightboxItem, setLightboxItem] = useState<VaultMedia | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Upload/Capture states
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [mediaShareCopied, setMediaShareCopied] = useState(false);
  const [folderShareCopied, setFolderShareCopied] = useState(false);

  // Join Event Vault State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningVault, setJoiningVault] = useState(false);

  // Add Media by URL Modal State
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'video'>('image');

  // Input refs for camera and file picker
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load user's joined vaults and check pending join code
  useEffect(() => {
    if (!currentUser) {
      setJoinedFolderIds([]);
      return;
    }
    const stored = getStoredJoinedVaultIds(currentUser.uid);
    setJoinedFolderIds(stored);

    // Check if user has a pending vault code from guest invite
    const pending = sessionStorage.getItem('celebrato_pending_vault_code');
    if (pending) {
      sessionStorage.removeItem('celebrato_pending_vault_code');
      findEventFolderByCode(pending).then((found) => {
        if (found) {
          storeJoinedVault(currentUser.uid, found.id, found.shareCode);
          setJoinedFolderIds(prev => Array.from(new Set([...prev, found.id, ...(found.shareCode ? [found.shareCode] : [])])));
          setSelectedFolder(found);
        }
      });
    }
  }, [currentUser]);

  // Auto-open folder if joined via URL with ?vaultCode=XYZ or ?vault=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('vaultCode') || params.get('vault');
    if (code) {
      if (currentUser) {
        findEventFolderByCode(code).then((found) => {
          if (found) {
            storeJoinedVault(currentUser.uid, found.id, found.shareCode);
            setJoinedFolderIds(prev => Array.from(new Set([...prev, found.id, ...(found.shareCode ? [found.shareCode] : [])])));
            if (!selectedFolder) setSelectedFolder(found);
          }
        });
      } else {
        sessionStorage.setItem('celebrato_pending_vault_code', code);
      }
    }
  }, [selectedFolder, currentUser]);

  // Subscribe to folders
  useEffect(() => {
    const unsub = subscribeEventFolders((data) => {
      setFolders(data);
      if (initialFolderId) {
        const found = data.find(f => f.id === initialFolderId);
        if (found) setSelectedFolder(found);
      }
    });
    return () => unsub();
  }, [initialFolderId]);

  // Subscribe to media of selected folder
  useEffect(() => {
    if (!selectedFolder) {
      setFolderMedia([]);
      return;
    }
    const unsub = subscribeFolderMedia(selectedFolder.id, (media) => {
      setFolderMedia(media);
    });
    return () => unsub();
  }, [selectedFolder?.id]);

  // Create new event folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const created = await createEventFolder({
        userId: currentUser?.uid,
        name: newFolderName.trim(),
        date: newFolderDate,
        description: newFolderDesc.trim() || 'Shared private memories and event video clips.',
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      });
      setIsCreateOpen(false);
      setNewFolderName('');
      setNewFolderDesc('');
      setSelectedFolder(created);
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this event album and all its media?')) return;
    try {
      await deleteEventFolder(folderId);
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  // Fast concurrent file uploads with client-side canvas compression
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedFolder) return;

    setUploading(true);
    const total = files.length;
    setUploadStatus(`Optimizing ${total} memory item${total > 1 ? 's' : ''}...`);
    const uploaderName = profile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Party Guest';

    try {
      const fileList = Array.from(files);
      await Promise.all(
        fileList.map(async (file, idx) => {
          const isVideo = file.type.startsWith('video');
          const dataUrl = await compressImage(file);
          if (!dataUrl) return;

          setUploadStatus(`Saving ${idx + 1} of ${total}...`);
          await addMediaToFolder(selectedFolder.id, {
            eventName: selectedFolder.name,
            mediaType: isVideo ? 'video' : 'image',
            url: dataUrl,
            title: file.name.replace(/\.[^/.]+$/, "") || (isVideo ? 'Party Video' : 'Party Photo'),
            uploadedByUid: currentUser?.uid || 'anonymous',
            uploadedByName: uploaderName,
            likesCount: 0,
            createdAt: new Date().toISOString()
          });
        })
      );
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadStatus(null);
      if (e.target) e.target.value = '';
    }
  };

  // Add media by external URL (image or video link)
  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !selectedFolder) return;

    setUploading(true);
    setUploadStatus('Adding media from URL...');
    const uploaderName = profile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Party Guest';

    try {
      await addMediaToFolder(selectedFolder.id, {
        eventName: selectedFolder.name,
        mediaType: urlType,
        url: urlInput.trim(),
        title: urlTitle.trim() || (urlType === 'video' ? 'Party Video' : 'Party Photo'),
        uploadedByUid: currentUser?.uid || 'anonymous',
        uploadedByName: uploaderName,
        likesCount: 0,
        createdAt: new Date().toISOString()
      });
      setIsUrlModalOpen(false);
      setUrlInput('');
      setUrlTitle('');
      setUrlType('image');
    } catch (err) {
      console.error('Failed to add media by URL:', err);
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  };

  // Download media item directly to user device
  const handleDownloadMedia = async (media: VaultMedia) => {
    try {
      const ext = media.mediaType === 'video' ? 'mp4' : 'jpg';
      const safeTitle = (media.title || 'celebrato-memory').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeTitle}.${ext}`;

      if (media.url.startsWith('data:') || media.url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = media.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(media.url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
    } catch {
      window.open(media.url, '_blank');
    }
  };

  // Share individual memory from popup
  const handleShareMedia = async (media: VaultMedia) => {
    const shareText = `Check out this memory from ${selectedFolder?.name || 'Celebrato'}!`;
    const shareUrl = media.url.startsWith('data:') ? window.location.href : media.url;

    if (navigator.share && !media.url.startsWith('data:')) {
      try {
        await navigator.share({
          title: media.title || 'Celebrato Memory',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMediaShareCopied(true);
      setTimeout(() => setMediaShareCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Only show folders created by the owner account, or joined via shared link/code (admins see all)
  const accessibleFolders = folders.filter(folder => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    const isOwner = folder.userId === currentUser.uid;
    const isJoined = joinedFolderIds.includes(folder.id) || (folder.shareCode && joinedFolderIds.includes(folder.shareCode));
    return isOwner || isJoined;
  });

  const filteredFolders = accessibleFolders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedia = folderMedia.filter(m => {
    if (mediaFilter === 'image' && m.mediaType !== 'image') return false;
    if (mediaFilter === 'video' && m.mediaType !== 'video') return false;
    if (uploaderFilter === 'mine' && currentUser && m.uploadedByUid !== currentUser.uid) return false;
    return true;
  });

  // Lightbox Next/Prev navigation
  const handlePrevLightbox = () => {
    if (!lightboxItem || filteredMedia.length === 0) return;
    const currentIndex = filteredMedia.findIndex(m => m.id === lightboxItem.id);
    const prevIndex = (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
    setLightboxItem(filteredMedia[prevIndex]);
  };

  const handleNextLightbox = () => {
    if (!lightboxItem || filteredMedia.length === 0) return;
    const currentIndex = filteredMedia.findIndex(m => m.id === lightboxItem.id);
    const nextIndex = (currentIndex + 1) % filteredMedia.length;
    setLightboxItem(filteredMedia[nextIndex]);
  };

  // Keyboard navigation for lightbox popup
  useEffect(() => {
    if (!lightboxItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxItem, filteredMedia]);

  // Share entire event folder via link or native share sheet
  const handleShareFolder = async () => {
    if (!selectedFolder) return;
    const shareCode = selectedFolder.shareCode || selectedFolder.id;
    const shareUrl = `${window.location.origin}${window.location.pathname}?vaultCode=${shareCode}`;
    const shareText = `Join the "${selectedFolder.name}" party media vault on Celebrato! Use code ${shareCode} or tap: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedFolder.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setFolderShareCopied(true);
      setTimeout(() => setFolderShareCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Leave joined vault
  const handleLeaveVault = (folderId: string) => {
    if (!currentUser) return;
    if (window.confirm('Remove this joined vault from your list? You can re-join anytime using the party link or code.')) {
      removeStoredJoinedVault(currentUser.uid, folderId);
      setJoinedFolderIds(prev => prev.filter(id => id !== folderId));
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
    }
  };

  // Join vault using shared link or code
  const handleJoinVault = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = joinInput.trim();
    if (!raw) return;

    setJoiningVault(true);
    setJoinError(null);

    try {
      let codeToSearch = raw;
      if (raw.includes('vaultCode=')) {
        const match = raw.match(/[?&]vaultCode=([^&#]+)/);
        if (match && match[1]) codeToSearch = decodeURIComponent(match[1]);
      } else if (raw.includes('vault=')) {
        const match = raw.match(/[?&]vault=([^&#]+)/);
        if (match && match[1]) codeToSearch = decodeURIComponent(match[1]);
      } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
          const urlObj = new URL(raw);
          const p = urlObj.searchParams.get('vaultCode') || urlObj.searchParams.get('vault');
          if (p) codeToSearch = p;
          else codeToSearch = urlObj.pathname.split('/').filter(Boolean).pop() || raw;
        } catch {}
      }

      // 1. Check loaded folders list
      const localMatch = folders.find(
        f => (f.shareCode && f.shareCode.toLowerCase() === codeToSearch.toLowerCase()) ||
             (f.id && f.id.toLowerCase() === codeToSearch.toLowerCase())
      );

      if (localMatch) {
        if (currentUser) {
          storeJoinedVault(currentUser.uid, localMatch.id, localMatch.shareCode);
          setJoinedFolderIds(prev => Array.from(new Set([...prev, localMatch.id, ...(localMatch.shareCode ? [localMatch.shareCode] : [])])));
        }
        setSelectedFolder(localMatch);
        setIsJoinOpen(false);
        setJoinInput('');
        return;
      }

      // 2. Query Firestore / storage via helper
      const found = await findEventFolderByCode(codeToSearch);
      if (found) {
        if (currentUser) {
          storeJoinedVault(currentUser.uid, found.id, found.shareCode);
          setJoinedFolderIds(prev => Array.from(new Set([...prev, found.id, ...(found.shareCode ? [found.shareCode] : [])])));
        }
        setFolders(prev => prev.some(x => x.id === found.id) ? prev : [found, ...prev]);
        setSelectedFolder(found);
        setIsJoinOpen(false);
        setJoinInput('');
        return;
      }

      setJoinError('Vault not found. Please verify the code or link and try again.');
    } catch (err) {
      console.error('Join vault error:', err);
      setJoinError('Failed to access vault. Please check and try again.');
    } finally {
      setJoiningVault(false);
    }
  };

  // Verify code for unauthenticated guest
  const handleGuestVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = joinInput.trim();
    if (!raw) return;
    setVerifyingGuestCode(true);
    setJoinError(null);
    setGuestVerifiedFolder(null);

    try {
      let codeToSearch = raw;
      if (raw.includes('vaultCode=')) {
        const match = raw.match(/[?&]vaultCode=([^&#]+)/);
        if (match && match[1]) codeToSearch = decodeURIComponent(match[1]);
      } else if (raw.includes('vault=')) {
        const match = raw.match(/[?&]vault=([^&#]+)/);
        if (match && match[1]) codeToSearch = decodeURIComponent(match[1]);
      } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
          const urlObj = new URL(raw);
          const p = urlObj.searchParams.get('vaultCode') || urlObj.searchParams.get('vault');
          if (p) codeToSearch = p;
          else codeToSearch = urlObj.pathname.split('/').filter(Boolean).pop() || raw;
        } catch {}
      }

      const found = await findEventFolderByCode(codeToSearch);
      if (found) {
        setGuestVerifiedFolder(found);
      } else {
        setJoinError('Vault not found. Please verify the code or link and try again.');
      }
    } catch {
      setJoinError('Failed to verify code. Please check and try again.');
    } finally {
      setVerifyingGuestCode(false);
    }
  };

  // Cheer / Like
  const handleCheer = (media: VaultMedia) => {
    cheerVaultMedia(media.id, media.likesCount || 0);
  };

  // Delete Media
  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.confirm('Delete this picture/video?')) return;
    try {
      await deleteVaultMedia(mediaId);
      if (lightboxItem?.id === mediaId) setLightboxItem(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Copy share code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // ── VIEW 0: AUTHENTICATION REQUIRED GATE FOR MEMVAULT ──
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6 text-center">
        {onBackToHome && (
          <div className="flex justify-start">
            <button
              onClick={onBackToHome}
              className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-gray-300 hover:text-white border border-[#383838] transition flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to Party Rooms</span>
            </button>
          </div>
        )}

        <div className="p-8 sm:p-10 rounded-3xl bg-[#202020] border border-[#383838] space-y-6 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-violet-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <FolderLock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <FolderLock className="w-3.5 h-3.5" />
              <span>Private & Secure Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit">
              Sign In to Access MemVault
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
              MemVault is exclusively accessible to registered hosts and invited party guests. Sign in or register to view your event albums, upload pictures & videos, or join shared party vaults.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateAuth?.('login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => onNavigateAuth?.('signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#2a2a2a] hover:bg-[#353535] text-white border border-[#404040] font-bold text-sm transition active:scale-95 cursor-pointer"
            >
              Create Free Account
            </button>
          </div>

          {/* Quick Join With Link/Code Card */}
          <div className="pt-6 border-t border-[#303030] text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
              <Link className="w-4 h-4 text-sky-400" />
              <span>Have a Party Share Link or Invite Code?</span>
            </div>
            <p className="text-xs text-gray-400">
              Paste your link or party code below to verify the vault. Once verified, sign in or register to unlock access.
            </p>
            <form onSubmit={handleGuestVerifyCode} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VAULT-1234 or paste shared link..."
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  setGuestVerifiedFolder(null);
                  setJoinError(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={verifyingGuestCode || !joinInput.trim()}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {verifyingGuestCode ? 'Checking...' : 'Check Vault'}
              </button>
            </form>

            {guestVerifiedFolder && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Found Event: {guestVerifiedFolder.name} ({guestVerifiedFolder.date})</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Click below to sign in or create an account. You will automatically join and open this vault!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('celebrato_pending_vault_code', guestVerifiedFolder.shareCode || guestVerifiedFolder.id);
                    onNavigateAuth?.('login');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  Sign In / Register & Unlock Vault →
                </button>
              </div>
            )}

            {joinError && (
              <p className="text-xs text-rose-400 font-medium">{joinError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden File Inputs for Direct Camera & Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFilesSelected}
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFilesSelected}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      {/* ── VIEW 1: DEDICATED EVENT FOLDER DETAIL PAGE ── */}
      {selectedFolder ? (
        (() => {
          const isOwner = selectedFolder.userId === currentUser?.uid;
          const isJoined = joinedFolderIds.includes(selectedFolder.id) || (selectedFolder.shareCode && joinedFolderIds.includes(selectedFolder.shareCode));
          const hasAccess = isOwner || isJoined || isAdmin;

          if (!hasAccess) {
            return (
              <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                  <FolderLock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white font-outfit">Private Event Vault</h2>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    This album is private to the host and invited guests. You need a shared party link or invite code to access and view pictures.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setJoinError(null);
                      setIsJoinOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    Enter Invite Code / Link
                  </button>
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#282828] text-gray-300 hover:text-white border border-[#3e3e3e] font-bold text-xs cursor-pointer"
                  >
                    Back to My Vaults
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#252525] border border-[#383838]">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <button
                    id="vault-back-to-folders-btn"
                    onClick={() => setSelectedFolder(null)}
                    className="p-2.5 rounded-2xl bg-[#1c1c1c] hover:bg-[#303030] text-gray-300 hover:text-white border border-[#383838] transition flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0"
                    title="Back to All Folders"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">All Folders</span>
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-black text-white font-outfit truncate">
                        {selectedFolder.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold shrink-0">
                        {selectedFolder.shareCode || 'VAULT'}
                      </span>
                      {isOwner ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0">
                          👑 Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0">
                          🔗 Joined Vault
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{selectedFolder.date}</span>
                      <span>•</span>
                      <span>{folderMedia.length} memories</span>
                    </p>
                  </div>
                </div>

                {/* Quick Action Trigger Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  {/* Camera Direct Action */}
                  <button
                    id="vault-camera-btn"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Take Photo or Video with Camera"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Take Photo / Video</span>
                    <span className="sm:hidden">Camera</span>
                  </button>

                  {/* Upload Gallery Action */}
                  <button
                    id="vault-upload-btn"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-[#2b2b2b] text-white border border-[#383838] font-bold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Upload from Gallery"
                  >
                    <Upload className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>

                  {/* Share Folder Button */}
                  <button
                    id="vault-share-folder-btn"
                    onClick={handleShareFolder}
                    className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-[#2b2b2b] text-gray-300 hover:text-amber-400 border border-[#383838] font-bold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Share Event Vault Link & Code"
                  >
                    {folderShareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                    <span className="hidden sm:inline">{folderShareCopied ? 'Link Copied!' : 'Share'}</span>
                  </button>

                  {/* Leave or Delete Folder */}
                  {!isOwner ? (
                    <button
                      onClick={() => handleLeaveVault(selectedFolder.id)}
                      className="px-3 py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-[#383838] font-bold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Remove from Joined Vaults"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Leave Vault</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteFolder(e, selectedFolder.id)}
                      className="px-3 py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-[#383838] font-bold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Delete Entire Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Upload Status Banner */}
              {uploadStatus && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>{uploadStatus}</span>
                </div>
              )}

              {/* Description banner */}
              <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-[#333] flex items-center justify-between gap-4 text-xs">
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Album Description:</strong> {selectedFolder.description}
                </p>
                <div className="shrink-0 text-gray-400 font-mono text-[11px] hidden sm:block">
                  Code: <strong className="text-white">{selectedFolder.shareCode}</strong>
                </div>
              </div>

              {/* Media Filtering Tabs */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Media Type Filter */}
                  <div className="inline-flex p-1 bg-[#202020] rounded-xl border border-[#383838] text-xs">
                    <button
                      onClick={() => setMediaFilter('all')}
                      className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                        mediaFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({folderMedia.length})
                    </button>
                    <button
                      onClick={() => setMediaFilter('image')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        mediaFilter === 'image' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Photos ({folderMedia.filter(m => m.mediaType === 'image').length})
                    </button>
                    <button
                      onClick={() => setMediaFilter('video')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        mediaFilter === 'video' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      Videos ({folderMedia.filter(m => m.mediaType === 'video').length})
                    </button>
                  </div>

                  {/* Creator Filter Toggle: All Party Media vs My Uploads Only */}
                  <div className="inline-flex p-1 bg-[#202020] rounded-xl border border-[#383838] text-xs">
                    <button
                      onClick={() => setUploaderFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        uploaderFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All Media
                    </button>
                    <button
                      onClick={() => setUploaderFilter('mine')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        uploaderFilter === 'mine' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      My Uploads ({folderMedia.filter(m => currentUser && m.uploadedByUid === currentUser.uid).length})
                    </button>
                  </div>
                </div>

                {uploading && (
                  <span className="text-xs font-semibold text-amber-400 animate-pulse flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Saving memories to folder...
                  </span>
                )}
              </div>

              {/* Media Grid */}
              {filteredMedia.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-3xl bg-[#202020] border border-[#333] space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white font-outfit">
                      {uploaderFilter === 'mine' ? 'No Uploads by You Yet' : 'No Photos or Videos in this Folder Yet'}
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      {uploaderFilter === 'mine' 
                        ? 'Snap photos directly or upload pictures/videos to share them in this vault!' 
                        : 'Snap pictures directly with your camera or select videos from your gallery to save them into this album.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo / Video
                    </button>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#282828] text-white border border-[#3e3e3e] font-bold text-xs hover:bg-[#323232] cursor-pointer"
                    >
                      Upload Files
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      id={`folder-media-${media.id}`}
                      onClick={() => setLightboxItem(media)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-[#181818] border border-[#333] hover:border-amber-400/50 transition cursor-pointer shadow-lg"
                    >
                      {media.mediaType === 'video' ? (
                        <div className="w-full h-full relative">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                            <div className="w-10 h-10 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={media.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity pointer-events-none" />

                      {/* Top badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                            {media.mediaType === 'video' ? 'Video' : 'Photo'}
                          </span>
                          {currentUser && media.uploadedByUid === currentUser.uid && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                              You
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheer(media);
                          }}
                          className="px-2 py-0.5 rounded-full bg-black/75 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition backdrop-blur-sm border border-white/10"
                        >
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500 hover:text-white" />
                          <span>{media.likesCount || 0}</span>
                        </button>
                      </div>

                      {/* Bottom details */}
                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        <h5 className="text-xs font-bold text-white truncate drop-shadow">
                          {media.title}
                        </h5>
                        <p className="text-[10px] text-gray-300 truncate">
                          By {media.uploadedByName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      ) : (
        /* ── VIEW 2: ALL EVENT FOLDERS LIST ── */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#252525] via-[#202020] to-[#1c1c1c] border border-[#383838]">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <FolderLock className="w-3.5 h-3.5" />
                <span>Memory Vault</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
                Event Folders & Media Vault
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                Create dedicated albums for birthdays, celebrations, or corporate suites. Open any folder to snap photos or upload party clips.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <button
                id="vault-join-btn"
                onClick={() => {
                  setJoinError(null);
                  setIsJoinOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-[#282828] hover:bg-[#323232] text-white border border-[#3e3e3e] font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Link className="w-4 h-4 text-sky-400" />
                <span>Join Vault</span>
              </button>

              <button
                id="vault-create-folder-btn"
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event Folder</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search event folders by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Folders Grid */}
          {filteredFolders.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#202020] border border-[#333] space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <FolderLock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-outfit">No Event Folders Found</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                  You haven't created or joined any private event albums yet. Create your first folder to start collecting party memories, or join an existing vault with a shared link or code!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  + Create First Folder
                </button>
                <button
                  onClick={() => {
                    setJoinError(null);
                    setIsJoinOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#282828] hover:bg-[#333] text-white border border-[#3e3e3e] font-bold text-xs cursor-pointer"
                >
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFolders.map((folder) => {
                const isFolderOwner = folder.userId === currentUser?.uid;
                const isFolderJoined = joinedFolderIds.includes(folder.id) || (folder.shareCode && joinedFolderIds.includes(folder.shareCode));

                return (
                  <div
                    key={folder.id}
                    id={`event-folder-card-${folder.id}`}
                    onClick={() => setSelectedFolder(folder)}
                    className="group relative rounded-3xl overflow-hidden bg-[#202020] border border-[#383838] hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between shadow-xl hover:-translate-y-1 duration-300"
                  >
                    {/* Cover Header Image */}
                    <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={folder.coverImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'}
                        alt={folder.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-[#202020]/40 to-transparent" />
                      
                      {/* Share Code badge & Owner/Joined status */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-amber-400 font-mono text-[11px] font-bold">
                          {folder.shareCode || 'VAULT'}
                        </div>
                        {isFolderOwner ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                            Owner
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                            Joined
                          </span>
                        )}
                      </div>

                      {/* Delete option for Owner/Admin or Leave option for Joined */}
                      {isFolderOwner || isAdmin ? (
                        <button
                          onClick={(e) => handleDeleteFolder(e, folder.id)}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-rose-500 text-gray-300 hover:text-white transition backdrop-blur-md"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveVault(folder.id);
                          }}
                          className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-black/60 hover:bg-rose-500 text-gray-300 hover:text-white transition backdrop-blur-md text-[10px] font-bold"
                          title="Remove from Joined Vaults"
                        >
                          Leave
                        </button>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{folder.date}</span>
                        </div>
                        <h3 className="text-lg font-black text-white font-outfit group-hover:text-amber-300 transition">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {folder.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#333] flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-rose-400" />
                          <span>Open & Add Media</span>
                        </span>

                        <div className="px-3 py-1.5 rounded-xl bg-[#2b2b2b] group-hover:bg-amber-500 group-hover:text-slate-950 text-xs font-bold text-white transition flex items-center gap-1">
                          <span>Open Folder</span>
                          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE EVENT FOLDER ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#222222] border border-[#3e3e3e] p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FolderLock className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-white font-outfit">Create Event Folder</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#303030]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram's 25th Neon Party"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={newFolderDate}
                  onChange={(e) => setNewFolderDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write a brief note (e.g. Suite party memories, DJ highlights, and guest snapshots)..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#2b2b2b] text-xs font-semibold text-gray-300 hover:bg-[#383838]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {creatingFolder ? 'Creating...' : 'Create Folder & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD BY URL ── */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#222222] border border-[#3e3e3e] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <h3 className="text-lg font-black text-white font-outfit">Add Image or Video via Link</h3>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#303030]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddByUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Media Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrlType('image')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      urlType === 'image' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-[#181818] text-gray-300 border-[#383838]'
                    }`}
                  >
                    Photo Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlType('video')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      urlType === 'video' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-[#181818] text-gray-300 border-[#383838]'
                    }`}
                  >
                    Video Link (MP4/WebM)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  URL Address *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Caption / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stage Laser Jam"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#2b2b2b] text-xs font-semibold text-gray-300 hover:bg-[#383838]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {uploading ? 'Adding...' : 'Save to Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: JOIN EVENT VAULT WITH LINK OR CODE ── */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#222222] border border-[#3e3e3e] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Link className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-white font-outfit">Join Event Vault</h3>
              </div>
              <button
                onClick={() => {
                  setIsJoinOpen(false);
                  setJoinError(null);
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#303030]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Paste the shared link you received or enter the Party Vault Code (e.g. <span className="text-amber-400 font-mono">VAULT-4892</span>) to access all photos and videos.
            </p>

            <form onSubmit={handleJoinVault} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Shared Link or Vault Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAULT-1234 or https://.../?vaultCode=..."
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  className="w-full px-4 py-3 bg-[#181818] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                />
                {joinError && (
                  <p className="text-xs text-rose-400 font-medium mt-1.5">{joinError}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinOpen(false);
                    setJoinError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#2b2b2b] text-xs font-semibold text-gray-300 hover:bg-[#383838]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joiningVault || !joinInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {joiningVault ? 'Verifying...' : 'Join & Open Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN MEDIA LIGHTBOX POPUP MODAL ── */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#1e1e1e] border border-[#383838] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Bar */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#303030] bg-[#222222]">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 mr-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider shrink-0">
                  {lightboxItem.mediaType === 'video' ? 'Video' : 'Photo'}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-white font-outfit truncate">
                    {lightboxItem.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    Added by <strong className="text-amber-400">{lightboxItem.uploadedByName}</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Download, Share, Cheer, Delete, Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Download Button */}
                <button
                  onClick={() => handleDownloadMedia(lightboxItem)}
                  title="Download to device"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#282828] hover:bg-[#333] text-gray-200 hover:text-white border border-[#3e3e3e] transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleShareMedia(lightboxItem)}
                  title="Share memory"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#282828] hover:bg-[#333] text-gray-200 hover:text-amber-400 border border-[#3e3e3e] transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {mediaShareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
                  <span className="hidden sm:inline">{mediaShareCopied ? 'Link Copied!' : 'Share'}</span>
                </button>

                {/* Cheer Button */}
                <button
                  onClick={() => handleCheer(lightboxItem)}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Cheer"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">{lightboxItem.likesCount || 0}</span>
                </button>

                {/* Delete Button (Uploader / Admin) */}
                {(lightboxItem.uploadedByUid === currentUser?.uid || isAdmin) && (
                  <button
                    onClick={() => handleDeleteMedia(lightboxItem.id)}
                    title="Delete Memory"
                    className="p-2 text-gray-400 hover:text-rose-400 rounded-xl hover:bg-[#2e2e2e] transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setLightboxItem(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#2e2e2e] transition cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Media Display Viewport */}
            <div className="relative flex-1 min-h-[260px] max-h-[72vh] flex items-center justify-center bg-[#0d0d0d] p-2 sm:p-4 overflow-hidden select-none">
              {lightboxItem.mediaType === 'video' ? (
                <video
                  src={lightboxItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[68vh] max-w-full rounded-2xl shadow-2xl"
                />
              ) : (
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.title}
                  className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}

              {/* Previous / Next Arrows if multiple media items */}
              {filteredMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevLightbox();
                    }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer active:scale-95 shadow-xl"
                    title="Previous memory"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextLightbox();
                    }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer active:scale-95 shadow-xl"
                    title="Next memory"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

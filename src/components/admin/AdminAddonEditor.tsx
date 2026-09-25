import React, { useState, useRef } from 'react';
import { AddOnItem } from '../../types';
import { 
  ArrowLeft, 
  Save, 
  Tag, 
  Upload, 
  Image as ImageIcon,
  DollarSign,
  Sparkles
} from 'lucide-react';

interface AdminAddonEditorProps {
  addon?: AddOnItem | null;
  onBack: () => void;
  onSave: (addon: AddOnItem) => Promise<void>;
}

export const AdminAddonEditor: React.FC<AdminAddonEditorProps> = ({
  addon,
  onBack,
  onSave,
}) => {
  const isNew = !addon;

  const [formData, setFormData] = useState<AddOnItem>({
    id: addon?.id || `addon-${Date.now().toString().slice(-6)}`,
    name: addon?.name || '',
    category: addon?.category || 'balloons',
    price: addon?.price ?? 999,
    imageUrl: addon?.imageUrl || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
    description: addon?.description || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData({ ...formData, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter an add-on item name.');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setErrorMsg('Please specify a valid price in INR.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || 'Custom party enhancement add-on.',
      });
      onBack();
    } catch (err) {
      console.error('Failed to save add-on', err);
      setErrorMsg('Error saving add-on item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="admin-addon-editor-page" className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#202020] border border-[#383838] shadow-xl space-y-4">
        {/* Top Row: Back button icon on left (NOT yellow), Actions on right */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="admin-addon-editor-back-btn"
            type="button"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-[#282828] hover:bg-[#323232] active:bg-[#3d3d3d] text-gray-200 hover:text-white border border-[#3d3d3d] transition active:scale-95 shrink-0 shadow-md cursor-pointer flex items-center justify-center group"
            title="Return to Add-Ons Catalog"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-200 group-hover:text-white transition" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 hover:text-white border border-[#383838] text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isNew ? 'Add to Catalog' : 'Save Add-On'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Line for Title & Subtitle */}
        <div className="pt-2 border-t border-[#303030]/70 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {isNew ? 'New Catalog Item' : 'Add-On Editor'}
            </span>
            <span className="font-mono text-xs text-gray-400">
              {formData.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
            {isNew ? 'Create New Party Add-On' : `Edit Add-On: ${formData.name || addon?.name}`}
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Configure enhancement pricing, category classification, photo preview, and customer package description.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Info (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Add-On Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe Balloon Garland Arch"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="balloons">Balloons & Arches</option>
                      <option value="cakes">Cakes & Desserts</option>
                      <option value="lighting">Party Lighting & Lasers</option>
                      <option value="dj">DJ Gear & Audio</option>
                      <option value="catering">Snacks & Mocktails</option>
                      <option value="props">Costumes & Props</option>
                      <option value="other">Other Enhancements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                      Price in INR (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-amber-400">₹</span>
                      <input
                        type="number"
                        required
                        min="50"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-base font-black text-amber-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Item Description & What is Included *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details on what the host will receive, setup duration, color options..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo & Preview (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Add-On Photo Preview
              </h3>

              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-[#181818] border border-[#383838]">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt={formData.name || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No image uploaded
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-200 border border-[#383838] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Local Photo</span>
              </button>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 rounded-3xl bg-[#202020] border border-[#383838] flex items-center justify-end gap-3 shadow-lg">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : isNew ? 'Add to Catalog' : 'Save Add-On'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

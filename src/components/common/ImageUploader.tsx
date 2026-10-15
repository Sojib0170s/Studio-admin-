import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { uploadThumbnail, validateImageFile } from '../../services/storageService';

interface ImageUploaderProps {
  currentUrl?: string;
  folder?: 'prompts' | 'categories' | 'branding';
  onImageSelected: (url: string) => void;
  aspectRatio?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl,
  folder = 'prompts',
  onImageSelected,
  aspectRatio = 'aspect-square',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await executeUpload(file);
  };

  const executeUpload = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file format.');
      return;
    }

    setErrorMsg(null);
    setFailedFile(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const downloadUrl = await uploadThumbnail(file, folder, (progress) => {
        setUploadProgress(progress);
      });
      onImageSelected(downloadUrl);
      setUrlInput(downloadUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
      setFailedFile(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetry = () => {
    if (failedFile) {
      executeUpload(failedFile);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter an image URL.');
      return;
    }
    try {
      new URL(urlInput.trim());
      setErrorMsg(null);
      onImageSelected(urlInput.trim());
    } catch {
      setErrorMsg('Please enter a valid HTTP or HTTPS URL.');
    }
  };

  const handleClearImage = () => {
    onImageSelected('');
    setUrlInput('');
    setErrorMsg(null);
    setFailedFile(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Preview Image / Thumbnail
        </label>
        <div className="flex bg-[#12131C] p-0.5 rounded-lg border border-[#272A3E]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'url' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      {currentUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-[#272A3E] bg-[#12131C] p-2 flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-[#272A3E]">
            <img
              src={currentUrl}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-slate-300 truncate">{currentUrl}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              ✓ Image attached
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearImage}
            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer mr-1"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {activeTab === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id="image-upload-input"
          />

          <label
            htmlFor="image-upload-input"
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer ${
              isUploading
                ? 'border-purple-500/50 bg-purple-500/5'
                : 'border-[#272A3E] hover:border-purple-500/50 bg-[#12131C]/60 hover:bg-[#12131C]'
            }`}
          >
            {isUploading ? (
              <div className="w-full max-w-xs space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <div className="w-full bg-[#1F2133] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-purple-300 font-medium">
                  Uploading to Firebase Storage: {uploadProgress}%
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Click to select photo or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPEG, PNG, WebP up to 5 MB
                </p>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/images/portrait.jpg"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#12131C] border border-[#272A3E] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors cursor-pointer"
          >
            Set URL
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          {failedFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 font-medium text-white bg-rose-600/40 hover:bg-rose-600 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

import { useState, useCallback, useEffect, useRef, type ChangeEvent, type FC, memo } from "react";
import Image from "next/image";
import { Input } from "@/components/input";
import { Loader2, Upload, RefreshCw, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatFileSize, CLOUDINARY_SETTINGS, FILE_ACCEPT_ATTRIBUTES } from "@/lib/cloudinary";
import { retryWithBackoff } from "@/lib/async-utils";

export interface CloudinaryAsset {
  publicId: string;
  secureUrl: string;
  previewUrl: string;
  folder: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  createdAt?: string;
  resourceType?: 'image' | 'video';
}

interface CloudinaryAssetBrowserProps {
  usageMap: Map<string, string[]>;
  onSelectAsset: (asset: CloudinaryAsset) => void;
  onDeleteAsset: (asset: CloudinaryAsset) => void;
  onUploadFile: (file: File) => Promise<void>;
  onBulkDelete?: (assets: { publicId: string; resourceType: string }[]) => void;
  onDeleteSuccess?: () => void;
  refreshTrigger?: number;
}

// Asset card component for better organization
interface AssetCardProps {
  asset: CloudinaryAsset;
  isPublished: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: (publicId: string) => void;
  onSelect: (asset: CloudinaryAsset) => void;
  onDelete: (asset: CloudinaryAsset) => void;
}

function AssetCard({
  asset,
  isPublished,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onSelect,
  onDelete,
}: AssetCardProps) {
  const isVideo = asset.resourceType === 'video' ||
    (asset.format && ['mp4', 'mov', 'avi', 'webm', 'm4v'].includes(asset.format.toLowerCase()));

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-md border transition-shadow outline-none focus:outline-none ${isSelected
        ? "border-primary ring-2 ring-primary/20"
        : "border-gray-200 dark:border-gray-700"
        } bg-white shadow-sm hover:shadow-md dark:bg-gray-900`}
      onClick={isSelectionMode ? () => onToggleSelect(asset.publicId) : undefined}
      onMouseDown={(e) => {
        if (isSelectionMode) {
          e.preventDefault();
        }
      }}
      tabIndex={isSelectionMode ? 0 : -1}
    >
      {/* Media Container */}
      <div
        className={`relative h-32 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 ${isSelectionMode ? "cursor-pointer" : ""
          }`}
      >
        {isVideo ? (
          <video
            src={asset.secureUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            onMouseEnter={(e) => {
              e.currentTarget.play().catch(() => {
                // Silently handle autoplay errors (browser restrictions)
              });
            }}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <Image
            src={asset.previewUrl}
            alt={asset.publicId}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={CLOUDINARY_SETTINGS.imageSizes}
            priority={false}
          />
        )}
        {isSelectionMode && (
          <div
            className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 z-10 ${isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-white bg-white/50"
              }`}
          >
            {isSelected && (
              <CheckCircle2 className="h-4 w-4 text-white" aria-hidden="true" />
            )}
          </div>
        )}
        {!isSelectionMode && isPublished && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow-lg z-10">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Used
          </div>
        )}
        {isVideo && (
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white z-10">
            VIDEO
          </div>
        )}
      </div>

      {/* Asset Info */}
      <div className="flex min-w-0 flex-1 flex-col space-y-2 p-3">
        <p
          className="truncate text-[11px] font-mono text-gray-600 dark:text-gray-400"
          title={asset.publicId}
        >
          {asset.publicId}
        </p>
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>
            {asset.width} × {asset.height}
          </span>
          <span>{formatFileSize(asset.bytes)}</span>
        </div>

        {/* Action Buttons */}
        {!isSelectionMode && (
          <div className="mt-auto flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onSelect(asset)}
              onMouseDown={(e) => e.preventDefault()}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 focus:outline-none dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              aria-label={`Select ${asset.publicId}`}
            >
              Select
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("[AssetCard] Delete button clicked for:", asset.publicId);
                onDelete(asset);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="inline-flex items-center justify-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              aria-label={`Delete ${asset.publicId}`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

const CloudinaryAssetBrowserComponent: FC<CloudinaryAssetBrowserProps> = ({
  usageMap,
  onSelectAsset,
  onDeleteAsset,
  onUploadFile,
  onBulkDelete,
  onDeleteSuccess,
  refreshTrigger,
}) => {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastAssetCount, setLastAssetCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function for API calls
  const fetchFromApi = useCallback(async (resourceType: 'image' | 'video', limit: number, cursor?: string, signal?: AbortSignal) => {
    return retryWithBackoff(async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        resourceType,
      });
      if (cursor) params.set("nextCursor", cursor);

      const response = await fetch(`/api/admin/uploads/cloudinary-list?${params.toString()}`, { signal });
      if (!response.ok) {
        // Return empty array for auto-sync checks, but let the main fetch handle errors differently if needed
        // Currently throwing to be caught by caller
        const data = (await response.json()) as Record<string, unknown>;
        throw new Error(String(data?.error ?? `Unable to load Cloudinary ${resourceType}s`));
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        assets: Array.isArray(data.assets) ? (data.assets as CloudinaryAsset[]) : [],
        nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null
      };
    });
  }, []);

  const fetchAssets = useCallback(async (cursor?: string, reset = false) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    if (reset) {
      setAssets([]);
      setNextCursor(null);
    }

    try {
      // Fetch both images and videos in parallel
      const [imageResult, videoResult] = await Promise.all([
        fetchFromApi('image', CLOUDINARY_SETTINGS.assetsPerPage, cursor, signal),
        fetchFromApi('video', CLOUDINARY_SETTINGS.assetsPerPage, cursor, signal)
      ]);

      // Combine and deduplicate by publicId (in case an asset appears in both lists)
      const allAssetsMap = new Map();

      // Add image assets first
      imageResult.assets.forEach(asset => {
        allAssetsMap.set(asset.publicId, asset);
      });

      // Add video assets, overriding any duplicates (videos take priority)
      videoResult.assets.forEach(asset => {
        allAssetsMap.set(asset.publicId, asset);
      });

      const allAssets = Array.from(allAssetsMap.values()).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setAssets((prev) => {
        if (reset) {
          setLastAssetCount(allAssets.length);
          return allAssets;
        }

        // For pagination, only add new assets that don't already exist
        const existingIds = new Set(prev.map(asset => asset.publicId));
        const newAssets = allAssets.filter(asset => !existingIds.has(asset.publicId));
        const combined = [...prev, ...newAssets];

        setLastAssetCount(combined.length);
        return combined;
      });

      // Use the cursor from images or videos (whichever has more results)
      setNextCursor(imageResult.nextCursor || videoResult.nextCursor || null);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : "Unable to load Cloudinary assets";
      setError(message);
      console.error("Cloudinary fetch error:", err);
    } finally {
      if (abortControllerRef.current?.signal === signal) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [sortOrder, fetchFromApi]);

  useEffect(() => {
    void fetchAssets(undefined, true);
  }, [fetchAssets]);

  // Refresh when trigger changes (after delete from UI)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      void fetchAssets(undefined, true);
    }
  }, [refreshTrigger, fetchAssets]);

  // Auto-sync: Check for deletions from Cloudinary website every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Only check if we have assets and no ongoing fetch
        if (loading || assets.length === 0) return;

        // Quick check for both images and videos using small limit
        const checkResourceType = async (resourceType: 'image' | 'video') => {
          try {
            const result = await fetchFromApi(resourceType, 10);
            return result.assets;
          } catch {
            return [];
          }
        };

        const [imageAssets, videoAssets] = await Promise.all([
          checkResourceType('image'),
          checkResourceType('video')
        ]);

        const totalFetched = imageAssets.length + videoAssets.length;

        // If asset count decreased significantly, refresh the full list (assets were deleted from Cloudinary)
        if (totalFetched < lastAssetCount - 2 && totalFetched > 0) {
          console.log(
            "[CloudinarySync] Detected deletion from Cloudinary website:",
            lastAssetCount,
            "→",
            totalFetched
          );
          void fetchAssets(undefined, true);
        }
      } catch (err) {
        console.error("[CloudinarySync] Auto-sync error:", err);
      }
    }, 60000); // Check every 60 seconds instead of 30

    return () => clearInterval(interval);
  }, [lastAssetCount, fetchAssets, loading, assets.length, fetchFromApi]);

  const handleRefresh = useCallback(() => {
    void fetchAssets(undefined, true);
    setSelectedAssets(new Set());
    setIsSelectionMode(false);
  }, [fetchAssets]);

  const toggleSelectAsset = useCallback((publicId: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(publicId)) {
        newSet.delete(publicId);
      } else {
        newSet.add(publicId);
      }
      return newSet;
    });
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    if (onBulkDelete && selectedAssets.size > 0) {
      const assetsToDelete = assets
        .filter(asset => selectedAssets.has(asset.publicId))
        .map(asset => ({
          publicId: asset.publicId,
          resourceType: asset.resourceType ||
            (asset.format && ['mp4', 'mov', 'avi', 'webm', 'm4v'].includes(asset.format.toLowerCase()) ? 'video' : 'image')
        }));

      onBulkDelete(assetsToDelete);
      setSelectedAssets(new Set());
      setIsSelectionMode(false);
      // Refresh after a short delay to allow backend processing
      setTimeout(() => {
        void fetchAssets(undefined, true);
        onDeleteSuccess?.();
      }, 500);
    }
  }, [onBulkDelete, selectedAssets, assets, fetchAssets, onDeleteSuccess]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loading) {
      void fetchAssets(nextCursor, false);
    }
  }, [nextCursor, loading, fetchAssets]);

  const handleFileInput = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadingFile(true);
      try {
        // Upload all files (single or multiple)
        const uploadPromises = Array.from(files).map(file => onUploadFile(file));
        await Promise.all(uploadPromises);
        // Don't refresh here - parent component will trigger refresh via refreshTrigger prop
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingFile(false);
        event.target.value = "";
      }
    },
    [onUploadFile]
  );

  const displayedAssets = assets.filter((asset) =>
    asset.publicId.toLowerCase().includes(query.toLowerCase())
  );

  const hasAssets = assets.length > 0;
  const hasFilteredAssets = displayedAssets.length > 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="shrink-0 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {displayedAssets.length}/{assets.length} assets
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
              Auto-sync
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-7 w-36 rounded-full border-0 bg-gray-50 px-3 text-xs dark:bg-gray-800 dark:text-gray-100 sm:w-44"
              aria-label="Search Cloudinary assets"
            />
            <button
              type="button"
              onClick={handleRefresh}
              onMouseDown={(e) => e.preventDefault()}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Refresh asset list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle sort order"
            >
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </button>
            {onBulkDelete && (
              <button
                type="button"
                onClick={() => {
                  const wasInSelectionMode = isSelectionMode;
                  setIsSelectionMode(!isSelectionMode);
                  if (wasInSelectionMode) {
                    setSelectedAssets(new Set());
                    const activeElement = document.activeElement as HTMLElement;
                    if (activeElement) {
                      activeElement.blur();
                    }
                  }
                }}
                onMouseDown={(e) => e.preventDefault()}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none ${isSelectionMode
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                aria-label="Toggle selection mode"
              >
                {isSelectionMode ? "Cancel" : "Select"}
              </button>
            )}
            {isSelectionMode && selectedAssets.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDeleteClick}
                onMouseDown={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 focus:outline-none"
                aria-label={`Delete ${selectedAssets.size} selected assets`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {selectedAssets.size}
              </button>
            )}
            <label
              htmlFor="cloud-upload"
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-opacity ${uploadingFile ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                }`}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {uploadingFile ? "..." : "Upload"}
            </label>
            <Input
              id="cloud-upload"
              type="file"
              accept={FILE_ACCEPT_ATTRIBUTES.all}
              multiple
              onChange={handleFileInput}
              disabled={uploadingFile}
              className="sr-only"
            />
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <section className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-hide">
        <div className="flex flex-col gap-3">
          {/* Error Display */}
          {error && (
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Progress */}
          {uploadingFile && (
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 p-2 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-400">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
              <span>Uploading...</span>
            </div>
          )}

          {/* Assets Grid */}
          {loading && !hasAssets ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" aria-hidden="true" />
            </div>
          ) : !hasAssets ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No assets found. Upload one to get started.
              </p>
            </div>
          ) : !hasFilteredAssets ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No assets match your search.
              </p>
            </div>
          ) : (
            <div className="grid w-full gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {displayedAssets.map((asset) => (
                <AssetCard
                  key={asset.publicId}
                  asset={asset}
                  isPublished={usageMap.has(asset.publicId)}
                  isSelected={selectedAssets.has(asset.publicId)}
                  isSelectionMode={isSelectionMode}
                  onToggleSelect={toggleSelectAsset}
                  onSelect={onSelectAsset}
                  onDelete={onDeleteAsset}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && (
            <div className="flex shrink-0 justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                onMouseDown={(e) => e.preventDefault()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Load more assets"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const CloudinaryAssetBrowser = memo(CloudinaryAssetBrowserComponent);

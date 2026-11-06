import ConfirmationModal from '@/components/confirmation-modal';
import galleryRoutes from '@/routes/admin/gallery';
import { InfiniteScroll, router } from '@inertiajs/react';
import {
    Check,
    Copy,
    ExternalLink,
    FileText,
    Film,
    Image as ImageIcon,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export type GalleryMedia = {
    id: number;
    name: string;
    alt: string;
    path?: string;
    type: 'image' | 'video' | 'other';
    mimeType: string;
    url: string;
    storageUrl?: string;
    size: number;
    width: number;
    height: number;
    createdAt: string | null;
};

type DisplayTabProps = {
    media: GalleryMedia[];
    hasMedia: boolean;
    hasAnyMedia: boolean;
    hasSearch: boolean;
};

const getStorageUrl = (asset: GalleryMedia): string => {
    if (asset.storageUrl) {
        return asset.storageUrl.startsWith('/')
            ? asset.storageUrl
            : `/${asset.storageUrl}`;
    }
    if (asset.path) {
        return `/storage/${asset.path.replace(/^\/+/, '')}`;
    }
    const url = asset.url;
    const storageIndex = url.indexOf('/storage/');
    if (storageIndex !== -1) {
        return url.substring(storageIndex);
    }
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.pathname;
    } catch {
        return url.startsWith('/') ? url : `/${url}`;
    }
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;

    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    }

    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
};

const formatDate = (value: string | null): string => {
    if (!value) return 'Date unavailable';

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
};

const DisplayTab = ({
    media,
    hasMedia,
    hasAnyMedia,
    hasSearch,
}: DisplayTabProps) => {
    const [deleteTarget, setDeleteTarget] = useState<GalleryMedia | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopyUrl = async (asset: GalleryMedia) => {
        const storageUrl = getStorageUrl(asset);
        let success = false;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(storageUrl);
                success = true;
            }
        } catch {
            // fallback to textarea copy
        }

        if (!success) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = storageUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                success = document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch {
                success = false;
            }
        }

        if (success) {
            setCopiedId(asset.id);
            toast.success('URL copied to clipboard');
            window.setTimeout(() => {
                setCopiedId((current) =>
                    current === asset.id ? null : current,
                );
            }, 2000);
        } else {
            toast.error('Failed to copy URL');
        }
    };

    const deleteAsset = () => {
        if (!deleteTarget || isDeleting) return;

        setIsDeleting(true);
        router.delete(galleryRoutes.destroy.url(deleteTarget.id), {
            preserveScroll: true,
            reset: ['media'],
            onError: (errors) => {
                setDeleteError(errors.file ?? 'The file could not be deleted.');
            },
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteError(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            {!hasMedia ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {hasAnyMedia ? (
                            <ImageIcon className="size-6" />
                        ) : (
                            <FileText className="size-6" />
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {hasAnyMedia
                            ? 'No files in this category'
                            : 'Your media library is empty'}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {hasAnyMedia
                            ? 'Choose another category to see more media.'
                            : 'Upload images, videos, and documents to see them here.'}
                    </p>
                </div>
            ) : (
                <InfiniteScroll
                    data="media"
                    buffer={300}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    loading={
                        <p
                            className="col-span-full py-5 text-center text-sm text-muted-foreground"
                            role="status"
                        >
                            Loading more media...
                        </p>
                    }
                >
                    {media.length === 0 && (
                        <div className="col-span-full flex min-h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                            {hasSearch
                                ? 'No matching files on this page. More results may appear as you scroll.'
                                : 'No media is available on this page.'}
                        </div>
                    )}
                    {media.map((asset) => {
                        const FileIcon =
                            asset.type === 'video' ? Film : FileText;

                        return (
                            <article
                                key={asset.id}
                                className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/20"
                            >
                                <div className="relative aspect-4/3 overflow-hidden bg-muted/60">
                                    {asset.type === 'image' ? (
                                        <img
                                            src={asset.url}
                                            alt={asset.alt || asset.name}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                        />
                                    ) : asset.type === 'video' ? (
                                        <video
                                            src={asset.url}
                                            controls
                                            preload="metadata"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full flex-col items-center justify-center gap-3 bg-linear-to-br from-amber-50 to-slate-100 text-amber-800 dark:from-amber-950/30 dark:to-slate-900 dark:text-amber-300">
                                            <FileIcon
                                                className="size-12 stroke-[1.25]"
                                                aria-hidden="true"
                                            />
                                            <span className="rounded border border-current/20 px-2 py-1 text-xs font-semibold uppercase">
                                                {asset.name.split('.').pop() ||
                                                    'File'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyUrl(asset)}
                                            aria-label={`Copy URL for ${asset.name}`}
                                            title={
                                                copiedId === asset.id
                                                    ? 'URL copied!'
                                                    : 'Copy URL (/storage/...)'
                                            }
                                            className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-white/40 bg-black/55 text-white transition-colors hover:bg-black/75"
                                        >
                                            {copiedId === asset.id ? (
                                                <Check className="size-4 text-emerald-400" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </button>
                                        <a
                                            href={asset.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Open ${asset.name} in a new tab`}
                                            title="Open file"
                                            className="flex size-8 items-center justify-center rounded-md border border-white/40 bg-black/55 text-white transition-colors hover:bg-black/75"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteTarget(asset);
                                                setDeleteError(null);
                                            }}
                                            aria-label={`Delete ${asset.name}`}
                                            title="Delete file"
                                            className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-white/40 bg-red-700/90 text-white transition-colors hover:bg-red-800"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3
                                                className="truncate text-sm font-medium text-foreground"
                                                title={asset.name}
                                            >
                                                {asset.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {asset.type === 'image' &&
                                                asset.width > 0 &&
                                                asset.height > 0
                                                    ? `${asset.width} × ${asset.height} · `
                                                    : ''}
                                                {formatFileSize(asset.size)} ·{' '}
                                                {formatDate(asset.createdAt)}
                                            </p>
                                        </div>
                                        <span
                                            className={`mt-0.5 shrink-0 rounded px-2 py-1 text-[11px] font-medium ${
                                                asset.type === 'image'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : asset.type === 'video'
                                                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300'
                                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                            }`}
                                        >
                                            {asset.type}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                                        <code
                                            className="max-w-[180px] truncate rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground select-all sm:max-w-[200px]"
                                            title={getStorageUrl(asset)}
                                        >
                                            {getStorageUrl(asset)}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyUrl(asset)}
                                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                            title="Copy relative storage URL"
                                        >
                                            {copiedId === asset.id ? (
                                                <>
                                                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        Copied
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3 text-muted-foreground" />
                                                    <span>Copy URL</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </InfiniteScroll>
            )}

            <ConfirmationModal
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setDeleteTarget(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete media file?"
                description={
                    deleteTarget
                        ? `“${deleteTarget.name}” will be permanently deleted from the media library.`
                        : ''
                }
                confirmLabel="Delete file"
                processingLabel="Deleting..."
                destructive
                processing={isDeleting}
                error={deleteError}
                onConfirm={deleteAsset}
            />
        </>
    );
};

export default DisplayTab;

import galleryRoutes from '@/routes/admin/gallery';
import ConfirmationModal from '@/components/confirmation-modal';
import { InfiniteScroll, router } from '@inertiajs/react';
import {
    ExternalLink,
    FileText,
    Film,
    Image as ImageIcon,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

export type GalleryMedia = {
    id: number;
    name: string;
    alt: string;
    type: 'image' | 'video' | 'other';
    mimeType: string;
    url: string;
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
                                        <a
                                            href={asset.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Open ${asset.name} in a new tab`}
                                            title="Open file"
                                            className="flex size-8 items-center justify-center rounded-md border border-white/40 bg-black/55 text-white"
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
                                            className="flex size-8 items-center cursor-pointer justify-center rounded-md border border-white/40 bg-red-700/90 text-white hover:bg-red-800"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between gap-3 p-3.5">
                                    <div className="min-w-0">
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

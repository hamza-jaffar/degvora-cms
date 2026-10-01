import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import galleryRoutes from '@/routes/admin/gallery';
import { InfiniteScroll, router } from '@inertiajs/react';
import {
    Check,
    FileText,
    Film,
    Image as ImageIcon,
    ImagePlus,
    LayoutGrid,
    Search,
    Upload,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export type GalleryImage = {
    id: number;
    name: string;
    alt: string;
    path: string;
    url: string;
    type: 'image' | 'video' | 'other';
    mimeType: string;
};

type FilterType = 'all' | 'image' | 'video' | 'other';

type GalleryImagePickerProps = {
    id: string;
    media: { data: GalleryImage[] };
    counts: Record<FilterType, number>;
    filter: FilterType;
    search: string;
    filterUrl: string;
    selectedImage: GalleryImage | null;
    onSelect: (image: GalleryImage) => void;
};

const filterOptions = [
    { label: 'All media', value: 'all', icon: LayoutGrid },
    { label: 'Images', value: 'image', icon: ImageIcon },
    { label: 'Videos', value: 'video', icon: Film },
    { label: 'Other', value: 'other', icon: FileText },
] as const;

const GalleryImagePicker = ({
    id,
    media,
    counts,
    filter,
    search,
    filterUrl,
    selectedImage,
    onSelect,
}: GalleryImagePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>(filter);
    const [searchTerm, setSearchTerm] = useState(search);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const normalizedSearch = searchTerm.trim();

        if (selectedFilter === filter && normalizedSearch === search) return;

        const timeout = window.setTimeout(
            () => {
                router.get(
                    filterUrl,
                    {
                        filter: selectedFilter,
                        search: normalizedSearch,
                    },
                    {
                        only: ['media', 'counts', 'filter', 'search'],
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        reset: ['media'],
                    },
                );
            },
            selectedFilter === filter ? 300 : 0,
        );

        return () => window.clearTimeout(timeout);
    }, [filter, filterUrl, search, searchTerm, selectedFilter]);

    const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';

        if (!file || isUploading) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        router.post(
            galleryRoutes.picker.upload.url(),
            { file },
            {
                forceFormData: true,
                onProgress: (progress) => {
                    setUploadProgress(progress?.percentage ?? 0);
                },
                onError: (errors) => {
                    setUploadError(
                        errors.file ?? 'The image could not be uploaded.',
                    );
                },
                onSuccess: (page) => {
                    const uploadedImage = (
                        page.props as typeof page.props & {
                            pickerAsset?: GalleryImage | null;
                        }
                    ).pickerAsset;

                    if (uploadedImage) setActiveImage(uploadedImage);
                },
                onFinish: () => {
                    setIsUploading(false);
                    setUploadProgress(0);
                },
            },
        );
    };

    return (
        <>
            <Button
                id={id}
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                    setActiveImage(selectedImage);
                    setIsOpen(true);
                }}
            >
                <ImagePlus className="size-4" aria-hidden="true" />
                {selectedImage ? 'Change image' : 'Select image'}
            </Button>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!isUploading) setIsOpen(open);
                }}
            >
                <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-224 min-h-0 w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-lg border border-border bg-background p-0 shadow-2xl sm:h-[min(88dvh,56rem)] sm:w-[94vw] sm:max-w-none 2xl:w-[88vw] 2xl:max-w-368">
                    <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4 pr-14 text-left sm:px-7 sm:py-5 sm:pr-16">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="hidden size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:flex">
                                <ImagePlus
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base sm:text-lg">
                                    Media library
                                </DialogTitle>
                                <DialogDescription className="mt-1 hidden sm:block">
                                    Choose an image or add a new one to your
                                    library.
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden text-xs text-muted-foreground tabular-nums md:inline">
                                {media.data.length} loaded
                            </span>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={uploadImage}
                            />
                            <Button
                                type="button"
                                className="shrink-0 gap-2"
                                disabled={isUploading}
                                onClick={() => inputRef.current?.click()}
                            >
                                <Upload className="size-4" aria-hidden="true" />
                                Upload image
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
                            {filterOptions.map((option) => {
                                const Icon = option.icon;
                                const isActive =
                                    selectedFilter === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() =>
                                            setSelectedFilter(option.value)
                                        }
                                        className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                                        }`}
                                    >
                                        <Icon
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        {option.label}
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {counts[option.value]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full lg:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={searchTerm}
                                maxLength={100}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search files"
                                aria-label="Search media files"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {isUploading && (
                        <div
                            className="space-y-2 border-b border-border px-5 py-3 sm:px-7"
                            role="status"
                        >
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading image</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <progress
                                value={uploadProgress}
                                max="100"
                                className="h-2 w-full accent-emerald-600"
                            />
                        </div>
                    )}

                    {uploadError && (
                        <div className="px-5 pt-3 sm:px-7">
                            <InputError message={uploadError} />
                        </div>
                    )}

                    <div
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7"
                        scroll-region=""
                    >
                        <InfiniteScroll
                            data="media"
                            buffer={400}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                            loading={
                                <div className="col-span-full flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                    <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                                    Loading more images
                                </div>
                            }
                        >
                            {media.data.length === 0 ? (
                                <div className="col-span-full flex min-h-72 flex-col items-center justify-center gap-3 py-12 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <ImagePlus
                                            className="size-6"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">
                                            {search.trim()
                                                ? 'No matching media found'
                                                : selectedFilter === 'all'
                                                  ? 'Your media library is empty'
                                                  : `No ${selectedFilter === 'image' ? 'images' : selectedFilter === 'video' ? 'videos' : 'other files'} found`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {search.trim()
                                                ? `No files match "${search}". Try another search or filter.`
                                                : 'Try another filter or upload a new image.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                media.data.map((asset) => {
                                    const isImage = asset.type === 'image';
                                    const isActive =
                                        isImage && activeImage?.id === asset.id;
                                    const FileIcon =
                                        asset.type === 'video'
                                            ? Film
                                            : FileText;

                                    return (
                                        <button
                                            key={asset.id}
                                            type="button"
                                            disabled={!isImage}
                                            aria-label={
                                                isImage
                                                    ? `Select ${asset.name}`
                                                    : `${asset.type} file ${asset.name} cannot be selected as a category image`
                                            }
                                            aria-pressed={isActive}
                                            onClick={() =>
                                                setActiveImage(asset)
                                            }
                                            className={`group relative overflow-hidden rounded-md border bg-card text-left transition-[border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                                                isActive
                                                    ? 'border-primary ring-2 ring-primary/30'
                                                    : isImage
                                                      ? 'border-border hover:border-foreground/40'
                                                      : 'cursor-not-allowed border-border opacity-75'
                                            }`}
                                        >
                                            <div className="relative aspect-4/3 overflow-hidden bg-muted">
                                                {isImage ? (
                                                    <img
                                                        src={asset.url}
                                                        alt={
                                                            asset.alt ||
                                                            asset.name
                                                        }
                                                        loading="lazy"
                                                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`flex size-full flex-col items-center justify-center gap-2 ${
                                                            asset.type ===
                                                            'video'
                                                                ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                                                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        <FileIcon
                                                            className="size-9 stroke-[1.5]"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="text-[11px] font-semibold uppercase">
                                                            {asset.type ===
                                                            'video'
                                                                ? 'Video'
                                                                : asset.mimeType
                                                                      .split(
                                                                          '/',
                                                                      )
                                                                      .pop() ||
                                                                  'File'}
                                                        </span>
                                                    </div>
                                                )}
                                                {isActive && (
                                                    <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                                        <Check
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="block truncate px-3 py-2.5 text-xs font-medium">
                                                {asset.name}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </InfiniteScroll>
                    </div>

                    <DialogFooter className="border-t border-border bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <p className="min-w-0 truncate text-left text-sm text-muted-foreground">
                            {activeImage
                                ? `Selected: ${activeImage.name}`
                                : 'Choose an image to continue'}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={!activeImage}
                                onClick={() => {
                                    if (activeImage) {
                                        onSelect(activeImage);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                Use selected image
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GalleryImagePicker;

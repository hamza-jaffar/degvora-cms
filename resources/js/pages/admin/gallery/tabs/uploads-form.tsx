import InputError from '@/components/input-error';
import gallery from '@/routes/admin/gallery';
import { router } from '@inertiajs/react';
import { FileText, Film, UploadCloud } from 'lucide-react';
import React, { useRef, useState, type DragEvent } from 'react';

const UploadForm: React.FC<{ onUploadSuccess: () => void }> = ({
    onUploadSuccess,
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isUploadingRef = useRef(false);

    const handleFiles = (fileList: FileList | File[]) => {
        const selectedFiles = Array.from(fileList);

        if (selectedFiles.length === 0 || isUploadingRef.current) return;

        isUploadingRef.current = true;
        setFiles(selectedFiles);
        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        router.post(
            gallery.upload.url(),
            { files: selectedFiles },
            {
                forceFormData: true,
                onProgress: (progress) => {
                    setUploadProgress(progress?.percentage ?? 0);
                },
                onError: (errors) => {
                    const fileError = Object.entries(errors).find(
                        ([key]) => key === 'files' || key.startsWith('files.'),
                    )?.[1];

                    setUploadError(
                        fileError ??
                            'The selected files could not be uploaded.',
                    );
                },
                onSuccess: () => {
                    setFiles([]);
                    onUploadSuccess();
                },
                onFinish: () => {
                    isUploadingRef.current = false;
                    setIsUploading(false);
                    setUploadProgress(0);
                },
            },
        );
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isUploadingRef.current) setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        if (!isUploadingRef.current && event.dataTransfer.files.length > 0) {
            handleFiles(event.dataTransfer.files);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const units = ['Bytes', 'KB', 'MB', 'GB'];
        const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${parseFloat((bytes / 1024 ** unitIndex).toFixed(1))} ${units[unitIndex]}`;
    };

    return (
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                    Upload media
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Files start uploading as soon as you select or drop them.
                </p>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={(event) => {
                    handleFiles(event.currentTarget.files ?? []);
                    event.currentTarget.value = '';
                }}
                multiple
                name="files[]"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,.pdf,.doc,.docx,.mp4,.mov,.webm,.avi,.mkv"
                disabled={isUploading}
                className="hidden"
            />

            <div
                role="button"
                tabIndex={isUploading ? -1 : 0}
                aria-disabled={isUploading}
                onClick={() => {
                    if (!isUploading) fileInputRef.current?.click();
                }}
                onKeyDown={(event) => {
                    if (
                        !isUploading &&
                        (event.key === 'Enter' || event.key === ' ')
                    ) {
                        event.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                    isUploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
                } ${
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/50'
                }`}
            >
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <UploadCloud className="size-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                    {isUploading
                        ? 'Uploading files...'
                        : 'Choose files or drag them here'}
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                    Images and documents up to 10 MB; videos up to 90 MB each.
                </p>
            </div>

            {isUploading && (
                <div className="mt-4 space-y-2" aria-live="polite">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            Uploading {files.length}{' '}
                            {files.length === 1 ? 'file' : 'files'}
                        </span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <progress
                        value={uploadProgress}
                        max="100"
                        className="h-2 w-full accent-emerald-600"
                    />
                </div>
            )}

            <InputError message={uploadError ?? undefined} className="mt-3" />

            {files.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground">
                        Upload batch ({files.length})
                    </h3>
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {files.map((file, index) => {
                            const isImage = file.type.startsWith('image/');
                            const isVideo =
                                file.type.startsWith('video/') ||
                                /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);

                            return (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                                        {isImage ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="size-full object-cover"
                                            />
                                        ) : isVideo ? (
                                            <Film className="size-5 text-sky-700 dark:text-sky-400" />
                                        ) : (
                                            <FileText className="size-5 text-amber-700 dark:text-amber-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="truncate text-sm font-medium text-foreground"
                                            title={file.name}
                                        >
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadForm;

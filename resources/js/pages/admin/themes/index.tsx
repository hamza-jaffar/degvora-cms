import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle, Code2, Trash, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import ConfirmationModal from '@/components/confirmation-modal';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import themes from '@/routes/admin/themes';

interface Theme {
    name: string;
    slug: string;
    version: string | null;
    author: string | null;
    description: string | null;
    is_active: boolean;
    is_valid: boolean;
    is_compatible: boolean;
    error: string | null;
}

interface PageProps {
    themes: Theme[];
}

export default function ThemesIndex({ themes: themeList }: PageProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        theme: File | null;
    }>({
        theme: null,
    });

    const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const submitUpload = (e: React.FormEvent) => {
        e.preventDefault();
        post(themes.upload.url(), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Theme uploaded successfully');
                reset('theme');
                const input = document.getElementById(
                    'theme-upload',
                ) as HTMLInputElement | null;
                if (input) {
                    input.value = '';
                }
            },
            onError: (uploadErrors) =>
                toast.error(
                    Object.values(uploadErrors).find(Boolean) ??
                        'Failed to upload theme',
                ),
        });
    };

    const handleSetActive = (themeName: string) => {
        router.post(
            themes.active.url(),
            { theme: themeName },
            {
                onSuccess: () => toast.success('Theme activated!'),
                onError: (activationErrors) =>
                    toast.error(
                        Object.values(activationErrors).find(Boolean) ??
                            'Failed to activate theme',
                    ),
            },
        );
    };

    const handleConfirmDelete = () => {
        if (!themeToDelete) return;
        setIsDeleting(true);
        router.delete(themes.destroy.url({ theme: themeToDelete }), {
            onSuccess: () => {
                toast.success('Theme deleted!');
                setThemeToDelete(null);
            },
            onError: (deletionErrors) =>
                toast.error(
                    Object.values(deletionErrors).find(Boolean) ??
                        'Failed to delete theme',
                ),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            <Head title="Themes" />

            <div className="flex flex-col gap-6 p-4">
                <Card className="p-6">
                    <h2 className="mb-1 text-lg font-semibold">
                        Upload New Theme
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Upload a .zip file containing your theme folder.
                    </p>
                    <form
                        onSubmit={submitUpload}
                        className="flex max-w-md flex-col gap-4"
                    >
                        <div>
                            <Label htmlFor="theme-upload">Theme Zip File</Label>
                            <Input
                                id="theme-upload"
                                type="file"
                                accept=".zip"
                                onChange={(e) =>
                                    setData(
                                        'theme',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {errors.theme && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.theme}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={processing || !data.theme}
                            className="w-fit"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {processing ? 'Uploading...' : 'Upload Theme'}
                        </Button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {themeList.map((theme) => (
                        <Card
                            key={theme.slug}
                            className={
                                theme.is_active
                                    ? 'border-primary ring-1 ring-primary'
                                    : ''
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {theme.name}
                                    {theme.is_active && (
                                        <span className="flex items-center text-sm text-green-600">
                                            <CheckCircle className="mr-1 h-4 w-4" />{' '}
                                            Active
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {theme.is_valid
                                        ? `${theme.is_active ? 'Currently active' : 'Inactive'} · ${theme.slug}`
                                        : `Invalid theme · ${theme.slug}`}
                                </CardDescription>
                            </CardHeader>
                            <div className="space-y-2 px-6 pb-4 text-sm">
                                <p>
                                    <span className="font-medium">
                                        Version:
                                    </span>{' '}
                                    {theme.version ?? '—'}
                                </p>
                                <p>
                                    <span className="font-medium">Author:</span>{' '}
                                    {theme.author ?? '—'}
                                </p>
                                <p className="text-muted-foreground">
                                    {theme.description ??
                                        'No description available.'}
                                </p>
                                {theme.error && (
                                    <p
                                        className="text-destructive"
                                        role="alert"
                                    >
                                        {theme.error}
                                    </p>
                                )}
                            </div>
                            <CardFooter className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={
                                            theme.is_active
                                                ? 'outline'
                                                : 'default'
                                        }
                                        disabled={
                                            theme.is_active ||
                                            !theme.is_valid ||
                                            !theme.is_compatible
                                        }
                                        onClick={() =>
                                            handleSetActive(theme.slug)
                                        }
                                    >
                                        {theme.is_active
                                            ? 'Current Theme'
                                            : 'Activate'}
                                    </Button>
                                    {theme.is_active && theme.is_valid && (
                                        <Button variant="secondary" asChild>
                                            <Link href={themes.editor.url()}>
                                                <Code2 className="mr-1.5 h-4 w-4" />
                                                Edit Files
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setThemeToDelete(theme.slug)}
                                    aria-label={`Delete ${theme.name}`}
                                    title="Delete theme"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {themeList.length === 0 && (
                        <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            No themes uploaded yet. Upload a .zip file above to
                            get started.
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                open={themeToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setThemeToDelete(null);
                }}
                title="Delete theme?"
                description={
                    <>
                        This will permanently delete{' '}
                        <span className="font-medium text-foreground">
                            {themeToDelete}
                        </span>
                        .{' '}
                        {themeToDelete &&
                            themeList.find(
                                (theme) => theme.slug === themeToDelete,
                            )?.is_active && (
                                <>
                                    This is the active theme; deleting it will
                                    leave no theme active.{' '}
                                </>
                            )}
                        This action cannot be undone.
                    </>
                }
                confirmLabel="Delete theme"
                destructive
                processing={isDeleting}
                processingLabel="Deleting..."
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}

ThemesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Themes',
        },
    ],
};

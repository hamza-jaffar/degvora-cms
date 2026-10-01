import GalleryImagePicker, {
    type GalleryImage,
} from '@/components/gallery-image-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import categoryRoutes from '@/routes/admin/category';
import type { Category } from '@/types/data';
import { Form, Link } from '@inertiajs/react';
import JoditEditor from 'jodit-react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ParentCategory = Pick<Category, 'id' | 'name' | 'slug'>;

export type CategoryFormProps = {
    media: { data: GalleryImage[] };
    counts: Record<'all' | 'image' | 'video' | 'other', number>;
    filter: 'all' | 'image' | 'video' | 'other';
    search: string;
    parentCategories: ParentCategory[];
    filterUrl: string;
    category?: Category;
    pickerAsset?: GalleryImage | null;
    initialImage?: GalleryImage | null;
    initialParentId?: number | null;
    cancelHref?: string;
};

const CategoryForm = ({
    media,
    counts,
    filter,
    search,
    parentCategories,
    filterUrl,
    category,
    pickerAsset,
    initialImage,
    initialParentId,
    cancelHref,
}: CategoryFormProps) => {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(
        pickerAsset ?? initialImage ?? null,
    );
    const [parentId, setParentId] = useState(
        String(category?.parent_id ?? initialParentId ?? 'none'),
    );
    const [isParentOpen, setIsParentOpen] = useState(false);
    const [parentSearch, setParentSearch] = useState('');
    const parentPickerRef = useRef<HTMLDivElement>(null);
    const parentSearchRef = useRef<HTMLInputElement>(null);
    const filteredParents = parentCategories.filter((parent) =>
        `${parent.name} ${parent.slug}`
            .toLowerCase()
            .includes(parentSearch.trim().toLowerCase()),
    );
    const selectedParent = parentCategories.find(
        (parent) => String(parent.id) === parentId,
    );
    const action = category
        ? categoryRoutes.update.form({ query: { id: category.id } })
        : categoryRoutes.store.form();

    useEffect(() => {
        if (!isParentOpen) return;

        parentSearchRef.current?.focus();

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!parentPickerRef.current?.contains(event.target as Node)) {
                setIsParentOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () =>
            document.removeEventListener('mousedown', closeOnOutsideClick);
    }, [isParentOpen]);

    return (
        <Form {...action}>
            {({ errors, processing }) => (
                <div className="space-y-8">
                    <section className="space-y-5">
                        <div>
                            <h3 className="text-base font-semibold">
                                Basic Information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Add the basic details for this category.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Enter category name"
                                    defaultValue={category?.name ?? ''}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="category-name"
                                    defaultValue={category?.slug ?? ''}
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used in the category URL. This will be
                                    automatically generated.
                                </p>
                                <InputError message={errors.slug} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parent_id">Parent Category</Label>
                            <div
                                ref={parentPickerRef}
                                className="relative w-full sm:max-w-xl"
                            >
                                <Button
                                    id="parent_id"
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isParentOpen}
                                    aria-controls="parent-category-options"
                                    className="w-full justify-between font-normal"
                                    onClick={() => {
                                        setParentSearch('');
                                        setIsParentOpen((open) => !open);
                                    }}
                                >
                                    <span className="truncate">
                                        {selectedParent?.name ??
                                            'No Parent Category'}
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                                </Button>
                                {isParentOpen && (
                                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                ref={parentSearchRef}
                                                value={parentSearch}
                                                onChange={(event) =>
                                                    setParentSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.key === 'Escape'
                                                    ) {
                                                        setIsParentOpen(false);
                                                    }

                                                    if (
                                                        event.key === 'Enter' &&
                                                        filteredParents[0]
                                                    ) {
                                                        event.preventDefault();
                                                        setParentId(
                                                            String(
                                                                filteredParents[0]
                                                                    .id,
                                                            ),
                                                        );
                                                        setIsParentOpen(false);
                                                    }

                                                    if (
                                                        event.key ===
                                                            'ArrowDown' &&
                                                        filteredParents.length >
                                                            0
                                                    ) {
                                                        event.preventDefault();
                                                        parentPickerRef.current
                                                            ?.querySelector<HTMLButtonElement>(
                                                                '[role="option"]',
                                                            )
                                                            ?.focus();
                                                    }
                                                }}
                                                placeholder="Search parent categories..."
                                                aria-label="Search parent categories"
                                                className="pl-8"
                                            />
                                        </div>
                                        <div
                                            id="parent-category-options"
                                            role="listbox"
                                            aria-label="Parent categories"
                                            className="mt-2 max-h-60 overflow-y-auto"
                                        >
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={
                                                    parentId === 'none'
                                                }
                                                className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                                                onClick={() => {
                                                    setParentId('none');
                                                    setIsParentOpen(false);
                                                }}
                                            >
                                                No Parent Category
                                                {parentId === 'none' && (
                                                    <Check className="size-4" />
                                                )}
                                            </button>
                                            {filteredParents.map((parent) => (
                                                <button
                                                    key={parent.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={
                                                        String(parent.id) ===
                                                        parentId
                                                    }
                                                    className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                                                    onClick={() => {
                                                        setParentId(
                                                            String(parent.id),
                                                        );
                                                        setIsParentOpen(false);
                                                    }}
                                                >
                                                    {parent.name}
                                                    {String(parent.id) ===
                                                        parentId && (
                                                        <Check className="size-4" />
                                                    )}
                                                </button>
                                            ))}
                                            {filteredParents.length === 0 && (
                                                <p className="px-2 py-3 text-sm text-muted-foreground">
                                                    No parent categories found.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                name="parent_id"
                                value={parentId === 'none' ? '' : parentId}
                            />
                            <p className="text-xs text-muted-foreground">
                                Select a parent to create this as a subcategory.
                            </p>
                            <InputError message={errors.parent_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <JoditEditor
                                id="description"
                                name="description"
                                value={category?.description ?? ''}
                            />
                            <p className="text-xs text-muted-foreground">
                                A brief description that explains what this
                                category contains.
                            </p>
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category-image-picker">
                                Category Image
                            </Label>
                            <input
                                type="hidden"
                                name="image"
                                value={
                                    selectedImage?.path ?? category?.image ?? ''
                                }
                            />
                            {selectedImage && (
                                <div className="flex items-center gap-4 rounded-lg border p-3">
                                    <img
                                        src={selectedImage.url}
                                        alt={
                                            selectedImage.alt ||
                                            selectedImage.name
                                        }
                                        className="size-20 rounded-md object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {selectedImage.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Selected from media library
                                        </p>
                                    </div>
                                </div>
                            )}
                            <GalleryImagePicker
                                id="category-image-picker"
                                media={media}
                                counts={counts}
                                filter={filter}
                                search={search}
                                filterUrl={filterUrl}
                                selectedImage={selectedImage}
                                onSelect={setSelectedImage}
                            />
                            <InputError message={errors.image} />
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div>
                            <h3 className="text-base font-semibold">
                                Organization
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Control how this category is displayed and
                                organized.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label htmlFor="is_featured">
                                        Featured Category
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Mark this category as featured for
                                        highlighted placement.
                                    </p>
                                    <InputError message={errors.is_featured} />
                                </div>
                                <Switch
                                    className="cursor-pointer"
                                    id="is_featured"
                                    name="is_featured"
                                    value="1"
                                    defaultChecked={
                                        category?.is_featured ?? false
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label htmlFor="is_active">Active</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Make this category visible on your
                                        website.
                                    </p>
                                    <InputError message={errors.is_active} />
                                </div>
                                <Switch
                                    className="cursor-pointer"
                                    id="is_active"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={category?.is_active ?? true}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5 rounded-lg border p-4">
                        <div>
                            <h3 className="text-base font-semibold">
                                SEO Settings
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Optimize this category for search engines.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_title">Meta Title</Label>
                            <Input
                                id="meta_title"
                                name="meta_title"
                                placeholder="Enter SEO title"
                                defaultValue={category?.meta_title ?? ''}
                                maxLength={60}
                            />
                            <p className="text-xs text-muted-foreground">
                                The title shown in search engine results. Keep
                                it concise and relevant.
                            </p>
                            <InputError message={errors.meta_title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_description">
                                Meta Description
                            </Label>
                            <JoditEditor
                                id="meta_description"
                                name="meta_description"
                                value={category?.meta_description ?? ''}
                            />
                            <p className="text-xs text-muted-foreground">
                                A short summary that may appear below your page
                                title in search results.
                            </p>
                            <InputError message={errors.meta_description} />
                        </div>
                    </section>

                    <div className="flex justify-end gap-3">
                        {cancelHref && (
                            <Button asChild variant="outline" type="button">
                                <Link href={cancelHref}>Cancel</Link>
                            </Button>
                        )}
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Spinner />
                                    {category ? 'Saving...' : 'Creating...'}
                                </>
                            ) : category ? (
                                'Save changes'
                            ) : (
                                'Create'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
};

export default CategoryForm;

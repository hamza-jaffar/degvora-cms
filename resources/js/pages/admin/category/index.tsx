import { DataTable, type DataTableColumn } from '@/components/data-table';
import ConfirmationModal from '@/components/confirmation-modal';
import { FilterCard } from '@/components/filter-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import category from '@/routes/admin/category';
import type { Category } from '@/types/data';
import { CategoryIndexPageProps } from '@/types/props';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Star,
    Trash2,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const pageSizes = [10, 25, 50, 100];

const CategoryIndex = ({
    categories,
    filters,
    parent_categories,
}: CategoryIndexPageProps) => {
    const [search, setSearch] = useState(filters.search);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
        null,
    );
    const [parentSearch, setParentSearch] = useState('');
    const visibleParents = parent_categories.filter((parent) =>
        `${parent.name} ${parent.slug}`
            .toLowerCase()
            .includes(parentSearch.trim().toLowerCase()),
    );

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                category.index.url(),
                { ...filters, search, page: 1 },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, filters]);

    const applyFilters = (nextFilters: typeof filters) => {
        router.get(
            category.index.url(),
            { ...nextFilters, search, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns: DataTableColumn<Category>[] = [
        {
            key: 'category',
            header: 'Category',
            render: (row) => (
                <Link
                    href={category.index({
                        query: {
                            ...filters,
                            parent_category_slug: row.slug,
                            page: 1,
                        },
                    })}
                    className="flex min-w-0 items-center gap-3 text-left"
                    aria-label={`View subcategories of ${row.name}`}
                >
                    {row.image_url ? (
                        <img
                            src={row.image_url}
                            alt=""
                            loading="lazy"
                            className="size-10 shrink-0 rounded-md border object-cover"
                        />
                    ) : (
                        <div className="size-10 shrink-0 rounded-md border bg-muted" />
                    )}
                    <div className="min-w-0">
                        <p className="truncate font-medium text-foreground hover:underline">
                            {row.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                            {row.slug}
                        </p>
                    </div>
                </Link>
            ),
        },
        {
            key: 'parent',
            header: 'Parent category',
            render: (row) => (
                <span className="text-muted-foreground">
                    {row.parent?.name ?? 'Top-level'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <Badge
                    variant="outline"
                    className={
                        row.is_active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                    }
                >
                    <span
                        className={`size-1.5 rounded-full ${row.is_active ? 'bg-emerald-600' : 'bg-zinc-400'}`}
                    />
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'featured',
            header: 'Featured',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    {row.is_featured ? (
                        <>
                            <Star className="size-3.5 fill-amber-400 text-amber-500" />
                            Yes
                        </>
                    ) : (
                        'No'
                    )}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'w-28 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8"
                    >
                        <Link
                            href={category.edit(row.slug)}
                            aria-label={`Edit ${row.name}`}
                            title="Edit category"
                        >
                            <Pencil />
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${row.name}`}
                        title="Delete category"
                        onClick={() => setCategoryToDelete(row)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-5 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Heading
                    title="Category Management"
                    description="Create, edit, organize, and manage your product categories and subcategories."
                />
                <Link
                    href={category.create({
                        query: filters.parent_category_slug
                            ? {
                                  parent_category_slug:
                                      filters.parent_category_slug,
                              }
                            : {},
                    })}
                    className="shrink-0"
                >
                    <Button>
                        <Plus /> Create category
                    </Button>
                </Link>
            </div>

            <FilterCard>
                <FilterCard.Left className="min-w-0">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search categories"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.parent_category_slug || 'top-level'}
                        onValueChange={(value) => {
                            setParentSearch('');
                            applyFilters({
                                ...filters,
                                parent_category_slug:
                                    value === 'top-level' ? '' : value,
                            });
                        }}
                    >
                        <SelectTrigger
                            aria-label="Filter by parent category"
                            className="w-full bg-background sm:w-52"
                        >
                            <SelectValue placeholder="Parent category" />
                        </SelectTrigger>
                        <SelectContent>
                            <div
                                className="border-b p-2"
                                onKeyDown={(event) => {
                                    if (event.key !== 'Escape') {
                                        event.stopPropagation();
                                    }
                                }}
                                onPointerDown={(event) =>
                                    event.stopPropagation()
                                }
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        autoFocus
                                        value={parentSearch}
                                        onChange={(event) =>
                                            setParentSearch(event.target.value)
                                        }
                                        placeholder="Search categories..."
                                        aria-label="Search parent categories"
                                        className="h-8 pl-8"
                                    />
                                </div>
                            </div>
                            <SelectItem value="top-level">
                                Top-level categories
                            </SelectItem>
                            {visibleParents.map((parent) => (
                                <SelectItem key={parent.id} value={parent.slug}>
                                    {parent.name}
                                </SelectItem>
                            ))}
                            {visibleParents.length === 0 && (
                                <div className="px-2 py-3 text-sm text-muted-foreground">
                                    No categories found.
                                </div>
                            )}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                ...filters,
                                status: value === 'all' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by status"
                            className="w-full bg-background sm:w-40"
                        >
                            <SlidersHorizontal className="size-4 text-muted-foreground" />
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </FilterCard.Left>

                <FilterCard.Right className="shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            router.get(
                                category.index.url(),
                                {},
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                },
                            );
                        }}
                    >
                        Reset filters
                    </Button>
                </FilterCard.Right>
            </FilterCard>

            <DataTable
                rows={categories.data}
                columns={columns}
                pagination={categories}
                pageSizes={pageSizes}
                onPageSizeChange={(perPage) =>
                    applyFilters({ ...filters, per_page: perPage })
                }
                emptyMessage="No categories match these filters."
            />

            <ConfirmationModal
                open={categoryToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCategoryToDelete(null);
                    }
                }}
                title="Delete category?"
                description={
                    <>
                        This will permanently delete{' '}
                        <span className="font-medium text-foreground">
                            {categoryToDelete?.name}
                        </span>
                        .
                    </>
                }
                confirmLabel="Delete category"
                destructive
                onConfirm={() => {
                    if (!categoryToDelete) {
                        return;
                    }

                    router.delete(
                        category.delete.url({
                            query: { id: categoryToDelete.id },
                        }),
                        {
                            preserveScroll: true,
                            onSuccess: () => setCategoryToDelete(null),
                        },
                    );
                }}
            />
        </div>
    );
};

export default CategoryIndex;

CategoryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Categories',
        },
    ],
};

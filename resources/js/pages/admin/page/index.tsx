import ConfirmationModal from '@/components/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { FilterCard } from '@/components/filter-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import pages from '@/routes/admin/page';
import type { Page } from '@/types/data';
import type { PageFilters, PageIndexPageProps } from '@/types/props';
import { Link, router } from '@inertiajs/react';
import {
    FilePlus2,
    Pencil,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const pageSizes = [10, 25, 50, 100];

const PageIndex = ({ pages: pageList, filters }: PageIndexPageProps) => {
    const [search, setSearch] = useState(filters.search);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [pageToRestore, setPageToRestore] = useState<Page | null>(null);
    const [pageToForceDelete, setPageToForceDelete] = useState<Page | null>(null);

    useEffect(() => setSearch(filters.search), [filters.search]);

    useEffect(() => {
        if (search === filters.search) {
            return;
        }
        const timeout = window.setTimeout(
            () => applyFilters({ search }),
            350,
        );
        return () => window.clearTimeout(timeout);
    }, [search, filters]);

    const applyFilters = (changes: Partial<PageFilters>) => {
        router.get(
            pages.index.url(),
            { ...filters, ...changes, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns: DataTableColumn<Page>[] = [
        {
            key: 'page',
            header: 'Page',
            render: (row) => (
                <Link
                    href={pages.edit(row.slug).url}
                    className="flex min-w-0 items-center gap-3 text-left"
                >
                    {row.featured_media_asset ? (
                        <img
                            src={row.featured_media_asset.url}
                            alt=""
                            loading="lazy"
                            className="size-10 shrink-0 rounded-md border object-cover"
                        />
                    ) : (
                        <div className="size-10 shrink-0 rounded-md border bg-muted flex items-center justify-center text-muted-foreground">
                            <FilePlus2 className="size-4 opacity-50" />
                        </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground hover:underline">
                            {row.name}
                        </span>
                        <span className="mt-0.5 truncate text-xs text-muted-foreground">
                            {row.path}
                        </span>
                    </div>
                </Link>
            ),
        },
        {
            key: 'parent',
            header: 'Parent',
            render: (row) => (
                <span className="text-muted-foreground">
                    {row.parent?.name ?? '—'}
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
                        row.deleted_at
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : row.status === 'published'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : row.status === 'archived'
                                ? 'border-zinc-200 bg-zinc-100 text-zinc-600'
                                : row.status === 'scheduled'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                    }
                >
                    {row.deleted_at ? 'deleted' : row.status}
                </Badge>
            ),
        },
        {
            key: 'template',
            header: 'Template',
            render: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {row.template}
                </span>
            ),
        },
        {
            key: 'visibility',
            header: 'Visibility',
            render: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {row.visibility}
                </span>
            ),
        },
        {
            key: 'published_at',
            header: 'Published',
            render: (row) => (
                <span className="text-xs text-muted-foreground">
                    {row.published_at
                        ? new Date(row.published_at).toLocaleDateString()
                        : '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'w-28 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    {row.deleted_at ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-emerald-600 hover:text-emerald-700"
                                aria-label={`Restore ${row.name}`}
                                title="Restore page"
                                onClick={() => setPageToRestore(row)}
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Permanently delete ${row.name}`}
                                title="Permanently delete page"
                                onClick={() => setPageToForceDelete(row)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" size="icon" className="size-8">
                                <Link
                                    href={pages.edit(row.slug).url}
                                    aria-label={`Edit ${row.name}`}
                                    title="Edit page"
                                >
                                    <Pencil className="size-4" />
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.name}`}
                                title="Delete page"
                                onClick={() => setPageToDelete(row)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-5 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Heading
                    title="Page Management"
                    description="Create, edit, and manage your site pages and their content."
                />
                <Link href={pages.create()} className="shrink-0">
                    <Button>
                        <FilePlus2 /> Add page
                    </Button>
                </Link>
            </div>

            <FilterCard>
                <FilterCard.Left className="min-w-0">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search pages"
                            placeholder="Name, slug, excerpt..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                status: value === 'all' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by status"
                            className="w-full bg-background sm:w-44"
                        >
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.trashed || 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                trashed: value === 'all' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by deleted status"
                            className="w-full bg-background sm:w-44"
                        >
                            <SelectValue placeholder="Active pages" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Active pages</SelectItem>
                            <SelectItem value="with">Include deleted</SelectItem>
                            <SelectItem value="only">Only deleted</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={`${filters.sort}:${filters.direction}`}
                        onValueChange={(value) => {
                            const [sort, direction] = value.split(':');
                            applyFilters({ sort, direction });
                        }}
                    >
                        <SelectTrigger
                            aria-label="Sort pages"
                            className="w-full bg-background sm:w-52"
                        >
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at:desc">
                                Recently created
                            </SelectItem>
                            <SelectItem value="name:asc">Name A–Z</SelectItem>
                            <SelectItem value="name:desc">Name Z–A</SelectItem>
                            <SelectItem value="published_at:desc">
                                Recently published
                            </SelectItem>
                            <SelectItem value="sort_order:asc">
                                Sort order (low–high)
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            router.get(
                                pages.index.url(),
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
                </FilterCard.Left>
            </FilterCard>

            <DataTable
                rows={pageList.data}
                columns={columns}
                pagination={pageList}
                pageSizes={pageSizes}
                onPageSizeChange={(perPage) => applyFilters({ per_page: perPage })}
                emptyMessage="No pages match these filters."
            />

            <ConfirmationModal
                open={pageToDelete !== null}
                onOpenChange={(open) => !open && setPageToDelete(null)}
                title="Delete page?"
                description={
                    <>
                        This will move{' '}
                        <span className="font-medium text-foreground">
                            {pageToDelete?.name}
                        </span>{' '}
                        to the deleted pages list.
                    </>
                }
                confirmLabel="Delete page"
                destructive
                onConfirm={() => {
                    if (!pageToDelete) {
                        return;
                    }
                    router.delete(pages.destroy(pageToDelete.slug).url, {
                        preserveScroll: true,
                        onSuccess: () => setPageToDelete(null),
                    });
                }}
            />

            <ConfirmationModal
                open={pageToRestore !== null}
                onOpenChange={(open) => !open && setPageToRestore(null)}
                title="Restore page?"
                description={
                    <>
                        This will restore{' '}
                        <span className="font-medium text-foreground">
                            {pageToRestore?.name}
                        </span>{' '}
                        back to your active pages.
                    </>
                }
                confirmLabel="Restore page"
                onConfirm={() => {
                    if (!pageToRestore) {
                        return;
                    }
                    router.post(
                        pages.restore(pageToRestore.id).url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => setPageToRestore(null),
                        },
                    );
                }}
            />

            <ConfirmationModal
                open={pageToForceDelete !== null}
                onOpenChange={(open) => !open && setPageToForceDelete(null)}
                title="Permanently delete page?"
                description={
                    <>
                        This action cannot be undone. This will permanently
                        delete{' '}
                        <span className="font-medium text-foreground">
                            {pageToForceDelete?.name}
                        </span>{' '}
                        and remove all associated data.
                    </>
                }
                confirmLabel="Permanently delete"
                destructive
                onConfirm={() => {
                    if (!pageToForceDelete) {
                        return;
                    }
                    router.delete(
                        pages.forceDelete(pageToForceDelete.id).url,
                        {
                            preserveScroll: true,
                            onSuccess: () => setPageToForceDelete(null),
                        },
                    );
                }}
            />
        </div>
    );
};

export default PageIndex;

PageIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages' },
    ],
};

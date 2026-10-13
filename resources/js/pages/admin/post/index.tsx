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
import posts from '@/routes/admin/posts';
import type { Post } from '@/types/data';
import type { PostFilters, PostIndexPageProps } from '@/types/props';
import { Link, router } from '@inertiajs/react';
import {
    Newspaper,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const pageSizes = [10, 25, 50, 100];

const PostIndex = ({ posts: postList, filters, categories }: PostIndexPageProps) => {
    const [search, setSearch] = useState(filters.search);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [postToRestore, setPostToRestore] = useState<Post | null>(null);
    const [postToForceDelete, setPostToForceDelete] = useState<Post | null>(null);

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

    const applyFilters = (changes: Partial<PostFilters>) => {
        router.get(
            posts.index.url(),
            { ...filters, ...changes, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns: DataTableColumn<Post>[] = [
        {
            key: 'post',
            header: 'Post',
            render: (row) => (
                <Link
                    href={posts.edit(row.slug).url}
                    className="flex min-w-0 items-center gap-3 text-left"
                >
                    {row.featured_media_asset ? (
                        <img
                            src={row.featured_media_asset.url}
                            alt=""
                            loading="lazy"
                            className="size-11 shrink-0 rounded-md border object-cover"
                        />
                    ) : (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <Newspaper className="size-5 opacity-50" />
                        </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-foreground hover:underline">
                                {row.title}
                            </span>
                            {row.is_featured && (
                                <span title="Featured post" className="text-amber-500">
                                    <Star className="size-3.5 fill-amber-500" />
                                </span>
                            )}
                        </div>
                        <span className="mt-0.5 truncate text-xs text-muted-foreground">
                            /{row.slug}
                        </span>
                    </div>
                </Link>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            render: (row) => (
                <span className="text-xs text-muted-foreground">
                    {row.category?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'author',
            header: 'Author',
            render: (row) => (
                <span className="text-xs text-muted-foreground">
                    {row.author?.name ?? '—'}
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
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
                            : row.status === 'published'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : row.status === 'archived'
                                ? 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                                : row.status === 'scheduled'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                    }
                >
                    {row.deleted_at ? 'deleted' : row.status}
                </Badge>
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
                                aria-label={`Restore ${row.title}`}
                                title="Restore post"
                                onClick={() => setPostToRestore(row)}
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Permanently delete ${row.title}`}
                                title="Permanently delete post"
                                onClick={() => setPostToForceDelete(row)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" size="icon" className="size-8">
                                <Link
                                    href={posts.edit(row.slug).url}
                                    aria-label={`Edit ${row.title}`}
                                    title="Edit post"
                                >
                                    <Pencil className="size-4" />
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.title}`}
                                title="Delete post"
                                onClick={() => setPostToDelete(row)}
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
                    title="Blog Posts"
                    description="Write, publish, and manage your blog articles and SEO settings."
                />
                <Link href={posts.create()} className="shrink-0">
                    <Button>
                        <Plus className="mr-1.5 size-4" /> Add post
                    </Button>
                </Link>
            </div>

            <FilterCard>
                <FilterCard.Left className="min-w-0 flex-wrap">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search posts"
                            placeholder="Title, slug, excerpt..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.category_id || 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                category_id: value === 'all' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by category"
                            className="w-full bg-background sm:w-44"
                        >
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

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
                            className="w-full bg-background sm:w-40"
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
                        value={filters.is_featured || 'all'}
                        onValueChange={(value) =>
                            applyFilters({
                                is_featured: value === 'all' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by featured status"
                            className="w-full bg-background sm:w-36"
                        >
                            <SelectValue placeholder="Featured" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All posts</SelectItem>
                            <SelectItem value="1">Featured only</SelectItem>
                            <SelectItem value="0">Standard only</SelectItem>
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
                            className="w-full bg-background sm:w-40"
                        >
                            <SelectValue placeholder="Active posts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Active posts</SelectItem>
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
                            aria-label="Sort posts"
                            className="w-full bg-background sm:w-48"
                        >
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at:desc">
                                Recently created
                            </SelectItem>
                            <SelectItem value="title:asc">Title A–Z</SelectItem>
                            <SelectItem value="title:desc">Title Z–A</SelectItem>
                            <SelectItem value="published_at:desc">
                                Recently published
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            router.get(
                                posts.index.url(),
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
                rows={postList.data}
                columns={columns}
                pagination={postList}
                pageSizes={pageSizes}
                onPageSizeChange={(perPage) => applyFilters({ per_page: perPage })}
                emptyMessage="No posts match these filters."
            />

            <ConfirmationModal
                open={postToDelete !== null}
                onOpenChange={(open) => !open && setPostToDelete(null)}
                title="Delete post?"
                description={
                    <>
                        This will move{' '}
                        <span className="font-medium text-foreground">
                            {postToDelete?.title}
                        </span>{' '}
                        to the deleted posts list.
                    </>
                }
                confirmLabel="Delete post"
                destructive
                onConfirm={() => {
                    if (!postToDelete) {
                        return;
                    }
                    router.delete(posts.destroy(postToDelete.slug).url, {
                        preserveScroll: true,
                        onSuccess: () => setPostToDelete(null),
                    });
                }}
            />

            <ConfirmationModal
                open={postToRestore !== null}
                onOpenChange={(open) => !open && setPostToRestore(null)}
                title="Restore post?"
                description={
                    <>
                        This will restore{' '}
                        <span className="font-medium text-foreground">
                            {postToRestore?.title}
                        </span>{' '}
                        back to your active posts.
                    </>
                }
                confirmLabel="Restore post"
                onConfirm={() => {
                    if (!postToRestore) {
                        return;
                    }
                    router.post(
                        posts.restore(postToRestore.id).url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => setPostToRestore(null),
                        },
                    );
                }}
            />

            <ConfirmationModal
                open={postToForceDelete !== null}
                onOpenChange={(open) => !open && setPostToForceDelete(null)}
                title="Permanently delete post?"
                description={
                    <>
                        This action cannot be undone. This will permanently
                        delete{' '}
                        <span className="font-medium text-foreground">
                            {postToForceDelete?.title}
                        </span>{' '}
                        and remove all associated data.
                    </>
                }
                confirmLabel="Permanently delete"
                destructive
                onConfirm={() => {
                    if (!postToForceDelete) {
                        return;
                    }
                    router.delete(
                        posts.forceDelete(postToForceDelete.id).url,
                        {
                            preserveScroll: true,
                            onSuccess: () => setPostToForceDelete(null),
                        },
                    );
                }}
            />
        </div>
    );
};

export default PostIndex;

PostIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Blog' },
    ],
};

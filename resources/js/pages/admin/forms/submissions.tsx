import ConfirmationModal from '@/components/confirmation-modal';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { FilterCard } from '@/components/filter-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import settingRoutes from '@/routes/admin/setting';
import type { FormSubmission } from '@/types/data';
import type {
    FormSubmissionFilters,
    FormSubmissionsPageProps,
} from '@/types/props';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    CheckCircle2,
    Copy,
    Download,
    Eye,
    Inbox,
    Mail,
    Search,
    Settings,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const pageSizes = [10, 25, 50, 100];

const FormSubmissionsPage = ({
    form,
    submissions,
    filters,
    stats,
}: FormSubmissionsPageProps) => {
    const [search, setSearch] = useState(filters.search);
    const [selectedSubmission, setSelectedSubmission] =
        useState<FormSubmission | null>(null);
    const [submissionToDelete, setSubmissionToDelete] =
        useState<FormSubmission | null>(null);

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

    const applyFilters = (changes: Partial<FormSubmissionFilters>) => {
        router.get(
            `/admin/forms/${form.slug}`,
            { ...filters, ...changes, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const updateStatus = (
        submission: FormSubmission,
        status: 'unread' | 'read' | 'archived' | 'spam',
    ) => {
        router.patch(
            `/admin/forms/${form.slug}/submissions/${submission.id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedSubmission?.id === submission.id) {
                        setSelectedSubmission({
                            ...selectedSubmission,
                            status,
                        });
                    }
                },
            },
        );
    };

    const toggleStar = (submission: FormSubmission) => {
        router.post(
            `/admin/forms/${form.slug}/submissions/${submission.id}/star`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedSubmission?.id === submission.id) {
                        setSelectedSubmission({
                            ...selectedSubmission,
                            is_starred: !selectedSubmission.is_starred,
                        });
                    }
                },
            },
        );
    };

    const copyEndpoint = () => {
        const url = `${window.location.origin}/forms/${form.slug}/submit`;
        navigator.clipboard.writeText(url);
        toast.success('Public submission URL copied to clipboard');
    };

    // Determine 3-4 primary fields to show as table columns
    const displayFields = (form.fields || []).slice(0, 4);

    const columns: DataTableColumn<FormSubmission>[] = [
        {
            key: 'starred',
            header: '',
            className: 'w-10 text-center',
            render: (row) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(row);
                    }}
                    className={`transition-colors ${
                        row.is_starred
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-muted-foreground/40 hover:text-muted-foreground'
                    }`}
                    title={row.is_starred ? 'Unstar' : 'Star'}
                >
                    <Star
                        className={`size-4 ${
                            row.is_starred ? 'fill-amber-500' : ''
                        }`}
                    />
                </button>
            ),
        },
        ...displayFields.map((field) => ({
            key: `field_${field.name}`,
            header: field.label,
            render: (row: FormSubmission) => {
                const val = row.data?.[field.name];
                if (val === undefined || val === null || val === '') {
                    return <span className="text-muted-foreground">—</span>;
                }
                const text = Array.isArray(val) ? val.join(', ') : String(val);
                return (
                    <span
                        className={`truncate block max-w-xs ${
                            row.status === 'unread' ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        }`}
                        title={text}
                    >
                        {text}
                    </span>
                );
            },
        })),
        {
            key: 'status',
            header: 'Status',
            className: 'w-24',
            render: (row) => (
                <Badge
                    variant="outline"
                    className={
                        row.status === 'unread'
                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
                            : row.status === 'read'
                              ? 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                              : row.status === 'archived'
                                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
                    }
                >
                    {row.status}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Date',
            className: 'w-36 text-xs text-muted-foreground',
            render: (row) => (
                <span title={new Date(row.created_at).toLocaleString()}>
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'w-24 text-right',
            render: (row) => (
                <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-foreground"
                        title="View Submission"
                        onClick={() => {
                            setSelectedSubmission(row);
                            if (row.status === 'unread') {
                                updateStatus(row, 'read');
                            }
                        }}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => setSubmissionToDelete(row)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-5 md:p-8">
            <Head title={`${form.name} Submissions`} />

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Heading
                            title={`${form.name}`}
                            description={
                                form.description ||
                                `Manage incoming form submissions, review entries, and export responses.`
                            }
                        />
                        <Badge
                            variant="outline"
                            className={
                                form.is_active
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                            }
                        >
                            {form.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyEndpoint}
                        title="Copy Public POST URL"
                    >
                        <Copy className="mr-1.5 size-3.5" />
                        Copy API URL
                    </Button>
                    <a
                        href={`/admin/forms/${form.slug}/export`}
                        download
                        className="inline-flex"
                    >
                        <Button type="button" variant="outline" size="sm">
                            <Download className="mr-1.5 size-3.5" />
                            Export CSV
                        </Button>
                    </a>
                    <Link
                        href={`${settingRoutes.index()}?active_tab=forms`}
                    >
                        <Button variant="secondary" size="sm">
                            <Settings className="mr-1.5 size-3.5" />
                            Form Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
                <Card
                    className="cursor-pointer border-muted/80 transition-colors hover:border-primary/50"
                    onClick={() => applyFilters({ status: '' })}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                Total Entries
                            </span>
                            <Inbox className="size-4 text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {stats.total}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-colors ${
                        filters.status === 'unread'
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                            : 'hover:border-blue-400'
                    }`}
                    onClick={() =>
                        applyFilters({
                            status: filters.status === 'unread' ? '' : 'unread',
                        })
                    }
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-600 uppercase dark:text-blue-400">
                                Unread
                            </span>
                            <Mail className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {stats.unread}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-colors ${
                        filters.status === 'read'
                            ? 'border-zinc-500 bg-muted/40'
                            : 'hover:border-zinc-400'
                    }`}
                    onClick={() =>
                        applyFilters({
                            status: filters.status === 'read' ? '' : 'read',
                        })
                    }
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                Read
                            </span>
                            <CheckCircle2 className="size-4 text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {stats.read}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-colors ${
                        filters.status === 'archived'
                            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                            : 'hover:border-amber-400'
                    }`}
                    onClick={() =>
                        applyFilters({
                            status:
                                filters.status === 'archived' ? '' : 'archived',
                        })
                    }
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-amber-600 uppercase dark:text-amber-400">
                                Archived
                            </span>
                            <Archive className="size-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
                            {stats.archived}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Card */}
            <FilterCard>
                <FilterCard.Left className="min-w-0 flex-wrap">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search submissions"
                            placeholder="Search in answers, IP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(val) =>
                            applyFilters({
                                status: val === 'all' ? '' : val,
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
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={`${filters.sort}:${filters.direction}`}
                        onValueChange={(val) => {
                            const [sort, direction] = val.split(':');
                            applyFilters({ sort, direction });
                        }}
                    >
                        <SelectTrigger
                            aria-label="Sort order"
                            className="w-full bg-background sm:w-48"
                        >
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at:desc">
                                Newest first
                            </SelectItem>
                            <SelectItem value="created_at:asc">
                                Oldest first
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            router.get(
                                `/admin/forms/${form.slug}`,
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

            {/* Submissions Table */}
            <DataTable
                rows={submissions.data}
                columns={columns}
                pagination={submissions}
                pageSizes={pageSizes}
                onPageSizeChange={(perPage) =>
                    applyFilters({ per_page: perPage })
                }
                emptyMessage="No submissions found for this form yet."
            />

            {/* Submission Detail Modal */}
            <Dialog
                open={selectedSubmission !== null}
                onOpenChange={(open) => !open && setSelectedSubmission(null)}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <DialogTitle className="text-lg font-bold">
                                Submission #{selectedSubmission?.id}
                            </DialogTitle>
                            {selectedSubmission && (
                                <Badge
                                    variant="outline"
                                    className="capitalize"
                                >
                                    {selectedSubmission.status}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription>
                            Received on{' '}
                            {selectedSubmission &&
                                new Date(
                                    selectedSubmission.created_at,
                                ).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-6 py-2">
                            {/* Submitted Fields */}
                            <div className="rounded-lg border divide-y bg-card">
                                {(form.fields || []).map((field) => {
                                    const val =
                                        selectedSubmission.data?.[field.name];
                                    const formattedVal =
                                        val === undefined ||
                                        val === null ||
                                        val === ''
                                            ? '—'
                                            : Array.isArray(val)
                                              ? val.join(', ')
                                              : String(val);

                                    return (
                                        <div
                                            key={field.id}
                                            className="grid grid-cols-3 gap-4 p-3.5 text-sm"
                                        >
                                            <span className="font-medium text-muted-foreground">
                                                {field.label}
                                            </span>
                                            <span className="col-span-2 text-foreground font-normal break-words whitespace-pre-wrap">
                                                {formattedVal}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Technical Metadata */}
                            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                                <div>
                                    <span className="font-semibold text-foreground/80">
                                        IP Address:{' '}
                                    </span>
                                    {selectedSubmission.ip_address || 'Unknown'}
                                </div>
                                <div className="truncate" title={selectedSubmission.user_agent || ''}>
                                    <span className="font-semibold text-foreground/80">
                                        User Agent:{' '}
                                    </span>
                                    {selectedSubmission.user_agent || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-1.5">
                            {selectedSubmission?.status !== 'read' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        selectedSubmission &&
                                        updateStatus(selectedSubmission, 'read')
                                    }
                                >
                                    Mark as read
                                </Button>
                            )}
                            {selectedSubmission?.status !== 'unread' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        selectedSubmission &&
                                        updateStatus(
                                            selectedSubmission,
                                            'unread',
                                        )
                                    }
                                >
                                    Mark as unread
                                </Button>
                            )}
                            {selectedSubmission?.status !== 'archived' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        selectedSubmission &&
                                        updateStatus(
                                            selectedSubmission,
                                            'archived',
                                        )
                                    }
                                >
                                    Archive
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    const sub = selectedSubmission;
                                    setSelectedSubmission(null);
                                    if (sub) {
                                        setSubmissionToDelete(sub);
                                    }
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                open={submissionToDelete !== null}
                onOpenChange={(open) => !open && setSubmissionToDelete(null)}
                title="Delete submission?"
                description="This will permanently delete this submission record."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    if (!submissionToDelete) {
                        return;
                    }
                    router.delete(
                        `/admin/forms/${form.slug}/submissions/${submissionToDelete.id}`,
                        {
                            preserveScroll: true,
                            onSuccess: () => setSubmissionToDelete(null),
                        },
                    );
                }}
            />
        </div>
    );
};

export default FormSubmissionsPage;

FormSubmissionsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Forms', href: `${settingRoutes.index()}?active_tab=forms` },
        { title: 'Submissions' },
    ],
};

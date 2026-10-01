import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    rows: T[];
    columns: DataTableColumn<T>[];
    pagination: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    pageSizes: number[];
    onPageSizeChange: (pageSize: number) => void;
    emptyMessage?: string;
};

function DataTable<T extends { id: number }>({
    rows,
    columns,
    pagination,
    pageSizes,
    onPageSizeChange,
    emptyMessage = 'No records found.',
}: DataTableProps<T>) {
    return (
        <section className="overflow-hidden rounded-lg border bg-background shadow-sm">
            {rows.length > 0 ? (
                <>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`px-5 py-3.5 ${column.className ?? ''}`}
                                            scope="col"
                                        >
                                            {column.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`px-5 py-4 ${column.className ?? ''}`}
                                            >
                                                {column.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="divide-y md:hidden">
                        {rows.map((row) => (
                            <article key={row.id} className="space-y-3 p-4">
                                {columns.map((column) => (
                                    <div
                                        key={column.key}
                                        className="flex items-start justify-between gap-4"
                                    >
                                        <span className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                                            {column.header}
                                        </span>
                                        <div className="min-w-0 text-right">
                                            {column.render(row)}
                                        </div>
                                    </div>
                                ))}
                            </article>
                        ))}
                    </div>
                </>
            ) : (
                <div className="px-6 py-16 text-center">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search or filters.
                    </p>
                </div>
            )}

            <footer className="flex flex-col gap-4 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground sm:justify-start">
                    <span>
                        {pagination.total === 0
                            ? '0 results'
                            : `Showing ${pagination.from}–${pagination.to} of ${pagination.total}`}
                    </span>
                    <label className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Rows</span>
                        <Select
                            value={String(pagination.per_page)}
                            onValueChange={(value) =>
                                onPageSizeChange(Number(value))
                            }
                        >
                            <SelectTrigger
                                aria-label="Rows per page"
                                className="h-8 w-18 bg-background"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizes.map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={String(pageSize)}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>

                <nav
                    aria-label="Table pagination"
                    className="flex items-center justify-between gap-3 sm:justify-end"
                >
                    {pagination.prev_page_url ? (
                        <Link
                            href={pagination.prev_page_url}
                            preserveScroll
                            aria-label="Previous page"
                            className="inline-flex size-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
                        >
                            <ChevronLeft className="size-4" />
                        </Link>
                    ) : (
                        <span className="inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground/50">
                            <ChevronLeft className="size-4" />
                        </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    {pagination.next_page_url ? (
                        <Link
                            href={pagination.next_page_url}
                            preserveScroll
                            aria-label="Next page"
                            className="inline-flex size-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
                        >
                            <ChevronRight className="size-4" />
                        </Link>
                    ) : (
                        <span className="inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground/50">
                            <ChevronRight className="size-4" />
                        </span>
                    )}
                </nav>
            </footer>
        </section>
    );
}

export { DataTable };

import ConfirmationModal from '@/components/confirmation-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import menus from '@/routes/admin/menus';
import menuItems from '@/routes/admin/menus/items';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ListTree,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type MenuRecord = {
    id: number;
    name: string;
    location: string | null;
    menu_items_count: number;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMenus = {
    data: MenuRecord[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
};

export default function MenusIndex({
    menus: menuList,
}: {
    menus: PaginatedMenus;
}) {
    const [menuToDelete, setMenuToDelete] = useState<MenuRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const deleteMenu = () => {
        if (!menuToDelete) return;

        setDeleting(true);
        router.delete(menus.destroy.url(menuToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setMenuToDelete(null),
            onError: (errors) => {
                toast.error(
                    Object.values(errors).find(Boolean) ??
                        'Could not delete this menu.',
                );
            },
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <>
            <Head title="Menus" />
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Menus"
                        description="Build and organize navigation menus for your site."
                    />
                    <Button asChild>
                        <Link href={menus.create()}>
                            <Plus />
                            Create menu
                        </Link>
                    </Button>
                </div>

                {menuList.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ListTree className="size-7" />
                            </span>
                            <div className="space-y-1">
                                <h2 className="font-semibold">No menus yet</h2>
                                <p className="max-w-md text-sm text-muted-foreground">
                                    Create your first navigation menu to get
                                    started.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href={menus.create()}>
                                    <Plus />
                                    Create your first menu
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>All menus</CardTitle>
                            <CardDescription>
                                {menuList.total}{' '}
                                {menuList.total === 1 ? 'menu' : 'menus'}{' '}
                                available
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-y bg-muted/40 text-left text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 font-medium">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 font-medium">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 font-medium">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {menuList.data.map((menu) => (
                                            <tr
                                                key={menu.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-medium">
                                                        {menu.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {menu.location ? (
                                                        <Badge variant="secondary">
                                                            {menu.location}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Not set
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {menu.menu_items_count}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Intl.DateTimeFormat(
                                                        undefined,
                                                        {
                                                            dateStyle: 'medium',
                                                        },
                                                    ).format(
                                                        new Date(
                                                            menu.created_at,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={menuItems.index(
                                                                    menu.id,
                                                                )}
                                                            >
                                                                <ListTree />
                                                                Manage items
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Link
                                                                href={menus.edit(
                                                                    menu.id,
                                                                )}
                                                                aria-label={`Edit ${menu.name}`}
                                                            >
                                                                <Pencil />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            aria-label={`Delete ${menu.name}`}
                                                            onClick={() =>
                                                                setMenuToDelete(
                                                                    menu,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {menuList.last_page > 1 && (
                                <nav
                                    className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
                                    aria-label="Menu pages"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Page {menuList.current_page} of{' '}
                                        {menuList.last_page}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {menuList.links.map((link, index) => {
                                            const label = link.label
                                                .replace(/&laquo;|&raquo;/g, '')
                                                .trim();
                                            const content =
                                                label ||
                                                (index === 0 ? (
                                                    <ChevronLeft />
                                                ) : (
                                                    <ChevronRight />
                                                ));

                                            return (
                                                <Button
                                                    key={`${link.label}-${index}`}
                                                    asChild={Boolean(link.url)}
                                                    variant={
                                                        link.active
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    disabled={!link.url}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            preserveScroll
                                                        >
                                                            {content}
                                                        </Link>
                                                    ) : (
                                                        <span
                                                            aria-label={
                                                                index === 0
                                                                    ? 'Previous page'
                                                                    : 'Next page'
                                                            }
                                                        >
                                                            {content}
                                                        </span>
                                                    )}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </nav>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <ConfirmationModal
                open={menuToDelete !== null}
                onOpenChange={(open) => !open && setMenuToDelete(null)}
                title="Delete menu?"
                description={
                    <>
                        This permanently deletes{' '}
                        <strong>{menuToDelete?.name}</strong> and all of its
                        menu items.
                    </>
                }
                confirmLabel="Delete menu"
                destructive
                processing={deleting}
                processingLabel="Deleting…"
                onConfirm={deleteMenu}
            />
        </>
    );
}

MenusIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Menus' },
    ],
};

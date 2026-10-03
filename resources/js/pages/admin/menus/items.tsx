import ConfirmationModal from '@/components/confirmation-modal';
import Heading from '@/components/heading';
import MenuItemDialog from '@/components/menu-item-dialog';
import MenuItemTree from '@/components/menu-item-tree';
import {
    buildMenuTree,
    moveMenuItem,
    type MenuItemDropPosition,
    type MenuItemRecord,
    type ResourceOption,
} from '@/components/menu-item-utils';
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
import menuItemRoutes from '@/routes/admin/menus/items';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type MenuRecord = {
    id: number;
    name: string;
    location: string | null;
};

type MenuItemsPageProps = {
    menu: MenuRecord;
    items: MenuItemRecord[];
    pages: ResourceOption[];
    products: ResourceOption[];
    categories: ResourceOption[];
};

export default function MenuItemsPage({
    menu,
    items,
    pages,
    products,
    categories,
}: MenuItemsPageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<MenuItemRecord | null>(null);
    const [itemToDelete, setItemToDelete] = useState<MenuItemRecord | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const tree = buildMenuTree(items);

    const openCreateDialog = () => {
        setItemToEdit(null);
        setDialogOpen(true);
    };

    const openEditDialog = (item: MenuItemRecord) => {
        setItemToEdit(item);
        setDialogOpen(true);
    };

    const saveOrder = (
        sourceId: number,
        targetId: number | null,
        position: MenuItemDropPosition,
    ) => {
        const orderedItems = moveMenuItem(items, sourceId, targetId, position);

        if (!orderedItems) {
            return;
        }

        setIsReordering(true);
        router.put(
            menuItemRoutes.reorder.url(menu.id),
            {
                items: orderedItems.map(({ id, parent_id, sort_order }) => ({
                    id,
                    parent_id,
                    sort_order,
                })),
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(
                        Object.values(errors).find(Boolean) ??
                            'Could not save this menu order.',
                    );
                },
                onFinish: () => setIsReordering(false),
            },
        );
    };

    const toggleItem = (item: MenuItemRecord, active: boolean) => {
        router.put(
            menuItemRoutes.update.url({ menu: menu.id, menuItem: item.id }),
            {
                label: item.label,
                type: item.type,
                url: item.type === 'custom' ? item.url : null,
                reference_id: item.type === 'custom' ? null : item.reference_id,
                parent_id: item.parent_id,
                target: item.target,
                is_active: active,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(
                        Object.values(errors).find(Boolean) ??
                            'Could not update this menu item.',
                    );
                },
            },
        );
    };

    const deleteItem = () => {
        if (!itemToDelete) {
            return;
        }

        setIsDeleting(true);
        router.delete(
            menuItemRoutes.destroy.url({
                menu: menu.id,
                menuItem: itemToDelete.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => setItemToDelete(null),
                onError: (errors) => {
                    toast.error(
                        Object.values(errors).find(Boolean) ??
                            'Could not delete this menu item.',
                    );
                },
                onFinish: () => setIsDeleting(false),
            },
        );
    };

    return (
        <>
            <Head title={`${menu.name} items`} />
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="-ml-3"
                        >
                            <Link href={menus.index()}>
                                <ArrowLeft />
                                All menus
                            </Link>
                        </Button>
                        <Heading
                            title={menu.name}
                            description={
                                menu.location
                                    ? `Manage the ${menu.location} menu and its nested navigation items.`
                                    : 'Manage this menu and its nested navigation items.'
                            }
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={menus.edit(menu.id)}>
                                Menu settings
                            </Link>
                        </Button>
                        <Button onClick={openCreateDialog}>
                            <Plus />
                            Add menu item
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle>Navigation structure</CardTitle>
                                <CardDescription>
                                    Drag an item above or below another to
                                    reorder it. Drop on the center of an item to
                                    nest it.
                                </CardDescription>
                            </div>
                            <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                {items.length}{' '}
                                {items.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-14 text-center">
                                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Plus className="size-7" />
                                </span>
                                <div className="space-y-1">
                                    <h2 className="font-semibold">
                                        No menu items yet
                                    </h2>
                                    <p className="max-w-md text-sm text-muted-foreground">
                                        Add your first item to start building
                                        this navigation.
                                    </p>
                                </div>
                                <Button onClick={openCreateDialog}>
                                    <Plus />
                                    Add your first item
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                    <Info className="size-4 shrink-0" />
                                    Drop in the upper or lower area to place
                                    beside an item; drop in the center to make
                                    it a child.
                                </div>
                                <MenuItemTree
                                    tree={tree}
                                    items={items}
                                    pages={pages}
                                    products={products}
                                    categories={categories}
                                    disabled={isReordering}
                                    onMove={saveOrder}
                                    onEdit={openEditDialog}
                                    onDelete={setItemToDelete}
                                    onToggle={toggleItem}
                                />
                                {isReordering && (
                                    <p
                                        className="mt-3 text-center text-sm text-muted-foreground"
                                        role="status"
                                    >
                                        Saving menu order…
                                    </p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <MenuItemDialog
                menu={menu}
                item={itemToEdit}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                items={tree}
                pages={pages}
                products={products}
                categories={categories}
            />

            <ConfirmationModal
                open={itemToDelete !== null}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                title="Delete menu item?"
                description={
                    <>
                        This permanently deletes{' '}
                        <strong>{itemToDelete?.label}</strong>
                        {itemToDelete &&
                        items.some((item) => item.parent_id === itemToDelete.id)
                            ? ' and all of its nested child items.'
                            : '.'}
                    </>
                }
                confirmLabel="Delete item"
                destructive
                processing={isDeleting}
                processingLabel="Deleting…"
                onConfirm={deleteItem}
            />
        </>
    );
}

MenuItemsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Menus', href: menus.index() },
        { title: 'Items' },
    ],
};

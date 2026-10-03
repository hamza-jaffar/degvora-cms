import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    getDescendantIds,
    type MenuItemDropPosition,
    type MenuItemNode,
    type MenuItemRecord,
    type ResourceOption,
} from '@/components/menu-item-utils';
import { cn } from '@/lib/utils';
import {
    ExternalLink,
    FileText,
    GripVertical,
    Package,
    Pencil,
    Tags,
    Trash2,
} from 'lucide-react';
import { useState, type DragEvent } from 'react';

type DropTarget = {
    id: number | null;
    position: MenuItemDropPosition;
    invalid: boolean;
};

type MenuItemTreeProps = {
    tree: MenuItemNode[];
    items: MenuItemRecord[];
    pages: ResourceOption[];
    products: ResourceOption[];
    categories: ResourceOption[];
    disabled: boolean;
    onMove: (
        sourceId: number,
        targetId: number | null,
        position: MenuItemDropPosition,
    ) => void;
    onEdit: (item: MenuItemRecord) => void;
    onDelete: (item: MenuItemRecord) => void;
    onToggle: (item: MenuItemRecord, active: boolean) => void;
};

function destinationLabel(
    item: MenuItemRecord,
    resources: Record<MenuItemRecord['type'], ResourceOption[]>,
): string {
    if (item.type === 'custom') {
        return item.url ?? 'No URL';
    }

    return (
        resources[item.type].find(
            (resource) => resource.id === item.reference_id,
        )?.name ?? `Unavailable ${item.type} (#${item.reference_id ?? '—'})`
    );
}

function ItemTypeIcon({ type }: { type: MenuItemRecord['type'] }) {
    const Icon =
        type === 'page'
            ? FileText
            : type === 'product'
              ? Package
              : type === 'category'
                ? Tags
                : ExternalLink;

    return <Icon className="size-4 text-muted-foreground" />;
}

export default function MenuItemTree({
    tree,
    items,
    pages,
    products,
    categories,
    disabled,
    onMove,
    onEdit,
    onDelete,
    onToggle,
}: MenuItemTreeProps) {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
    const resources = {
        custom: [],
        page: pages,
        product: products,
        category: categories,
    };

    const positionFor = (
        event: DragEvent<HTMLDivElement>,
        targetId: number | null,
    ): MenuItemDropPosition => {
        if (targetId === null) {
            return 'inside';
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const relativeY = (event.clientY - bounds.top) / bounds.height;

        if (relativeY < 0.28) {
            return 'before';
        }

        if (relativeY > 0.72) {
            return 'after';
        }

        return 'inside';
    };

    const beginDrag = (event: DragEvent<HTMLButtonElement>, itemId: number) => {
        if (disabled) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(itemId));
        setDraggedId(itemId);
    };

    const dragOver = (
        event: DragEvent<HTMLDivElement>,
        targetId: number | null,
    ) => {
        if (draggedId === null || disabled) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';

        const position = positionFor(event, targetId);
        const targetItem =
            targetId === null
                ? null
                : items.find((item) => item.id === targetId);
        const destinationParent =
            position === 'inside' ? targetId : (targetItem?.parent_id ?? null);
        const descendants = getDescendantIds(items, draggedId);
        const invalid =
            targetId === draggedId ||
            (destinationParent !== null && descendants.has(destinationParent));

        setDropTarget({ id: targetId, position, invalid });
    };

    const drop = (
        event: DragEvent<HTMLDivElement>,
        targetId: number | null,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (draggedId === null || disabled) {
            return;
        }

        const position = positionFor(event, targetId);
        const targetItem =
            targetId === null
                ? null
                : items.find((item) => item.id === targetId);
        const destinationParent =
            position === 'inside' ? targetId : (targetItem?.parent_id ?? null);

        if (
            targetId !== draggedId &&
            (destinationParent === null ||
                !getDescendantIds(items, draggedId).has(destinationParent))
        ) {
            onMove(draggedId, targetId, position);
        }

        setDraggedId(null);
        setDropTarget(null);
    };

    const renderNode = (node: MenuItemNode, depth: number) => {
        const activeDrop = dropTarget?.id === node.id;
        const destination = destinationLabel(node, resources);

        return (
            <div key={node.id} className="space-y-2">
                <div
                    onDragOver={(event) => dragOver(event, node.id)}
                    onDrop={(event) => drop(event, node.id)}
                    className={cn(
                        'group relative flex flex-wrap items-center gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm transition-all sm:px-4',
                        'hover:border-primary/30 hover:shadow-md',
                        draggedId === node.id && 'scale-[0.99] opacity-50',
                        activeDrop &&
                            !dropTarget.invalid &&
                            'border-primary bg-primary/5 ring-2 ring-primary/25',
                        activeDrop &&
                            dropTarget.invalid &&
                            'border-destructive bg-destructive/5 ring-2 ring-destructive/25',
                    )}
                    style={{ marginLeft: `${Math.min(depth, 5) * 20}px` }}
                    aria-label={`${node.label}, ${node.type} menu item`}
                >
                    {activeDrop && (
                        <span
                            className={cn(
                                'absolute -top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase shadow',
                                dropTarget.invalid
                                    ? 'bg-destructive'
                                    : 'bg-primary',
                            )}
                        >
                            {dropTarget.invalid
                                ? 'Cannot place here'
                                : dropTarget.position === 'inside'
                                  ? 'Nest inside'
                                  : `Place ${dropTarget.position}`}
                        </span>
                    )}
                    <button
                        type="button"
                        draggable={!disabled}
                        onDragStart={(event) => beginDrag(event, node.id)}
                        onDragEnd={() => {
                            setDraggedId(null);
                            setDropTarget(null);
                        }}
                        className="flex size-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        aria-label={`Drag to reorder ${node.label}`}
                        title="Drag to reorder or nest"
                    >
                        <GripVertical className="size-5" />
                    </button>

                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                        <ItemTypeIcon type={node.type} />
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium">
                                {node.label}
                            </span>
                            <Badge
                                variant="secondary"
                                className="font-normal capitalize"
                            >
                                {node.type}
                            </Badge>
                            {!node.is_active && (
                                <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                >
                                    Inactive
                                </Badge>
                            )}
                        </div>
                        <p
                            className="mt-1 truncate text-xs text-muted-foreground"
                            title={destination}
                        >
                            {destination}
                            {node.target === '_blank' && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    <ExternalLink className="size-3" />
                                    New tab
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Switch
                            checked={node.is_active}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                                onToggle(node, checked)
                            }
                            aria-label={`${node.is_active ? 'Disable' : 'Enable'} ${node.label}`}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            onClick={() => onEdit(node)}
                            aria-label={`Edit ${node.label}`}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(node)}
                            aria-label={`Delete ${node.label}`}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>

                {node.children.length > 0 && (
                    <div className="ml-5 space-y-2 border-l-2 border-primary/15 pl-4 sm:ml-8 sm:pl-5">
                        {node.children.map((child) =>
                            renderNode(child, depth + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            <div
                className="space-y-3"
                role="tree"
                aria-label="Menu item hierarchy"
            >
                {tree.map((node) => renderNode(node, 0))}
            </div>

            <div
                onDragOver={(event) => dragOver(event, null)}
                onDrop={(event) => drop(event, null)}
                className={cn(
                    'flex min-h-16 items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors',
                    dropTarget?.id === null &&
                        !dropTarget.invalid &&
                        'border-primary bg-primary/5 text-primary',
                )}
            >
                <GripVertical className="size-4" />
                Drop here to move an item to the top level
            </div>
        </div>
    );
}

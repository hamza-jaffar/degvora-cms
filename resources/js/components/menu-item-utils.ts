export type MenuItemType = 'custom' | 'page' | 'product' | 'category';

export type MenuItemRecord = {
    id: number;
    menu_id: number;
    parent_id: number | null;
    label: string;
    type: MenuItemType;
    url: string | null;
    reference_id: number | null;
    sort_order: number;
    target: '_self' | '_blank';
    is_active: boolean;
};

export type MenuItemNode = MenuItemRecord & {
    children: MenuItemNode[];
};

export type ResourceOption = {
    id: number;
    name: string;
    slug: string;
};

export type MenuItemDropPosition = 'before' | 'inside' | 'after';

export function buildMenuTree(items: MenuItemRecord[]): MenuItemNode[] {
    const nodes = new Map<number, MenuItemNode>();

    items.forEach((item) => nodes.set(item.id, { ...item, children: [] }));

    const roots: MenuItemNode[] = [];

    nodes.forEach((node) => {
        const parent =
            node.parent_id === null ? undefined : nodes.get(node.parent_id);

        if (parent && parent.id !== node.id) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    const sort = (siblings: MenuItemNode[]) => {
        siblings.sort(
            (first, second) =>
                first.sort_order - second.sort_order || first.id - second.id,
        );
        siblings.forEach((node) => sort(node.children));
    };

    sort(roots);

    return roots;
}

export function flattenMenuTree(
    nodes: MenuItemNode[],
    depth = 0,
): Array<{ item: MenuItemNode; depth: number }> {
    return nodes.flatMap((node) => [
        { item: node, depth },
        ...flattenMenuTree(node.children, depth + 1),
    ]);
}

export function getDescendantIds(
    items: MenuItemRecord[],
    rootId: number,
): Set<number> {
    const descendants = new Set<number>();
    const parents = new Map<number | null, number[]>();

    items.forEach((item) => {
        const children = parents.get(item.parent_id) ?? [];
        children.push(item.id);
        parents.set(item.parent_id, children);
    });

    const pending = [...(parents.get(rootId) ?? [])];

    while (pending.length > 0) {
        const childId = pending.pop();

        if (childId === undefined || descendants.has(childId)) {
            continue;
        }

        descendants.add(childId);
        pending.push(...(parents.get(childId) ?? []));
    }

    return descendants;
}

export function moveMenuItem(
    items: MenuItemRecord[],
    sourceId: number,
    targetId: number | null,
    position: MenuItemDropPosition,
): MenuItemRecord[] | null {
    const movingItem = items.find((item) => item.id === sourceId);
    const targetItem =
        targetId === null
            ? undefined
            : items.find((item) => item.id === targetId);

    if (
        !movingItem ||
        (targetId !== null && !targetItem) ||
        sourceId === targetId
    ) {
        return null;
    }

    const parentId =
        position === 'inside'
            ? (targetItem?.id ?? null)
            : (targetItem?.parent_id ?? null);
    const descendants = getDescendantIds(items, sourceId);

    if (
        parentId === sourceId ||
        (parentId !== null && descendants.has(parentId))
    ) {
        return null;
    }

    const remaining = items.filter((item) => item.id !== sourceId);
    const updatedMoving = { ...movingItem, parent_id: parentId };
    const groups = new Map<string, MenuItemRecord[]>();

    remaining.forEach((item) => {
        const key = item.parent_id === null ? 'root' : String(item.parent_id);
        const siblings = groups.get(key) ?? [];
        siblings.push(item);
        groups.set(key, siblings);
    });

    const destinationKey = parentId === null ? 'root' : String(parentId);
    const destination = groups.get(destinationKey) ?? [];

    destination.sort(
        (first, second) =>
            first.sort_order - second.sort_order || first.id - second.id,
    );

    let insertionIndex = destination.length;

    if (position !== 'inside' && targetItem) {
        const targetIndex = destination.findIndex(
            (item) => item.id === targetId,
        );
        insertionIndex = targetIndex + (position === 'after' ? 1 : 0);
    }

    destination.splice(insertionIndex, 0, updatedMoving);
    groups.set(destinationKey, destination);

    const updatedOrder = new Map<
        number,
        { parent_id: number | null; sort_order: number }
    >();

    groups.forEach((siblings, key) => {
        siblings.forEach((item, sortOrder) => {
            updatedOrder.set(item.id, {
                parent_id: key === 'root' ? null : Number(key),
                sort_order: sortOrder,
            });
        });
    });

    return items.map((item) => {
        const order = updatedOrder.get(item.id);

        return order ? { ...item, ...order } : item;
    });
}

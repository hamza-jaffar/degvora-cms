import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    flattenMenuTree,
    getDescendantIds,
    type MenuItemNode,
    type MenuItemRecord,
    type MenuItemType,
    type ResourceOption,
} from '@/components/menu-item-utils';
import menuItemRoutes from '@/routes/admin/menus/items';
import { useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

type MenuRecord = {
    id: number;
};

type MenuItemFormData = {
    label: string;
    type: MenuItemType;
    url: string;
    reference_id: string;
    parent_id: string;
    target: '_self' | '_blank';
    is_active: boolean;
};

type MenuItemDialogProps = {
    menu: MenuRecord;
    item: MenuItemRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: MenuItemNode[];
    pages: ResourceOption[];
    products: ResourceOption[];
    categories: ResourceOption[];
};

const defaultData: MenuItemFormData = {
    label: '',
    type: 'custom',
    url: '',
    reference_id: '',
    parent_id: '',
    target: '_self',
    is_active: true,
};

const typeLabels: Record<MenuItemType, string> = {
    custom: 'Custom URL',
    page: 'Page',
    product: 'Product',
    category: 'Category',
};

function isMenuItemType(value: string): value is MenuItemType {
    return (
        value === 'custom' ||
        value === 'page' ||
        value === 'product' ||
        value === 'category'
    );
}

export default function MenuItemDialog({
    menu,
    item,
    open,
    onOpenChange,
    items,
    pages,
    products,
    categories,
}: MenuItemDialogProps) {
    const { data, setData, post, put, processing, errors, clearErrors } =
        useForm<MenuItemFormData>(defaultData);
    const [resourceSearch, setResourceSearch] = useState('');
    const excludedParentIds = item
        ? getDescendantIds(
              flattenMenuTree(items).map(({ item: menuItem }) => menuItem),
              item.id,
          )
        : new Set<number>();
    const parentOptions = flattenMenuTree(items).filter(
        ({ item: option }) =>
            option.id !== item?.id && !excludedParentIds.has(option.id),
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();
        setResourceSearch('');
        setData(
            item
                ? {
                      label: item.label,
                      type: item.type,
                      url: item.url ?? '',
                      reference_id: item.reference_id?.toString() ?? '',
                      parent_id: item.parent_id?.toString() ?? '',
                      target: item.target,
                      is_active: item.is_active,
                  }
                : defaultData,
        );
    }, [clearErrors, item, open, setData]);

    const resources =
        data.type === 'page'
            ? pages
            : data.type === 'product'
              ? products
              : data.type === 'category'
                ? categories
                : [];
    const resourceNames =
        data.type === 'page'
            ? 'published, public pages'
            : data.type === 'product'
              ? 'active products'
              : 'active categories';
    const filteredResources = resources.filter((resource) =>
        `${resource.name} ${resource.slug}`
            .toLowerCase()
            .includes(resourceSearch.trim().toLowerCase()),
    );

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            onSuccess: () => onOpenChange(false),
        };

        if (item) {
            put(
                menuItemRoutes.update.url({ menu: menu.id, menuItem: item.id }),
                options,
            );
        } else {
            post(menuItemRoutes.store.url(menu.id), options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {item ? 'Edit menu item' : 'Add menu item'}
                    </DialogTitle>
                    <DialogDescription>
                        Choose what this navigation item links to and where it
                        belongs.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={submit}>
                    <div className="space-y-2">
                        <Label htmlFor="item-label">Label</Label>
                        <Input
                            id="item-label"
                            value={data.label}
                            onChange={(event) =>
                                setData('label', event.target.value)
                            }
                            maxLength={255}
                            autoFocus
                            required
                        />
                        <InputError message={errors.label} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="item-type">Type</Label>
                        <Select
                            value={data.type}
                            onValueChange={(value) => {
                                if (isMenuItemType(value)) {
                                    setData((current) => ({
                                        ...current,
                                        type: value,
                                        url: '',
                                        reference_id: '',
                                    }));
                                    setResourceSearch('');
                                }
                            }}
                        >
                            <SelectTrigger id="item-type" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    Object.keys(typeLabels) as MenuItemType[]
                                ).map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {typeLabels[type]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    {data.type === 'custom' ? (
                        <div className="space-y-2">
                            <Label htmlFor="item-url">URL</Label>
                            <Input
                                id="item-url"
                                value={data.url}
                                onChange={(event) =>
                                    setData('url', event.target.value)
                                }
                                placeholder="https://example.com or /about"
                                maxLength={255}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Use an http(s) address or a site-relative path
                                beginning with one slash.
                            </p>
                            <InputError message={errors.url} />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="item-reference">
                                {typeLabels[data.type]}
                            </Label>
                            <Select
                                value={data.reference_id}
                                onValueChange={(value) =>
                                    setData('reference_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="item-reference"
                                    className="w-full"
                                >
                                    <SelectValue
                                        placeholder={`Select ${data.type}`}
                                    />
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
                                                value={resourceSearch}
                                                onChange={(event) =>
                                                    setResourceSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={`Search ${resourceNames}...`}
                                                aria-label={`Search ${data.type}s`}
                                                className="h-8 pl-8"
                                            />
                                        </div>
                                    </div>
                                    {filteredResources.map((resource) => (
                                        <SelectItem
                                            key={resource.id}
                                            value={String(resource.id)}
                                        >
                                            {resource.name}
                                        </SelectItem>
                                    ))}
                                    {filteredResources.length === 0 && (
                                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                            {resources.length === 0
                                                ? `No ${resourceNames} are available.`
                                                : `No ${data.type}s match "${resourceSearch}".`}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {resources.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No {resourceNames} are available to select.
                                </p>
                            )}
                            <InputError message={errors.reference_id} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="item-parent">Parent item</Label>
                        <Select
                            value={data.parent_id || 'none'}
                            onValueChange={(value) =>
                                setData(
                                    'parent_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger id="item-parent" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    No parent (top level)
                                </SelectItem>
                                {parentOptions.map(
                                    ({ item: option, depth }) => (
                                        <SelectItem
                                            key={option.id}
                                            value={String(option.id)}
                                        >
                                            {`${'— '.repeat(depth)}${option.label}`}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.parent_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="item-target">Open link in</Label>
                        <Select
                            value={data.target}
                            onValueChange={(value) => {
                                if (value === '_self' || value === '_blank') {
                                    setData('target', value);
                                }
                            }}
                        >
                            <SelectTrigger id="item-target" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_self">Same tab</SelectItem>
                                <SelectItem value="_blank">New tab</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.target} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                            <Label htmlFor="item-active">
                                Visible in navigation
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Inactive items stay saved but are hidden from
                                navigation.
                            </p>
                        </div>
                        <Switch
                            id="item-active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', checked)
                            }
                        />
                        <InputError message={errors.is_active} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving…'
                                : item
                                  ? 'Save changes'
                                  : 'Add item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

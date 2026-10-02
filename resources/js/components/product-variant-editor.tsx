import { Button } from "@/components/ui/button";
import InputError from "@/components/input-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product, ProductVariantItem } from "@/types/data";
import { Check, Minus, Plus, Sparkles, X } from "lucide-react";
import React, { useState, useMemo, useCallback, memo } from "react";

type OptionDraft = {
    id: number;
    name: string;
    values: string[];
    draftValue: string;
};

type PricingMode = "single" | "variants";
type VariantField = "price" | "compare_at_price" | "sku" | "quantity";

const variantKey = (options: Record<string, string>): string =>
    Object.entries(options)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, value]) => `${name}:${value}`)
        .join("|");

function combinations(options: OptionDraft[]): Record<string, string>[] {
    let rows: Record<string, string>[] = [{}];

    for (const option of options) {
        const name = option.name.trim();
        const values = option.values;

        if (!name || values.length === 0) {
            return [];
        }

        const nextRows: Record<string, string>[] = [];
        for (const row of rows) {
            for (const value of values) {
                nextRows.push({ ...row, [name]: value });
            }
        }
        rows = nextRows;
    }

    return options.length > 0 ? rows : [];
}

const VariantRow = memo(function VariantRow({
    row,
    variantPricingType,
    currency,
    updateVariant,
}: {
    row: ProductVariantItem;
    variantPricingType: "single" | "different";
    currency: string;
    updateVariant: (
        values: Record<string, string>,
        field: VariantField,
        value: string,
    ) => void;
}) {
    const key = variantKey(row.options);
    const label = Object.entries(row.options)
        .map(([name, value]) => `${name}: ${value}`)
        .join(" / ");

    return (
        <tr>
            <td className="px-3 py-3 font-medium">{label}</td>
            {variantPricingType === "different" && (
                <>
                    <td className="px-2 py-2">
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            aria-label={`${key} price`}
                            value={row.price}
                            onChange={(e) =>
                                updateVariant(
                                    row.options,
                                    "price",
                                    e.target.value,
                                )
                            }
                        />
                    </td>
                    <td className="px-2 py-2">
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            aria-label={`${key} compare-at price`}
                            placeholder="Optional"
                            value={row.compare_at_price ?? ""}
                            onChange={(e) =>
                                updateVariant(
                                    row.options,
                                    "compare_at_price",
                                    e.target.value,
                                )
                            }
                        />
                    </td>
                </>
            )}
            {variantPricingType === "single" && (
                <td className="px-2 py-2">
                    <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {currency} {Number(row.price || 0).toFixed(2)}
                    </span>
                </td>
            )}
            <td className="px-2 py-2">
                <Input
                    aria-label={`${key} SKU`}
                    maxLength={255}
                    value={row.sku ?? ""}
                    onChange={(e) =>
                        updateVariant(row.options, "sku", e.target.value)
                    }
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    min="0"
                    step="1"
                    aria-label={`${key} quantity`}
                    value={row.quantity}
                    onChange={(e) =>
                        updateVariant(row.options, "quantity", e.target.value)
                    }
                />
            </td>
        </tr>
    );
});

const GroupPriceRow = memo(function GroupPriceRow({
    group,
    updatePriceGroup,
}: {
    group: {
        key: string;
        label: string;
        rows: ProductVariantItem[];
        price: string;
        compareAtPrice: string;
        mixedPrice: boolean;
        mixedCompareAtPrice: boolean;
    };
    updatePriceGroup: (
        groupRows: ProductVariantItem[],
        field: "price" | "compare_at_price",
        value: string,
    ) => void;
}) {
    return (
        <tr>
            <td className="px-3 py-3 font-medium">
                {group.label}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {group.rows.length} combination
                    {group.rows.length === 1 ? "" : "s"}
                </span>
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    aria-label={`${group.label} price`}
                    placeholder={group.mixedPrice ? "Prices differ" : "0.00"}
                    value={group.price}
                    onChange={(e) =>
                        updatePriceGroup(group.rows, "price", e.target.value)
                    }
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`${group.label} compare-at price`}
                    placeholder={
                        group.mixedCompareAtPrice ? "Values differ" : "Optional"
                    }
                    value={group.compareAtPrice}
                    onChange={(e) =>
                        updatePriceGroup(
                            group.rows,
                            "compare_at_price",
                            e.target.value,
                        )
                    }
                />
            </td>
        </tr>
    );
});

export function ProductVariantEditor({
    product,
    errors,
}: {
    product: Product | null;
    errors: Record<string, string | undefined>;
}) {
    const savedVariants =
        product?.variants?.pricing_mode === "variants"
            ? product.variants
            : null;
    const [pricingMode, setPricingMode] = useState<PricingMode>(
        savedVariants ? "variants" : "single",
    );

    const initialVariantPricingType = (): "single" | "different" => {
        if (!savedVariants) return "single";
        if (
            Array.isArray(savedVariants.price_options) &&
            savedVariants.price_options.length === 0
        ) {
            return "single";
        }
        const itemPrices = new Set(
            savedVariants.items.map((item) => String(item.price)),
        );
        return itemPrices.size > 1 ? "different" : "single";
    };

    const [variantPricingType, setVariantPricingType] = useState<
        "single" | "different"
    >(initialVariantPricingType);

    const [variantSinglePrice, setVariantSinglePrice] = useState(
        String(product?.price ?? "0.00"),
    );
    const [variantSingleCompareAtPrice, setVariantSingleCompareAtPrice] =
        useState(
            product?.compare_at_price == null
                ? ""
                : String(product.compare_at_price),
        );

    const [singlePrice, setSinglePrice] = useState(
        String(product?.price ?? "0.00"),
    );
    const [singleCompareAtPrice, setSingleCompareAtPrice] = useState(
        product?.compare_at_price == null
            ? ""
            : String(product.compare_at_price),
    );
    const [singleSku, setSingleSku] = useState(product?.sku ?? "");
    const [singleQuantity, setSingleQuantity] = useState(
        String(product?.quantity ?? 0),
    );
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState("");
    const [bulkQuantity, setBulkQuantity] = useState("");
    const [options, setOptions] = useState<OptionDraft[]>(
        () =>
            savedVariants?.options.map((option, index) => ({
                id: index + 1,
                name: option.name,
                values: option.values,
                draftValue: "",
            })) ?? [],
    );
    const [priceOptionNames, setPriceOptionNames] = useState<string[]>(() =>
        savedVariants
            ? (savedVariants.price_options ??
              savedVariants.options.map((option) => option.name))
            : [],
    );
    const [variantItems, setVariantItems] = useState<ProductVariantItem[]>(
        savedVariants?.items ?? [],
    );

    const variantOptions = useMemo(
        () =>
            options
                .map((option) => ({
                    name: option.name.trim(),
                    values: option.values,
                }))
                .filter((option) => option.name && option.values.length > 0),
        [options],
    );

    const optionRows = useMemo(() => combinations(options), [options]);

    const activePriceOptionNames = useMemo(
        () =>
            variantPricingType === "single"
                ? []
                : priceOptionNames.filter((name) =>
                      variantOptions.some((option) => option.name === name),
                  ),
        [variantPricingType, priceOptionNames, variantOptions],
    );

    const variantItemsMap = useMemo(
        () =>
            new Map(
                variantItems.map((item) => [variantKey(item.options), item]),
            ),
        [variantItems],
    );

    const rows = useMemo(() => {
        return optionRows.map((values) => {
            const saved = variantItemsMap.get(variantKey(values));

            if (variantPricingType === "single") {
                return {
                    options: values,
                    price: variantSinglePrice,
                    compare_at_price:
                        variantSingleCompareAtPrice === ""
                            ? null
                            : variantSingleCompareAtPrice,
                    sku: saved?.sku ?? "",
                    quantity: saved?.quantity ?? (Number(singleQuantity) || 0),
                };
            }

            return (
                saved ?? {
                    options: values,
                    price: variantSinglePrice || singlePrice,
                    compare_at_price:
                        variantSingleCompareAtPrice || singleCompareAtPrice,
                    sku: "",
                    quantity: Number(singleQuantity) || 0,
                }
            );
        });
    }, [
        optionRows,
        variantItemsMap,
        variantPricingType,
        variantSinglePrice,
        variantSingleCompareAtPrice,
        singleQuantity,
        singlePrice,
        singleCompareAtPrice,
    ]);

    const priceGroups = useMemo(() => {
        const priceGroupMap = new Map<
            string,
            { label: string; rows: ProductVariantItem[] }
        >();

        for (const row of rows) {
            const key = activePriceOptionNames.length
                ? activePriceOptionNames
                      .map((name) => `${name}:${row.options[name] ?? ""}`)
                      .join("|")
                : "all";
            const label = activePriceOptionNames.length
                ? activePriceOptionNames
                      .map((name) => `${name}: ${row.options[name] ?? ""}`)
                      .join(" / ")
                : "All variations";
            const group = priceGroupMap.get(key) ?? { label, rows: [] };
            group.rows.push(row);
            priceGroupMap.set(key, group);
        }

        return [...priceGroupMap.entries()].map(([key, group]) => {
            const prices = [
                ...new Set(group.rows.map((row) => String(row.price))),
            ];
            const compareAtPrices = [
                ...new Set(
                    group.rows.map((row) =>
                        row.compare_at_price == null
                            ? ""
                            : String(row.compare_at_price),
                    ),
                ),
            ];

            return {
                key,
                ...group,
                price: prices.length === 1 ? prices[0] : "",
                compareAtPrice:
                    compareAtPrices.length === 1 ? compareAtPrices[0] : "",
                mixedPrice: prices.length > 1,
                mixedCompareAtPrice: compareAtPrices.length > 1,
            };
        });
    }, [rows, activePriceOptionNames]);

    const { minimumPrice, minimumCompareAtPrice, totalQuantity } =
        useMemo(() => {
            const minP = rows.length
                ? Math.min(
                      ...rows.map((row) => Number(row.price) || 0),
                  ).toFixed(2)
                : "0.00";
            const comparePrices = rows
                .map((row) => Number(row.compare_at_price))
                .filter((price) => Number.isFinite(price) && price > 0);
            const minComp = comparePrices.length
                ? Math.min(...comparePrices).toFixed(2)
                : "";
            const totalQty = rows.reduce(
                (total, row) => total + (Number(row.quantity) || 0),
                0,
            );
            return {
                minimumPrice: minP,
                minimumCompareAtPrice: minComp,
                totalQuantity: totalQty,
            };
        }, [rows]);

    const updateOption = useCallback(
        (id: number, changes: Partial<OptionDraft>) => {
            setOptions((current) =>
                current.map((option) =>
                    option.id === id ? { ...option, ...changes } : option,
                ),
            );
        },
        [],
    );

    const addOptionValue = useCallback((id: number) => {
        setOptions((currentOptions) => {
            const option = currentOptions.find((item) => item.id === id);
            const value = option?.draftValue.trim();

            if (!option || !value) {
                return currentOptions;
            }

            if (
                option.values.some(
                    (existing) =>
                        existing.toLowerCase() === value.toLowerCase(),
                )
            ) {
                return currentOptions.map((item) =>
                    item.id === id ? { ...item, draftValue: "" } : item,
                );
            }

            return currentOptions.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          values: [...item.values, value],
                          draftValue: "",
                      }
                    : item,
            );
        });
    }, []);

    const updateVariant = useCallback(
        (
            values: Record<string, string>,
            field: VariantField,
            value: string,
        ) => {
            const key = variantKey(values);
            setVariantItems((existing) => {
                const index = existing.findIndex(
                    (row) => variantKey(row.options) === key,
                );
                if (index !== -1 && (existing[index][field] ?? "") === value) {
                    return existing;
                }

                const current =
                    index !== -1
                        ? existing[index]
                        : {
                              options: values,
                              price: singlePrice,
                              compare_at_price: singleCompareAtPrice,
                              sku: "",
                              quantity: Number(singleQuantity) || 0,
                          };

                const updated = {
                    ...current,
                    [field]: value,
                } as ProductVariantItem;

                if (index === -1) {
                    return [...existing, updated];
                }

                const next = [...existing];
                next[index] = updated;
                return next;
            });
        },
        [singlePrice, singleCompareAtPrice, singleQuantity],
    );

    const updateAllRowsPrice = useCallback(
        (priceVal: string, compareAtVal: string) => {
            setVariantItems((current) => {
                const currentMap = new Map(
                    current.map((item) => [variantKey(item.options), item]),
                );
                return rows.map((row) => {
                    const key = variantKey(row.options);
                    const saved = currentMap.get(key);
                    return {
                        ...(saved ?? row),
                        price: priceVal,
                        compare_at_price:
                            compareAtVal === "" ? null : compareAtVal,
                    };
                });
            });
        },
        [rows],
    );

    const handleVariantPricingTypeChange = useCallback(
        (type: "single" | "different") => {
            setVariantPricingType(type);
            if (type === "different" && priceOptionNames.length === 0) {
                setPriceOptionNames(
                    variantOptions.map((option) => option.name),
                );
            }
            if (type === "single") {
                updateAllRowsPrice(
                    variantSinglePrice,
                    variantSingleCompareAtPrice,
                );
            }
        },
        [
            priceOptionNames.length,
            variantOptions,
            updateAllRowsPrice,
            variantSinglePrice,
            variantSingleCompareAtPrice,
        ],
    );

    const updatePriceGroup = useCallback(
        (
            groupRows: ProductVariantItem[],
            field: "price" | "compare_at_price",
            value: string,
        ) => {
            const groupKeys = new Set(
                groupRows.map((row) => variantKey(row.options)),
            );

            setVariantItems((current) => {
                const currentMap = new Map(
                    current.map((item) => [variantKey(item.options), item]),
                );
                return rows.map((row) => {
                    const key = variantKey(row.options);
                    const saved = currentMap.get(key);
                    const next = saved ?? row;

                    return groupKeys.has(key)
                        ? { ...next, [field]: value }
                        : next;
                });
            });
        },
        [rows],
    );

    const applyBulkPrices = useCallback(() => {
        if (bulkPrice === "") {
            return;
        }

        setVariantItems((current) => {
            const currentMap = new Map(
                current.map((item) => [variantKey(item.options), item]),
            );
            return rows.map((row) => {
                const key = variantKey(row.options);
                const saved = currentMap.get(key);

                return {
                    ...(saved ?? row),
                    price: bulkPrice,
                    compare_at_price:
                        bulkCompareAtPrice === "" ? null : bulkCompareAtPrice,
                };
            });
        });
    }, [bulkPrice, bulkCompareAtPrice, rows]);

    const applyBulkQuantity = useCallback(() => {
        if (bulkQuantity === "") {
            return;
        }

        setVariantItems((current) => {
            const currentMap = new Map(
                current.map((item) => [variantKey(item.options), item]),
            );
            return rows.map((row) => {
                const key = variantKey(row.options);
                const saved = currentMap.get(key);

                return {
                    ...(saved ?? row),
                    quantity: Number(bulkQuantity),
                };
            });
        });
    }, [bulkQuantity, rows]);

    const serializedItems = useMemo(
        () =>
            rows.map((row) => ({
                ...row,
                price: Number(row.price),
                compare_at_price:
                    row.compare_at_price == null || row.compare_at_price === ""
                        ? null
                        : Number(row.compare_at_price),
                sku: row.sku?.trim() || null,
                quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
            })),
        [rows],
    );

    const [showAllVariations, setShowAllVariations] = useState(false);

    const displayedRows = useMemo(
        () => (showAllVariations ? rows : rows.slice(0, 10)),
        [rows, showAllVariations],
    );

    return (
        <section className="space-y-4 rounded-lg border bg-background p-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">
                    Pricing and variations
                </h2>
                <p className="text-sm text-muted-foreground">
                    Choose standard single pricing or enable product variations
                    with single or custom pricing.
                </p>
            </div>

            <input type="hidden" name="pricing_mode" value={pricingMode} />
            <input
                type="hidden"
                name="variant_options_json"
                value={JSON.stringify(
                    pricingMode === "variants" ? variantOptions : [],
                )}
            />
            <input
                type="hidden"
                name="variant_price_options_json"
                value={JSON.stringify(
                    pricingMode === "variants"
                        ? variantPricingType === "single"
                            ? []
                            : activePriceOptionNames
                        : [],
                )}
            />
            <input
                type="hidden"
                name="variant_items_json"
                value={JSON.stringify(
                    pricingMode === "variants" ? serializedItems : [],
                )}
            />
            {pricingMode === "variants" ? (
                <>
                    <input type="hidden" name="price" value={minimumPrice} />
                    <input
                        type="hidden"
                        name="compare_at_price"
                        value={minimumCompareAtPrice}
                    />
                    <input type="hidden" name="sku" value="" />
                    <input
                        type="hidden"
                        name="quantity"
                        value={totalQuantity}
                    />
                </>
            ) : null}

            <div
                role="group"
                aria-label="Product pricing mode"
                className="inline-flex rounded-md border bg-muted/40 p-1"
            >
                <Button
                    type="button"
                    size="sm"
                    variant={pricingMode === "single" ? "default" : "ghost"}
                    aria-pressed={pricingMode === "single"}
                    onClick={() => setPricingMode("single")}
                >
                    Single price product
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={pricingMode === "variants" ? "default" : "ghost"}
                    aria-pressed={pricingMode === "variants"}
                    onClick={() => setPricingMode("variants")}
                >
                    Price by variation
                </Button>
            </div>

            {pricingMode === "single" ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Price" error={errors.price}>
                        <Input
                            type="number"
                            name="price"
                            min="0"
                            step="0.01"
                            value={singlePrice}
                            onChange={(event) =>
                                setSinglePrice(event.target.value)
                            }
                            required
                        />
                        <HelpText>
                            The one price shown for this product.
                        </HelpText>
                    </Field>
                    <Field
                        label="Compare-at price"
                        error={errors.compare_at_price}
                    >
                        <Input
                            type="number"
                            name="compare_at_price"
                            min="0"
                            step="0.01"
                            value={singleCompareAtPrice}
                            onChange={(event) =>
                                setSingleCompareAtPrice(event.target.value)
                            }
                        />
                        <HelpText>
                            Optional original price displayed beside the current
                            price.
                        </HelpText>
                    </Field>
                    <Field label="SKU" error={errors.sku}>
                        <Input
                            name="sku"
                            maxLength={255}
                            value={singleSku}
                            onChange={(event) =>
                                setSingleSku(event.target.value)
                            }
                        />
                        <HelpText>
                            One SKU for the product when it has no variations.
                        </HelpText>
                    </Field>
                    <Field label="Quantity" error={errors.quantity}>
                        <Input
                            type="number"
                            name="quantity"
                            min="0"
                            step="1"
                            value={singleQuantity}
                            onChange={(event) =>
                                setSingleQuantity(event.target.value)
                            }
                            required
                        />
                        <HelpText>
                            Total stock for this single-price product.
                        </HelpText>
                    </Field>
                    <Field label="Cost per item" error={errors.cost_per_item}>
                        <Input
                            type="number"
                            name="cost_per_item"
                            min="0"
                            step="0.01"
                            defaultValue={product?.cost_per_item ?? ""}
                        />
                    </Field>
                    <Field label="Currency" error={errors.currency}>
                        <Input
                            name="currency"
                            defaultValue={product?.currency ?? "PKR"}
                            maxLength={3}
                            required
                        />
                    </Field>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                        <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 size-4 shrink-0" />
                            <p>
                                Add option types such as Color or Size, then
                                enter values. You can select single price for
                                all variations or set custom prices for each.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {options.map((option, index) => (
                            <div
                                key={option.id}
                                className="grid gap-3 rounded-md border p-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] sm:items-end"
                            >
                                <Field label={`Option ${index + 1}`}>
                                    <Input
                                        value={option.name}
                                        maxLength={40}
                                        placeholder="Color"
                                        onChange={(event) =>
                                            updateOption(option.id, {
                                                name: event.target.value,
                                            })
                                        }
                                    />
                                    <HelpText>
                                        Name this choice, e.g. Size or Color.
                                    </HelpText>
                                </Field>
                                <Field label="Values">
                                    <div className="flex min-h-9 flex-wrap gap-1.5">
                                        {option.values.map((value) => (
                                            <span
                                                key={value}
                                                className="inline-flex items-center gap-1 rounded-md border bg-muted/40 py-1 pr-1 pl-2 text-xs font-medium"
                                            >
                                                {value}
                                                <button
                                                    type="button"
                                                    className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground"
                                                    aria-label={`Remove ${value} from ${option.name || "option"}`}
                                                    onClick={() =>
                                                        updateOption(
                                                            option.id,
                                                            {
                                                                values: option.values.filter(
                                                                    (item) =>
                                                                        item !==
                                                                        value,
                                                                ),
                                                            },
                                                        )
                                                    }
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={option.draftValue}
                                            maxLength={100}
                                            placeholder="Type a value and press Enter"
                                            onChange={(event) =>
                                                updateOption(option.id, {
                                                    draftValue:
                                                        event.target.value,
                                                })
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    addOptionValue(option.id);
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label={`Add value to ${option.name || "option"}`}
                                            title="Add value"
                                            disabled={!option.draftValue.trim()}
                                            onClick={() =>
                                                addOptionValue(option.id)
                                            }
                                        >
                                            <Check />
                                        </Button>
                                    </div>
                                    <HelpText>
                                        Values become variants only after
                                        confirmation.
                                    </HelpText>
                                </Field>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove option ${index + 1}`}
                                    title="Remove option"
                                    onClick={() =>
                                        setOptions((current) =>
                                            current.filter(
                                                (item) => item.id !== option.id,
                                            ),
                                        )
                                    }
                                >
                                    <Minus />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setOptions((current) => [
                                    ...current,
                                    {
                                        id:
                                            Math.max(
                                                0,
                                                ...current.map(
                                                    (item) => item.id,
                                                ),
                                            ) + 1,
                                        name: "",
                                        values: [],
                                        draftValue: "",
                                    },
                                ])
                            }
                        >
                            <Plus /> Add option
                        </Button>
                        <InputError message={errors.variant_options_json} />
                    </div>

                    {variantOptions.length > 0 && (
                        <div className="space-y-4 rounded-md border p-4 bg-muted/10">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold">
                                    Variation pricing structure
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Choose whether all variations share a single
                                    price or have different prices.
                                </p>
                            </div>
                            <div
                                role="group"
                                aria-label="Variation pricing structure"
                                className="inline-flex rounded-md border bg-muted/40 p-1"
                            >
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        variantPricingType === "single"
                                            ? "default"
                                            : "ghost"
                                    }
                                    aria-pressed={
                                        variantPricingType === "single"
                                    }
                                    onClick={() =>
                                        handleVariantPricingTypeChange("single")
                                    }
                                >
                                    Single price for all variations
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        variantPricingType === "different"
                                            ? "default"
                                            : "ghost"
                                    }
                                    aria-pressed={
                                        variantPricingType === "different"
                                    }
                                    onClick={() =>
                                        handleVariantPricingTypeChange(
                                            "different",
                                        )
                                    }
                                >
                                    Different price for variations
                                </Button>
                            </div>

                            {variantPricingType === "single" && (
                                <div className="grid gap-5 sm:grid-cols-2 pt-2">
                                    <Field
                                        label="Single variation price"
                                        error={errors.price}
                                    >
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variantSinglePrice}
                                            onChange={(event) => {
                                                const val = event.target.value;
                                                setVariantSinglePrice(val);
                                                updateAllRowsPrice(
                                                    val,
                                                    variantSingleCompareAtPrice,
                                                );
                                            }}
                                            required
                                            placeholder="0.00"
                                        />
                                        <HelpText>
                                            This price is applied to all
                                            variation combinations.
                                        </HelpText>
                                    </Field>
                                    <Field
                                        label="Compare-at price (optional)"
                                        error={errors.compare_at_price}
                                    >
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variantSingleCompareAtPrice}
                                            onChange={(event) => {
                                                const val = event.target.value;
                                                setVariantSingleCompareAtPrice(
                                                    val,
                                                );
                                                updateAllRowsPrice(
                                                    variantSinglePrice,
                                                    val,
                                                );
                                            }}
                                            placeholder="Optional"
                                        />
                                        <HelpText>
                                            Optional original price shown beside
                                            the single variation price.
                                        </HelpText>
                                    </Field>
                                </div>
                            )}

                            {variantPricingType === "different" && (
                                <fieldset className="space-y-2 pt-2">
                                    <legend className="text-xs font-medium text-muted-foreground uppercase">
                                        Price varies by option:
                                    </legend>
                                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                                        {variantOptions.map((option) => (
                                            <label
                                                key={option.name}
                                                className="inline-flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={activePriceOptionNames.includes(
                                                        option.name,
                                                    )}
                                                    onChange={(event) => {
                                                        const next = event
                                                            .target.checked
                                                            ? [
                                                                  ...activePriceOptionNames,
                                                                  option.name,
                                                              ]
                                                            : activePriceOptionNames.filter(
                                                                  (name) =>
                                                                      name !==
                                                                      option.name,
                                                              );
                                                        setPriceOptionNames(
                                                            next,
                                                        );
                                                    }}
                                                    className="size-4 accent-primary"
                                                />
                                                {option.name}
                                            </label>
                                        ))}
                                    </div>
                                    <HelpText>
                                        Select options that change the price.
                                        Check all options to edit custom prices
                                        for each variation.
                                    </HelpText>
                                    <InputError
                                        message={
                                            errors.variant_price_options_json
                                        }
                                    />
                                </fieldset>
                            )}
                        </div>
                    )}

                    {rows.length > 0 ? (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h3 className="text-sm font-semibold">
                                    {variantPricingType === "different"
                                        ? `${priceGroups.length} price group${priceGroups.length === 1 ? "" : "s"}`
                                        : "All variations (Single price)"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Starting price {minimumPrice};{" "}
                                    {totalQuantity} units across {rows.length}{" "}
                                    variations.
                                </p>
                            </div>

                            {variantPricingType === "different" && (
                                <>
                                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                        <Field label="Set price for all variations">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={bulkPrice}
                                                onChange={(event) =>
                                                    setBulkPrice(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Enter price"
                                            />
                                        </Field>
                                        <Field label="Compare-at price (optional)">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={bulkCompareAtPrice}
                                                onChange={(event) =>
                                                    setBulkCompareAtPrice(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Enter compare-at price"
                                            />
                                        </Field>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!bulkPrice}
                                            onClick={applyBulkPrices}
                                        >
                                            Apply prices
                                        </Button>
                                    </div>

                                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                        <Field label="Set quantity for all variations">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={bulkQuantity}
                                                onChange={(event) =>
                                                    setBulkQuantity(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Enter quantity"
                                            />
                                        </Field>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={bulkQuantity === ""}
                                            onClick={applyBulkQuantity}
                                        >
                                            Apply quantity
                                        </Button>
                                    </div>
                                </>
                            )}

                            <div className="space-y-5">
                                {variantPricingType === "different" &&
                                    priceGroups.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-medium uppercase text-muted-foreground">
                                                Group pricing
                                            </h4>
                                            <div className="overflow-x-auto rounded-md border">
                                                <table className="w-full min-w-[520px] text-left text-sm">
                                                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                                                        <tr>
                                                            <th className="px-3 py-2">
                                                                Applies to
                                                            </th>
                                                            <th className="w-36 px-2 py-2">
                                                                Price
                                                            </th>
                                                            <th className="w-36 px-2 py-2">
                                                                Compare-at
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {priceGroups.map(
                                                            (group) => (
                                                                <GroupPriceRow
                                                                    key={
                                                                        group.key
                                                                    }
                                                                    group={
                                                                        group
                                                                    }
                                                                    updatePriceGroup={
                                                                        updatePriceGroup
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <HelpText>
                                                Changing a group price updates
                                                every combination in that group.
                                            </HelpText>
                                        </div>
                                    )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-medium uppercase text-muted-foreground">
                                            Variations detail ({rows.length}{" "}
                                            total)
                                        </h4>
                                        {rows.length > 10 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setShowAllVariations(
                                                        (prev) => !prev,
                                                    )
                                                }
                                            >
                                                {showAllVariations
                                                    ? `Show 10 of ${rows.length}`
                                                    : `Show all ${rows.length} variations`}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full min-w-[580px] text-left text-sm">
                                            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2">
                                                        Variation
                                                    </th>
                                                    {variantPricingType ===
                                                        "different" && (
                                                        <>
                                                            <th className="w-32 px-2 py-2">
                                                                Price
                                                            </th>
                                                            <th className="w-32 px-2 py-2">
                                                                Compare-at
                                                            </th>
                                                        </>
                                                    )}
                                                    {variantPricingType ===
                                                        "single" && (
                                                        <th className="w-36 px-2 py-2">
                                                            Price
                                                        </th>
                                                    )}
                                                    <th className="w-36 px-2 py-2">
                                                        SKU
                                                    </th>
                                                    <th className="w-28 px-2 py-2">
                                                        Quantity
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {displayedRows.map((row) => (
                                                    <VariantRow
                                                        key={variantKey(
                                                            row.options,
                                                        )}
                                                        row={row}
                                                        variantPricingType={
                                                            variantPricingType
                                                        }
                                                        currency={
                                                            product?.currency ??
                                                            "PKR"
                                                        }
                                                        updateVariant={
                                                            updateVariant
                                                        }
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <InputError
                                        message={errors.variant_items_json}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
                            Add an option and at least one value to build your
                            variations.
                        </p>
                    )}

                    <Field label="Cost per item" error={errors.cost_per_item}>
                        <Input
                            type="number"
                            name="cost_per_item"
                            min="0"
                            step="0.01"
                            defaultValue={product?.cost_per_item ?? ""}
                        />
                    </Field>
                    <Field label="Currency" error={errors.currency}>
                        <Input
                            name="currency"
                            defaultValue={product?.currency ?? "PKR"}
                            maxLength={3}
                            required
                        />
                    </Field>
                </div>
            )}
            <InputError message={errors.pricing_mode} />
        </section>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function HelpText({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-muted-foreground">{children}</p>;
}

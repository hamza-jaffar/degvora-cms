import GalleryImagePicker, {
    type GalleryImage,
} from "@/components/gallery-image-picker";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsLayout from "@/layouts/settings/layout";
import settingRoutes from "@/routes/admin/setting";
import { Head, router, useForm } from "@inertiajs/react";
import {
    countries,
    getCountryDataList,
    getEmojiFlag,
    type ICountryData,
    type TCountryCode,
    type TCurrencyCode,
} from "countries-list";
import { currencies } from "countries-list/currencies";
import {
    Building2,
    Check,
    Globe2,
    LoaderCircle,
    Save,
    Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type MediaFilter = "all" | "image" | "video" | "other";
type PickerCounts = Record<MediaFilter, number>;

interface CountryOption {
    value: string;
    label: string;
    description: string;
    searchText: string;
    flag: string;
}

interface CurrencyOption {
    value: string;
    label: string;
    description: string;
    searchText: string;
}

interface SearchableOption {
    value: string;
    label: string;
    description?: string;
    searchText?: string;
    flag?: string;
}

interface SearchableSelectProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    options: SearchableOption[];
    error?: string;
    onChange: (value: string) => void;
}

interface PageProps {
    activeTab: string | null;
    settings: {
        name: string;
        tagline: string;
        email: string;
        phone: string;
        location: string;
        country: string;
        currency: string;
        currency_code: string;
        timezone: string;
        locale: string;
        posts_per_page: string;
        meta_title: string;
        meta_description: string;
        meta_keywords: string;
        google_analytics_id: string;
        google_tag_manager_id: string;
        meta_pixel_id: string;
        google_site_verification: string;
        social_facebook: string;
        social_instagram: string;
        social_youtube: string;
        social_x: string;
        social_linkedin: string;
        social_tiktok: string;
        footer_text: string;
        mail_mailer: string;
        mail_host: string;
        mail_port: string;
        mail_encryption: string;
        mail_username: string;
        mail_from_name: string;
        mail_from_address: string;
    };
    logoUrl: string | null;
    faviconUrl: string | null;
    seoImageUrl: string | null;
    logoImage: GalleryImage | null;
    faviconImage: GalleryImage | null;
    seoImage: GalleryImage | null;
    mailPasswordConfigured: boolean;
    timezones: string[];
    media: { data: GalleryImage[] };
    counts: PickerCounts;
    filter: MediaFilter;
    search: string;
    filterUrl: string;
}

const settingsSections = [
    {
        id: "identity",
        label: "Identity",
        fields: ["name", "tagline", "logo_path", "favicon_path"],
    },
    {
        id: "contact",
        label: "Contact & region",
        fields: [
            "email",
            "phone",
            "location",
            "country",
            "currency",
            "currency_code",
            "timezone",
            "locale",
            "posts_per_page",
        ],
    },
    {
        id: "seo",
        label: "SEO",
        fields: [
            "meta_title",
            "meta_description",
            "meta_keywords",
            "seo_image_path",
        ],
    },
    {
        id: "social",
        label: "Social",
        fields: [
            "social_facebook",
            "social_instagram",
            "social_youtube",
            "social_x",
            "social_linkedin",
            "social_tiktok",
        ],
    },
    {
        id: "mail",
        label: "Email delivery",
        fields: [
            "mail_mailer",
            "mail_host",
            "mail_port",
            "mail_encryption",
            "mail_username",
            "mail_password",
            "mail_password_clear",
            "mail_from_name",
            "mail_from_address",
        ],
    },
    {
        id: "integrations",
        label: "Analytics",
        fields: [
            "google_analytics_id",
            "google_tag_manager_id",
            "meta_pixel_id",
            "google_site_verification",
        ],
    },
    { id: "footer", label: "Footer", fields: ["footer_text"] },
] as const;

type SettingsSection = (typeof settingsSections)[number]["id"];

const countryDataList = getCountryDataList();

const countryOptions: CountryOption[] = countryDataList
    .map((country: ICountryData) => ({
        value: country.iso2,
        label: country.name,
        description: country.phone[0] ? `+${country.phone[0]}` : "",
        searchText: [
            country.iso2,
            country.iso3,
            country.native,
            country.currency.join(" "),
            country.phone.join(" "),
        ].join(" "),
        flag: getEmojiFlag(country.iso2),
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

const phonePrefixes = [
    ...new Set(countryDataList.flatMap((country) => country.phone.map(String))),
].sort((first, second) => second.length - first.length);

const currencyOptions: CurrencyOption[] = Object.entries(currencies)
    .filter(([, currency]) => !currency.withdrawn)
    .map(([code, currency]) => ({
        value: code,
        label: currency.name,
        description: `${code} · ${currency.symbol}`,
        searchText: `${code} ${currency.name} ${currency.native} ${currency.symbol}`,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

function findPhonePrefix(phone: string): string | null {
    const phoneDigits = phone.match(/^\+(\d+)/)?.[1];
    const prefix = phoneDigits
        ? phonePrefixes.find((candidate) => phoneDigits.startsWith(candidate))
        : undefined;

    return prefix ? `+${prefix}` : null;
}

function SearchableSelect({
    id,
    label,
    placeholder,
    value,
    options,
    error,
    onChange,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const pickerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((option) => option.value === value);
    const matchingOptions = options.filter((option) =>
        `${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
    );

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            return;
        }

        searchRef.current?.focus();

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", closeOnOutsideClick);

        return () =>
            document.removeEventListener("mousedown", closeOnOutsideClick);
    }, [isOpen]);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div ref={pickerRef} className="relative">
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-options`}
                    aria-invalid={Boolean(error)}
                    className="w-full justify-between font-normal"
                    onClick={() => setIsOpen((open) => !open)}
                >
                    {selectedOption ? (
                        <span className="flex min-w-0 items-center gap-2 truncate">
                            {selectedOption.flag && (
                                <span aria-hidden="true">
                                    {selectedOption.flag}
                                </span>
                            )}
                            <span className="truncate">
                                {selectedOption.label}
                            </span>
                            {selectedOption.description && (
                                <span className="text-muted-foreground">
                                    {selectedOption.description}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                </Button>
                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setIsOpen(false);
                                    }
                                }}
                                placeholder={`Search ${label.toLowerCase()}...`}
                                aria-label={`Search ${label.toLowerCase()}`}
                                className="pl-8"
                            />
                        </div>
                        <div
                            id={`${id}-options`}
                            role="listbox"
                            aria-label={label}
                            className="mt-2 max-h-60 overflow-y-auto"
                        >
                            {matchingOptions.length > 0 ? (
                                matchingOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={option.value === value}
                                        className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            {option.flag && (
                                                <span aria-hidden="true">
                                                    {option.flag}
                                                </span>
                                            )}
                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                            {option.description && (
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </span>
                                        {option.value === value && (
                                            <Check className="size-4 shrink-0" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="px-2 py-3 text-sm text-muted-foreground">
                                    No matching options found.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

interface ImageSettingProps {
    id: string;
    label: string;
    description: string;
    currentUrl: string | null;
    selectedImage: GalleryImage | null;
    error?: string;
    media: { data: GalleryImage[] };
    counts: PickerCounts;
    filter: MediaFilter;
    search: string;
    filterUrl: string;
    onSelect: (image: GalleryImage) => void;
}

function ImageSetting({
    id,
    label,
    description,
    currentUrl,
    selectedImage,
    error,
    media,
    counts,
    filter,
    search,
    filterUrl,
    onSelect,
}: ImageSettingProps) {
    const previewUrl = selectedImage?.url ?? currentUrl;

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor={id}>{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-col gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={`${label} preview`}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <Building2 className="size-7 text-muted-foreground" />
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <GalleryImagePicker
                        id={id}
                        media={media}
                        counts={counts}
                        filter={filter}
                        search={search}
                        filterUrl={filterUrl}
                        selectedImage={selectedImage}
                        onSelect={onSelect}
                    />
                    <p className="text-xs text-muted-foreground">
                        {selectedImage
                            ? `Selected: ${selectedImage.name}`
                            : currentUrl
                              ? "Current image is saved. Select another image to replace it."
                              : "Choose an image from your media library."}
                    </p>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SiteSettings({
    activeTab,
    settings,
    logoUrl,
    faviconUrl,
    seoImageUrl,
    logoImage,
    faviconImage,
    seoImage,
    mailPasswordConfigured,
    timezones,
    media,
    counts,
    filter,
    search,
    filterUrl,
}: PageProps) {
    const [selectedLogo, setSelectedLogo] = useState<GalleryImage | null>(
        logoImage,
    );
    const [selectedFavicon, setSelectedFavicon] = useState<GalleryImage | null>(
        faviconImage,
    );
    const [selectedSeoImage, setSelectedSeoImage] =
        useState<GalleryImage | null>(seoImage);
    const [testEmail, setTestEmail] = useState(settings.mail_from_address);
    const [testingMail, setTestingMail] = useState(false);
    const [mailTestError, setMailTestError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<SettingsSection>(
        () =>
            settingsSections.find((section) => section.id === activeTab)?.id ??
            "identity",
    );

    useEffect(() => {
        const url = new URL(window.location.href);

        if (url.searchParams.get("active_tab") === activeSection) {
            return;
        }

        url.searchParams.set("active_tab", activeSection);
        window.history.replaceState(window.history.state, "", url);
    }, [activeSection]);

    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        tagline: string;
        email: string;
        phone: string;
        location: string;
        country: string;
        currency: string;
        currency_code: string;
        timezone: string;
        locale: string;
        posts_per_page: string;
        meta_title: string;
        meta_description: string;
        meta_keywords: string;
        seo_image_path: string | null;
        google_analytics_id: string;
        google_tag_manager_id: string;
        meta_pixel_id: string;
        google_site_verification: string;
        social_facebook: string;
        social_instagram: string;
        social_youtube: string;
        social_x: string;
        social_linkedin: string;
        social_tiktok: string;
        footer_text: string;
        mail_mailer: string;
        mail_host: string;
        mail_port: string;
        mail_encryption: string;
        mail_username: string;
        mail_password: string;
        mail_password_clear: boolean;
        mail_from_name: string;
        mail_from_address: string;
        logo_path: string | null;
        favicon_path: string | null;
    }>({
        ...settings,
        country: settings.country.toUpperCase(),
        currency_code: settings.currency_code.toUpperCase(),
        posts_per_page: settings.posts_per_page || "10",
        mail_password: "",
        mail_password_clear: false,
        seo_image_path: null,
        logo_path: null,
        favicon_path: null,
    });

    const selectedCountry = useMemo(
        () => countries[data.country as TCountryCode],
        [data.country],
    );

    const setCountry = (countryCode: string) => {
        setData("country", countryCode);

        if (!countryCode) {
            return;
        }

        const country = countries[countryCode as TCountryCode];

        if (!country) {
            return;
        }

        const nextDialCode = country.phone[0] ? `+${country.phone[0]}` : "";
        const currentPhone = data.phone.trim();
        const previousDialCode = selectedCountry?.phone[0]
            ? `+${selectedCountry.phone[0]}`
            : findPhonePrefix(currentPhone);

        if (nextDialCode) {
            let phoneNumber = currentPhone;

            if (!currentPhone) {
                phoneNumber = `${nextDialCode} `;
            } else if (
                previousDialCode &&
                currentPhone.startsWith(previousDialCode)
            ) {
                const nationalNumber = currentPhone
                    .slice(previousDialCode.length)
                    .trim();
                phoneNumber = nationalNumber
                    ? `${nextDialCode} ${nationalNumber}`
                    : `${nextDialCode} `;
            } else if (!currentPhone.startsWith("+")) {
                phoneNumber = `${nextDialCode} ${currentPhone}`;
            }

            setData("phone", phoneNumber);
        }

        const currencyCode = country.currency[0];
        const currency = currencyCode
            ? currencies[currencyCode as TCurrencyCode]
            : null;

        if (currency && !currency.withdrawn) {
            setData("currency", currency.name);
            setData("currency_code", currencyCode);
        }
    };

    const selectCurrency = (currencyCode: string) => {
        const currency = currencies[currencyCode as TCurrencyCode];

        if (!currency) {
            return;
        }

        setData("currency", currency.name);
        setData("currency_code", currencyCode);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(settingRoutes.update.url(), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Site settings updated successfully.");
                reset(
                    "logo_path",
                    "favicon_path",
                    "seo_image_path",
                    "mail_password",
                    "mail_password_clear",
                );
            },
            onError: (formErrors) => {
                const firstErrorField = Object.keys(formErrors)[0];
                const errorSection = settingsSections.find((section) =>
                    section.fields.some((field) => field === firstErrorField),
                );

                if (errorSection) {
                    setActiveSection(errorSection.id);
                }

                toast.error(
                    Object.values(formErrors).find(Boolean) ??
                        "Unable to update site settings.",
                );
            },
        });
    };

    const sendTestEmail = () => {
        setMailTestError(null);
        setTestingMail(true);
        router.post(
            settingRoutes.mailTest.url(),
            { email: testEmail },
            {
                onSuccess: () => toast.success("Test email sent successfully."),
                onError: (formErrors) => {
                    const message =
                        Object.values(formErrors).find(Boolean) ??
                        "Unable to send the test email.";
                    setMailTestError(message);
                    toast.error(message);
                },
                onFinish: () => setTestingMail(false),
            },
        );
    };

    return (
        <SettingsLayout>
            <Head title="Site settings" />

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                        <Globe2 className="size-5 text-primary" />
                        Complete site settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Configure your site identity, SEO, delivery, and public
                        integrations.
                    </p>
                </div>

                <div
                    role="tablist"
                    aria-label="Site settings categories"
                    className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1"
                    onKeyDown={(event) => {
                        const currentIndex = settingsSections.findIndex(
                            (section) => section.id === activeSection,
                        );
                        let nextIndex = currentIndex;

                        if (event.key === "ArrowRight") {
                            nextIndex =
                                (currentIndex + 1) % settingsSections.length;
                        } else if (event.key === "ArrowLeft") {
                            nextIndex =
                                (currentIndex - 1 + settingsSections.length) %
                                settingsSections.length;
                        } else if (event.key === "Home") {
                            nextIndex = 0;
                        } else if (event.key === "End") {
                            nextIndex = settingsSections.length - 1;
                        } else {
                            return;
                        }

                        event.preventDefault();
                        const nextSection = settingsSections[nextIndex];
                        setActiveSection(nextSection.id);
                        document
                            .getElementById(`settings-tab-${nextSection.id}`)
                            ?.focus();
                    }}
                >
                    {settingsSections.map((section) => (
                        <button
                            key={section.id}
                            id={`settings-tab-${section.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeSection === section.id}
                            aria-controls={`settings-panel-${section.id}`}
                            tabIndex={activeSection === section.id ? 0 : -1}
                            className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                                activeSection === section.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>

                <Card
                    id="settings-panel-identity"
                    role="tabpanel"
                    aria-labelledby="settings-tab-identity"
                    tabIndex={0}
                    hidden={activeSection !== "identity"}
                >
                    <CardHeader>
                        <CardTitle>Site identity</CardTitle>
                        <CardDescription>
                            Choose the name and images displayed across your
                            website.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Site name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                autoComplete="organization"
                                aria-invalid={Boolean(errors.name)}
                                onChange={(event) =>
                                    setData("name", event.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tagline">Site tagline</Label>
                            <Input
                                id="tagline"
                                value={data.tagline}
                                placeholder="A short description of your website"
                                aria-invalid={Boolean(errors.tagline)}
                                onChange={(event) =>
                                    setData("tagline", event.target.value)
                                }
                            />
                            {errors.tagline && (
                                <p className="text-sm text-destructive">
                                    {errors.tagline}
                                </p>
                            )}
                        </div>

                        <ImageSetting
                            id="logo"
                            label="Logo"
                            description="Choose an image from the existing media library."
                            currentUrl={logoUrl}
                            selectedImage={selectedLogo}
                            error={errors.logo_path}
                            media={media}
                            counts={counts}
                            filter={filter}
                            search={search}
                            filterUrl={filterUrl}
                            onSelect={(image) => {
                                setSelectedLogo(image);
                                setData("logo_path", image.path);
                            }}
                        />

                        <ImageSetting
                            id="favicon"
                            label="Favicon"
                            description="Choose an image from the existing media library."
                            currentUrl={faviconUrl}
                            selectedImage={selectedFavicon}
                            error={errors.favicon_path}
                            media={media}
                            counts={counts}
                            filter={filter}
                            search={search}
                            filterUrl={filterUrl}
                            onSelect={(image) => {
                                setSelectedFavicon(image);
                                setData("favicon_path", image.path);
                            }}
                        />
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-contact"
                    role="tabpanel"
                    aria-labelledby="settings-tab-contact"
                    tabIndex={0}
                    hidden={activeSection !== "contact"}
                >
                    <CardHeader>
                        <CardTitle>Contact and regional details</CardTitle>
                        <CardDescription>
                            Choose your country to set its calling code and
                            default currency, then adjust those values if
                            needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                autoComplete="email"
                                aria-invalid={Boolean(errors.email)}
                                onChange={(event) =>
                                    setData("email", event.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the working email. This will be the one
                                showing in frontend.
                            </p>
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                autoComplete="tel"
                                aria-invalid={Boolean(errors.phone)}
                                placeholder={
                                    selectedCountry?.phone[0]
                                        ? `+${selectedCountry.phone[0]} Phone number`
                                        : "Phone number"
                                }
                                onChange={(event) =>
                                    setData("phone", event.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                The selected country automatically supplies the
                                calling code.
                            </p>
                            {errors.phone && (
                                <p className="text-sm text-destructive">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        <SearchableSelect
                            id="country"
                            label="Country"
                            placeholder="Select a country"
                            value={data.country}
                            options={countryOptions}
                            error={errors.country}
                            onChange={setCountry}
                        />

                        <SearchableSelect
                            id="currency"
                            label="Currency"
                            placeholder="Select a currency"
                            value={data.currency_code}
                            options={currencyOptions}
                            error={errors.currency ?? errors.currency_code}
                            onChange={selectCurrency}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="currency_code">Currency code</Label>
                            <Input
                                id="currency_code"
                                value={data.currency_code}
                                aria-invalid={Boolean(errors.currency_code)}
                                readOnly
                            />
                            <p className="text-xs text-muted-foreground">
                                Automatically filled from the selected currency.
                            </p>
                            {errors.currency_code && (
                                <p className="text-sm text-destructive">
                                    {errors.currency_code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="posts_per_page">
                                Items per page
                            </Label>
                            <Input
                                id="posts_per_page"
                                type="number"
                                min={1}
                                max={100}
                                value={data.posts_per_page}
                                aria-invalid={Boolean(errors.posts_per_page)}
                                onChange={(event) =>
                                    setData(
                                        "posts_per_page",
                                        event.target.value,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Default pagination size for content lists.
                            </p>
                            {errors.posts_per_page && (
                                <p className="text-sm text-destructive">
                                    {errors.posts_per_page}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="location">Location</Label>
                            <textarea
                                id="location"
                                value={data.location}
                                autoComplete="street-address"
                                aria-invalid={Boolean(errors.location)}
                                rows={2}
                                placeholder="City, region, or business address"
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                                onChange={(event) =>
                                    setData("location", event.target.value)
                                }
                            />
                            {errors.location && (
                                <p className="text-sm text-destructive">
                                    {errors.location}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-seo"
                    role="tabpanel"
                    aria-labelledby="settings-tab-seo"
                    tabIndex={0}
                    hidden={activeSection !== "seo"}
                >
                    <CardHeader>
                        <CardTitle>Search engine defaults</CardTitle>
                        <CardDescription>
                            Default metadata is used on public pages when a page
                            does not define its own SEO values.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="meta_title">
                                Default meta title
                            </Label>
                            <Input
                                id="meta_title"
                                value={data.meta_title}
                                maxLength={255}
                                placeholder="Your site name and main topic"
                                aria-invalid={Boolean(errors.meta_title)}
                                onChange={(event) =>
                                    setData("meta_title", event.target.value)
                                }
                            />
                            {errors.meta_title && (
                                <p className="text-sm text-destructive">
                                    {errors.meta_title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="meta_description">
                                Default meta description
                            </Label>
                            <textarea
                                id="meta_description"
                                rows={3}
                                maxLength={500}
                                value={data.meta_description}
                                placeholder="Describe your website for search results"
                                aria-invalid={Boolean(errors.meta_description)}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                                onChange={(event) =>
                                    setData(
                                        "meta_description",
                                        event.target.value,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {data.meta_description.length}/500 characters
                            </p>
                            {errors.meta_description && (
                                <p className="text-sm text-destructive">
                                    {errors.meta_description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="meta_keywords">
                                Default keywords
                            </Label>
                            <Input
                                id="meta_keywords"
                                value={data.meta_keywords}
                                maxLength={500}
                                placeholder="cms, products, services"
                                aria-invalid={Boolean(errors.meta_keywords)}
                                onChange={(event) =>
                                    setData("meta_keywords", event.target.value)
                                }
                            />
                            {errors.meta_keywords && (
                                <p className="text-sm text-destructive">
                                    {errors.meta_keywords}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="seo-image-picker">
                                Social sharing image
                            </Label>
                            <input
                                type="hidden"
                                value={data.seo_image_path ?? ""}
                            />
                            <ImageSetting
                                id="seo-image-picker"
                                label="Open Graph image"
                                description="Used when sharing public page links if the page has no featured image."
                                currentUrl={seoImageUrl}
                                selectedImage={selectedSeoImage}
                                error={errors.seo_image_path}
                                media={media}
                                counts={counts}
                                filter={filter}
                                search={search}
                                filterUrl={filterUrl}
                                onSelect={(image) => {
                                    setSelectedSeoImage(image);
                                    setData("seo_image_path", image.path);
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-social"
                    role="tabpanel"
                    aria-labelledby="settings-tab-social"
                    tabIndex={0}
                    hidden={activeSection !== "social"}
                >
                    <CardHeader>
                        <CardTitle>Social profiles</CardTitle>
                        <CardDescription>
                            Add public social profile links for your theme to
                            display.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        {(
                            [
                                ["social_facebook", "Facebook"],
                                ["social_instagram", "Instagram"],
                                ["social_youtube", "YouTube"],
                                ["social_x", "X"],
                                ["social_linkedin", "LinkedIn"],
                                ["social_tiktok", "TikTok"],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={key}>{label} URL</Label>
                                <Input
                                    id={key}
                                    type="url"
                                    value={data[key]}
                                    placeholder={`https://${label.toLowerCase()}.com/...`}
                                    aria-invalid={Boolean(errors[key])}
                                    onChange={(event) =>
                                        setData(key, event.target.value)
                                    }
                                />
                                {errors[key] && (
                                    <p className="text-sm text-destructive">
                                        {errors[key]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-mail"
                    role="tabpanel"
                    aria-labelledby="settings-tab-mail"
                    tabIndex={0}
                    hidden={activeSection !== "mail"}
                >
                    <CardHeader>
                        <CardTitle>Email delivery</CardTitle>
                        <CardDescription>
                            Configure outgoing email. SMTP passwords are
                            encrypted in storage and never returned to this
                            page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mail_mailer">Mail driver</Label>
                                <select
                                    id="mail_mailer"
                                    value={data.mail_mailer}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                                    onChange={(event) =>
                                        setData(
                                            "mail_mailer",
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="smtp">SMTP server</option>
                                    <option value="log">
                                        Log (development only)
                                    </option>
                                </select>
                                {errors.mail_mailer && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_mailer}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_encryption">
                                    Connection encryption
                                </Label>
                                <select
                                    id="mail_encryption"
                                    value={data.mail_encryption}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    onChange={(event) =>
                                        setData(
                                            "mail_encryption",
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="tls">STARTTLS / TLS</option>
                                    <option value="ssl">
                                        Implicit TLS / SSL
                                    </option>
                                    <option value="none">No encryption</option>
                                </select>
                                {errors.mail_encryption && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_encryption}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_host">SMTP host</Label>
                                <Input
                                    id="mail_host"
                                    value={data.mail_host}
                                    placeholder="smtp.example.com"
                                    disabled={data.mail_mailer !== "smtp"}
                                    aria-invalid={Boolean(errors.mail_host)}
                                    onChange={(event) =>
                                        setData("mail_host", event.target.value)
                                    }
                                />
                                {errors.mail_host && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_host}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_port">SMTP port</Label>
                                <Input
                                    id="mail_port"
                                    type="number"
                                    min={1}
                                    max={65535}
                                    value={data.mail_port}
                                    disabled={data.mail_mailer !== "smtp"}
                                    aria-invalid={Boolean(errors.mail_port)}
                                    onChange={(event) =>
                                        setData("mail_port", event.target.value)
                                    }
                                />
                                {errors.mail_port && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_port}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_username">
                                    SMTP username
                                </Label>
                                <Input
                                    id="mail_username"
                                    autoComplete="username"
                                    value={data.mail_username}
                                    disabled={data.mail_mailer !== "smtp"}
                                    aria-invalid={Boolean(errors.mail_username)}
                                    onChange={(event) =>
                                        setData(
                                            "mail_username",
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.mail_username && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_username}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_password">
                                    SMTP password
                                </Label>
                                <Input
                                    id="mail_password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.mail_password}
                                    disabled={data.mail_mailer !== "smtp"}
                                    placeholder={
                                        mailPasswordConfigured
                                            ? "Saved password is hidden"
                                            : "Enter SMTP password"
                                    }
                                    aria-invalid={Boolean(errors.mail_password)}
                                    onChange={(event) => {
                                        setData(
                                            "mail_password",
                                            event.target.value,
                                        );
                                        if (event.target.value) {
                                            setData(
                                                "mail_password_clear",
                                                false,
                                            );
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {mailPasswordConfigured
                                        ? "Leave blank to keep the saved password."
                                        : "Optional for SMTP servers without authentication."}
                                </p>
                                {errors.mail_password && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_from_name">
                                    Sender name
                                </Label>
                                <Input
                                    id="mail_from_name"
                                    value={data.mail_from_name}
                                    aria-invalid={Boolean(
                                        errors.mail_from_name,
                                    )}
                                    onChange={(event) =>
                                        setData(
                                            "mail_from_name",
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.mail_from_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_from_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_from_address">
                                    Sender email
                                </Label>
                                <Input
                                    id="mail_from_address"
                                    type="email"
                                    value={data.mail_from_address}
                                    aria-invalid={Boolean(
                                        errors.mail_from_address,
                                    )}
                                    onChange={(event) =>
                                        setData(
                                            "mail_from_address",
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.mail_from_address && (
                                    <p className="text-sm text-destructive">
                                        {errors.mail_from_address}
                                    </p>
                                )}
                            </div>
                        </div>

                        {mailPasswordConfigured && (
                            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.mail_password_clear}
                                    onChange={(event) =>
                                        setData(
                                            "mail_password_clear",
                                            event.target.checked,
                                        )
                                    }
                                />
                                <span>Remove the saved SMTP password</span>
                            </label>
                        )}

                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <div>
                                <p className="font-medium">Send a test email</p>
                                <p className="text-sm text-muted-foreground">
                                    Save your mail settings first, then verify
                                    delivery to an inbox you control.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    type="email"
                                    value={testEmail}
                                    placeholder="recipient@example.com"
                                    aria-label="Test email recipient"
                                    onChange={(event) =>
                                        setTestEmail(event.target.value)
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        testingMail ||
                                        processing ||
                                        !testEmail.trim()
                                    }
                                    onClick={sendTestEmail}
                                >
                                    {testingMail && (
                                        <LoaderCircle className="animate-spin" />
                                    )}
                                    Send test
                                </Button>
                            </div>
                            {mailTestError && (
                                <p className="text-sm text-destructive">
                                    {mailTestError}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-integrations"
                    role="tabpanel"
                    aria-labelledby="settings-tab-integrations"
                    tabIndex={0}
                    hidden={activeSection !== "integrations"}
                >
                    <CardHeader>
                        <CardTitle>Analytics and verification</CardTitle>
                        <CardDescription>
                            Add provider identifiers for public pages. The
                            built-in page template outputs these safely, and
                            active themes can use the shared site settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="google_analytics_id">
                                Google Analytics 4 ID
                            </Label>
                            <Input
                                id="google_analytics_id"
                                value={data.google_analytics_id}
                                placeholder="G-XXXXXXXXXX"
                                aria-invalid={Boolean(
                                    errors.google_analytics_id,
                                )}
                                onChange={(event) =>
                                    setData(
                                        "google_analytics_id",
                                        event.target.value.toUpperCase(),
                                    )
                                }
                            />
                            {errors.google_analytics_id && (
                                <p className="text-sm text-destructive">
                                    {errors.google_analytics_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="google_tag_manager_id">
                                Google Tag Manager ID
                            </Label>
                            <Input
                                id="google_tag_manager_id"
                                value={data.google_tag_manager_id}
                                placeholder="GTM-XXXXXXX"
                                aria-invalid={Boolean(
                                    errors.google_tag_manager_id,
                                )}
                                onChange={(event) =>
                                    setData(
                                        "google_tag_manager_id",
                                        event.target.value.toUpperCase(),
                                    )
                                }
                            />
                            {errors.google_tag_manager_id && (
                                <p className="text-sm text-destructive">
                                    {errors.google_tag_manager_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                            <Input
                                id="meta_pixel_id"
                                value={data.meta_pixel_id}
                                placeholder="123456789012345"
                                aria-invalid={Boolean(errors.meta_pixel_id)}
                                onChange={(event) =>
                                    setData("meta_pixel_id", event.target.value)
                                }
                            />
                            {errors.meta_pixel_id && (
                                <p className="text-sm text-destructive">
                                    {errors.meta_pixel_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="google_site_verification">
                                Search Console verification token
                            </Label>
                            <Input
                                id="google_site_verification"
                                value={data.google_site_verification}
                                aria-invalid={Boolean(
                                    errors.google_site_verification,
                                )}
                                onChange={(event) =>
                                    setData(
                                        "google_site_verification",
                                        event.target.value,
                                    )
                                }
                            />
                            {errors.google_site_verification && (
                                <p className="text-sm text-destructive">
                                    {errors.google_site_verification}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    id="settings-panel-footer"
                    role="tabpanel"
                    aria-labelledby="settings-tab-footer"
                    tabIndex={0}
                    hidden={activeSection !== "footer"}
                >
                    <CardHeader>
                        <CardTitle>Footer</CardTitle>
                        <CardDescription>
                            Add a short copyright or legal line for the default
                            public page template.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label htmlFor="footer_text">Footer text</Label>
                        <Input
                            id="footer_text"
                            value={data.footer_text}
                            maxLength={500}
                            placeholder="© Your company. All rights reserved."
                            aria-invalid={Boolean(errors.footer_text)}
                            onChange={(event) =>
                                setData("footer_text", event.target.value)
                            }
                        />
                        {errors.footer_text && (
                            <p className="text-sm text-destructive">
                                {errors.footer_text}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <LoaderCircle className="animate-spin" />
                        ) : (
                            <Save />
                        )}
                        Save settings
                    </Button>
                </div>
            </form>
        </SettingsLayout>
    );
}

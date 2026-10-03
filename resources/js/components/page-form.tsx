import GalleryImagePicker from "@/components/gallery-image-picker";
import ClientJoditEditor from "@/components/client-jodit-editor";
import Editor from "@monaco-editor/react";
import InputError from "@/components/input-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import pages from "@/routes/admin/page";
import type { GalleryImage, Page } from "@/types/data";
import { RouteDefinition } from "@/wayfinder";
import { Form, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    Code,
    Copy,
    Edit3,
    Eye,
    FileText,
    Globe,
    Image as ImageIcon,
    Layout,
    Lock,
    Maximize,
    Minimize,
    Search,
    Settings,
    Sparkles,
    Trash2,
    Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";

type ParentPageOption = Pick<Page, "id" | "name" | "slug">;

export type PageFormProps = {
    page?: Page | null;
    parentPages?: ParentPageOption[];
    templates?: { value: string; label: string }[];
    media?: { data: GalleryImage[] };
    counts?: Record<"all" | "image" | "video" | "other", number>;
    filter?: "all" | "image" | "video" | "other";
    search?: string;
    filterUrl?: string;
    pickerAsset?: GalleryImage | null;
    initialImage?: GalleryImage | null;
    cancelHref?: string;
};

const defaultTemplates = [
    { value: "page", label: "Default Page" },
    { value: "template", label: "Theme template" },
];

const PageForm = ({
    page,
    parentPages = [],
    templates = defaultTemplates,
    media = { data: [] },
    counts = { all: 0, image: 0, video: 0, other: 0 },
    filter = "image",
    search = "",
    filterUrl = "/admin/gallery",
    pickerAsset,
    initialImage,
    cancelHref,
}: PageFormProps) => {
    // Form Action (Update vs Store)
    const action = page
        ? { action: pages.update.url(page.slug), method: "put" as const }
        : pages.store.form();

    // Auto-slug state
    const [autoSlug, setAutoSlug] = useState(!page);
    const [name, setName] = useState(page?.name ?? "");
    const [slug, setSlug] = useState(page?.slug ?? "");
    const [parentId, setParentId] = useState<string>(
        page?.parent_id ? String(page.parent_id) : "none",
    );
    const [template, setTemplate] = useState(page?.template ?? "page");
    const [status, setStatus] = useState<string>(page?.status ?? "draft");
    const [visibility, setVisibility] = useState<string>(
        page?.visibility ?? "public",
    );
    const [password, setPassword] = useState("");
    const [content, setContent] = useState(page?.content ?? "");
    const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [excerpt, setExcerpt] = useState(page?.excerpt ?? "");
    const [sortOrder, setSortOrder] = useState<number>(page?.sort_order ?? 0);
    const [publishedAt, setPublishedAt] = useState<string>(
        page?.published_at ? page.published_at.slice(0, 16) : "",
    );

    // Featured Image asset selection
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(
        pickerAsset ?? initialImage ?? page?.featured_media_asset ?? null,
    );

    // SEO States
    const [metaTitle, setMetaTitle] = useState(page?.meta_title ?? "");
    const [metaDescription, setMetaDescription] = useState(
        page?.meta_description ?? "",
    );
    const [canonicalUrl, setCanonicalUrl] = useState(page?.canonical_url ?? "");
    const [robots, setRobots] = useState(page?.robots ?? "index,follow");

    // Copy slug feedback
    const [copiedSlug, setCopiedSlug] = useState(false);

    // Generate Kebab-case slug
    const slugify = (text: string) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleNameChange = (newName: string) => {
        setName(newName);
        if (autoSlug) {
            setSlug(slugify(newName));
        }
    };

    // Calculate parent slug path prefix
    const selectedParent = useMemo(() => {
        if (parentId === "none") return null;
        return parentPages.find((p) => String(p.id) === parentId) ?? null;
    }, [parentId, parentPages]);

    const permalinkPath = useMemo(() => {
        const parentPrefix = selectedParent ? `${selectedParent.slug}/` : "";
        return `/${parentPrefix}${slug || "page-slug"}`;
    }, [selectedParent, slug]);

    const handleCopySlug = () => {
        navigator.clipboard.writeText(permalinkPath);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
    };

    // Jodit Editor configuration
    const editorConfig = useMemo(
        () => ({
            readonly: false,
            placeholder: "Start typing or composing your page content...",
            minHeight: 420,
            buttons: [
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "|",
                "fontsize",
                "brush",
                "paragraph",
                "|",
                "image",
                "table",
                "link",
                "|",
                "align",
                "undo",
                "redo",
                "|",
                "fullsize",
            ],
            toolbarAdaptive: false,
        }),
        [],
    );

    return (
        <Form {...action}>
            {({ errors, processing }) => (
                <div className="space-y-8">
                    {/* Top Control Bar */}
                    <Card className="p-4 bg-muted/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-dashed">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <Badge
                                variant="outline"
                                className={
                                    status === "published"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : status === "archived"
                                          ? "border-zinc-200 bg-zinc-100 text-zinc-600"
                                          : status === "scheduled"
                                            ? "border-blue-200 bg-blue-50 text-blue-700"
                                            : "border-amber-200 bg-amber-50 text-amber-800"
                                }
                            >
                                Status: {status}
                            </Badge>

                            <Badge variant="outline" className="capitalize">
                                Visibility: {visibility.replace("_", " ")}
                            </Badge>

                            <Badge variant="secondary" className="gap-1">
                                <Layout className="size-3" /> Template:{" "}
                                {templates.find((t) => t.value === template)
                                    ?.label ?? template}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {cancelHref || pages.index() ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                >
                                    <Link href={cancelHref ?? pages.index()}>
                                        Cancel
                                    </Link>
                                </Button>
                            ) : null}

                            <Button
                                type="submit"
                                disabled={processing}
                                className="gap-2 min-w-30"
                            >
                                {processing && <Spinner className="size-4" />}
                                {page ? "Update Page" : "Publish Page"}
                            </Button>
                        </div>
                    </Card>

                    {/* Main Two-Column Layout */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* LEFT COLUMN: Main Content & SEO (70% width) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Page Name & Slug Card */}
                            <Card className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-sm font-semibold"
                                    >
                                        Page Name{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={name}
                                        onChange={(e) =>
                                            handleNameChange(e.target.value)
                                        }
                                        placeholder="e.g. About Our Company, Terms of Service, Services..."
                                        className="text-lg font-medium h-11"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Slug & Permalink Box */}
                                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                            <Globe className="size-3.5 text-primary" />{" "}
                                            Permalink Preview:
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAutoSlug(!autoSlug)
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                            title={
                                                autoSlug
                                                    ? "Lock Slug (Stop auto-generating from title)"
                                                    : "Unlock Slug (Auto-generate from title)"
                                            }
                                        >
                                            {autoSlug ? (
                                                <>
                                                    <Lock className="size-3" />{" "}
                                                    Auto Slug Enabled
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="size-3 text-amber-600" />{" "}
                                                    Manual Slug Mode
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 flex items-center overflow-hidden rounded border bg-background px-2.5 py-1.5 text-muted-foreground font-mono">
                                            <span className="shrink-0 text-muted-foreground/70">
                                                https://yourdomain.com
                                                {selectedParent
                                                    ? `/${selectedParent.slug}`
                                                    : ""}
                                                /
                                            </span>
                                            <input
                                                type="text"
                                                name="slug"
                                                value={slug}
                                                onChange={(e) => {
                                                    setSlug(
                                                        slugify(e.target.value),
                                                    );
                                                    setAutoSlug(false);
                                                }}
                                                placeholder="page-slug"
                                                className="w-full bg-transparent font-semibold text-foreground outline-none border-none p-0 focus:ring-0 text-xs"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopySlug}
                                            className="inline-flex size-8 shrink-0 items-center justify-center rounded border bg-background text-muted-foreground hover:text-foreground"
                                            title="Copy Permalink"
                                        >
                                            {copiedSlug ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.slug} />
                                </div>
                            </Card>

                            {/* Content Editor Card */}
                            <Card className="p-6 space-y-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Page Content
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Compose and format the main body
                                            content for this page.
                                        </p>
                                    </div>

                                    {/* Editor Mode Tabs */}
                                    <div className="flex items-center bg-muted p-1 rounded-md text-xs self-start">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditorMode("visual")
                                            }
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                                                editorMode === "visual"
                                                    ? "bg-background shadow-xs text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <Edit3 className="size-3.5" />{" "}
                                            Visual Editor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditorMode("html")
                                            }
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                                                editorMode === "html"
                                                    ? "bg-background shadow-xs text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <Code className="size-3.5" /> HTML
                                            Code
                                        </button>
                                    </div>
                                </div>

                                {editorMode === "visual" ? (
                                    <div className="prose-editor min-h-[420px]">
                                        <ClientJoditEditor
                                            value={content}
                                            config={editorConfig}
                                            onBlur={(newContent) =>
                                                setContent(newContent)
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            isFullScreen
                                                ? "fixed inset-0 z-50 flex flex-col bg-[#1e1e1e]"
                                                : "space-y-2 rounded-md border overflow-hidden h-[420px] bg-[#1e1e1e] relative group"
                                        }
                                    >
                                        <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800">
                                            <span className="text-xs font-mono text-zinc-400">
                                                index.html
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsFullScreen(!isFullScreen)}
                                                className="text-zinc-400 hover:text-white transition-colors"
                                                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                                            >
                                                {isFullScreen ? (
                                                    <Minimize className="size-4" />
                                                ) : (
                                                    <Maximize className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            <Editor
                                                height="100%"
                                                language="html"
                                                theme="vs-dark"
                                                value={content}
                                                onChange={(value) => setContent(value || "")}
                                                options={{
                                                    minimap: { enabled: false },
                                                    wordWrap: "on",
                                                    formatOnPaste: true,
                                                    fontSize: 14,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="hidden"
                                    name="content"
                                    value={content}
                                />
                                <InputError message={errors.content} />
                            </Card>

                            {/* Page Excerpt Card */}
                            <Card className="p-6 space-y-3">
                                <div>
                                    <Label
                                        htmlFor="excerpt"
                                        className="text-sm font-semibold"
                                    >
                                        Page Excerpt / Summary
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Optional summary text used in search
                                        listings, page cards, and meta
                                        descriptions.
                                    </p>
                                </div>
                                <textarea
                                    id="excerpt"
                                    name="excerpt"
                                    rows={3}
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Write a concise overview of this page..."
                                    className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <InputError message={errors.excerpt} />
                            </Card>

                            {/* SEO & Search Engine Optimization Card */}
                            <Card className="p-6 space-y-6">
                                <div className="border-b pb-3">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Sparkles className="size-4 text-purple-600" />{" "}
                                        Search Engine Optimization (SEO)
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Optimize how this page appears in search
                                        engines like Google and Bing.
                                    </p>
                                </div>

                                {/* Live Google Search Preview Box */}
                                <div className="rounded-lg border bg-background p-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-sans truncate">
                                        <span>
                                            https://yourdomain.com
                                            {permalinkPath}
                                        </span>
                                    </div>
                                    <h4 className="text-base font-medium text-blue-800 dark:text-blue-400 hover:underline cursor-pointer truncate font-sans">
                                        {metaTitle ||
                                            name ||
                                            "Page Name Placeholder"}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                                        {metaDescription ||
                                            excerpt ||
                                            (content
                                                ? content
                                                      .replace(/<[^>]*>/g, " ")
                                                      .trim()
                                                      .slice(0, 150)
                                                : "No description provided. Search engines will display page excerpt or body content.")}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <Label
                                                htmlFor="meta_title"
                                                className="font-medium"
                                            >
                                                Meta Title
                                            </Label>
                                            <span
                                                className={
                                                    metaTitle.length > 60
                                                        ? "text-amber-600 font-semibold"
                                                        : "text-muted-foreground"
                                                }
                                            >
                                                {metaTitle.length} / 60 chars
                                            </span>
                                        </div>
                                        <Input
                                            id="meta_title"
                                            name="meta_title"
                                            value={metaTitle}
                                            onChange={(e) =>
                                                setMetaTitle(e.target.value)
                                            }
                                            placeholder={
                                                name || "Custom SEO Title"
                                            }
                                        />
                                        <InputError
                                            message={errors.meta_title}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <Label
                                                htmlFor="meta_description"
                                                className="font-medium"
                                            >
                                                Meta Description
                                            </Label>
                                            <span
                                                className={
                                                    metaDescription.length > 160
                                                        ? "text-amber-600 font-semibold"
                                                        : "text-muted-foreground"
                                                }
                                            >
                                                {metaDescription.length} / 160
                                                chars
                                            </span>
                                        </div>
                                        <textarea
                                            id="meta_description"
                                            name="meta_description"
                                            rows={3}
                                            value={metaDescription}
                                            onChange={(e) =>
                                                setMetaDescription(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Write a compelling search engine summary..."
                                            className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <InputError
                                            message={errors.meta_description}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="canonical_url"
                                                className="text-xs font-medium"
                                            >
                                                Canonical URL
                                            </Label>
                                            <Input
                                                id="canonical_url"
                                                name="canonical_url"
                                                value={canonicalUrl}
                                                onChange={(e) =>
                                                    setCanonicalUrl(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://example.com/canonical-path"
                                                className="text-xs"
                                            />
                                            <InputError
                                                message={errors.canonical_url}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="robots"
                                                className="text-xs font-medium"
                                            >
                                                Robots Directive
                                            </Label>
                                            <Select
                                                value={robots}
                                                onValueChange={setRobots}
                                            >
                                                <SelectTrigger className="text-xs bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="index,follow">
                                                        index, follow (Default)
                                                    </SelectItem>
                                                    <SelectItem value="noindex,follow">
                                                        noindex, follow
                                                    </SelectItem>
                                                    <SelectItem value="index,nofollow">
                                                        index, nofollow
                                                    </SelectItem>
                                                    <SelectItem value="noindex,nofollow">
                                                        noindex, nofollow
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="robots"
                                                value={robots}
                                            />
                                            <InputError
                                                message={errors.robots}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Settings & Metadata Sidebar (30% width) */}
                        <div className="space-y-6">
                            {/* Publishing & Status Box */}
                            <Card className="p-5 space-y-4">
                                <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                    <Settings className="size-4 text-primary" />{" "}
                                    Publishing & Status
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="space-y-1.5 w-full">
                                            <Label
                                                htmlFor="status"
                                                className="text-xs font-medium"
                                            >
                                                Publication Status
                                            </Label>
                                            <Select
                                                value={status}
                                                onValueChange={setStatus}
                                            >
                                                <SelectTrigger className="text-xs bg-background w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">
                                                        Draft (Unpublished)
                                                    </SelectItem>
                                                    <SelectItem value="published">
                                                        Published
                                                    </SelectItem>
                                                    <SelectItem value="scheduled">
                                                        Scheduled
                                                    </SelectItem>
                                                    <SelectItem value="archived">
                                                        Archived
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="status"
                                                value={status}
                                            />
                                            <InputError
                                                message={errors.status}
                                            />
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label
                                                htmlFor="visibility"
                                                className="text-xs font-medium"
                                            >
                                                Visibility Access
                                            </Label>
                                            <Select
                                                value={visibility}
                                                onValueChange={setVisibility}
                                            >
                                                <SelectTrigger className="text-xs bg-background w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="public">
                                                        Public (Visible to
                                                        everyone)
                                                    </SelectItem>
                                                    <SelectItem value="private">
                                                        Private (Admins only)
                                                    </SelectItem>
                                                    <SelectItem value="password_protected">
                                                        Password Protected
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="visibility"
                                                value={visibility}
                                            />
                                            <InputError
                                                message={errors.visibility}
                                            />
                                        </div>
                                    </div>

                                    {visibility === "password_protected" && (
                                        <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200">
                                            <Label
                                                htmlFor="password"
                                                className="text-xs font-medium text-amber-900 dark:text-amber-300"
                                            >
                                                Protection Password
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                placeholder="Enter password..."
                                                className="text-xs bg-background"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="published_at"
                                            className="text-xs font-medium"
                                        >
                                            Publish Date / Schedule
                                        </Label>
                                        <Input
                                            id="published_at"
                                            type="datetime-local"
                                            name="published_at"
                                            value={publishedAt}
                                            onChange={(e) =>
                                                setPublishedAt(e.target.value)
                                            }
                                            className="text-xs"
                                        />
                                        <InputError
                                            message={errors.published_at}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Page Hierarchy & Attributes Box */}
                            <Card className="p-5 space-y-4">
                                <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                    <Layout className="size-4 text-indigo-600" />{" "}
                                    Page Attributes
                                </h3>

                                <div className="space-y-3">
                                    <div className="w-full flex gap-2">
                                        <div className="space-y-1.5 w-full">
                                            <Label
                                                htmlFor="parent_id"
                                                className="text-xs font-medium"
                                            >
                                                Parent Page (Hierarchy)
                                            </Label>
                                            <Select
                                                value={parentId}
                                                onValueChange={setParentId}
                                            >
                                                <SelectTrigger className="text-xs bg-background w-full">
                                                    <SelectValue placeholder="Select Parent Page" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        None (Top-Level Page)
                                                    </SelectItem>
                                                    {parentPages.map(
                                                        (parent) => (
                                                            <SelectItem
                                                                key={parent.id}
                                                                value={String(
                                                                    parent.id,
                                                                )}
                                                            >
                                                                {parent.name} (/
                                                                {parent.slug})
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="parent_id"
                                                value={
                                                    parentId === "none"
                                                        ? ""
                                                        : parentId
                                                }
                                            />
                                            <InputError
                                                message={errors.parent_id}
                                            />
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label
                                                htmlFor="template"
                                                className="text-xs font-medium"
                                            >
                                                Page Template
                                            </Label>
                                            <Select
                                                value={template}
                                                onValueChange={setTemplate}
                                            >
                                                <SelectTrigger className="text-xs bg-background w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map((tpl) => (
                                                        <SelectItem
                                                            key={tpl.value}
                                                            value={tpl.value}
                                                        >
                                                            {tpl.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="template"
                                                value={template}
                                            />
                                            <InputError
                                                message={errors.template}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="sort_order"
                                            className="text-xs font-medium"
                                        >
                                            Menu Sort Order
                                        </Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            name="sort_order"
                                            value={sortOrder}
                                            onChange={(e) =>
                                                setSortOrder(
                                                    Number(e.target.value),
                                                )
                                            }
                                            min={0}
                                            className="text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Lower numbers appear first in
                                            navigation menus.
                                        </p>
                                        <InputError
                                            message={errors.sort_order}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Featured Header Media Box */}
                            <Card className="p-5 space-y-4">
                                <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                    <ImageIcon className="size-4 text-emerald-600" />{" "}
                                    Featured Header Image
                                </h3>

                                <div className="space-y-3">
                                    <GalleryImagePicker
                                        id="featured_media"
                                        media={media}
                                        counts={counts}
                                        filter={filter}
                                        search={search}
                                        filterUrl={filterUrl}
                                        selectedImage={selectedImage}
                                        onSelect={(image) =>
                                            setSelectedImage(image)
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="featured_media"
                                        value={selectedImage?.path ?? ""}
                                    />
                                    <InputError
                                        message={errors.featured_media}
                                    />

                                    {selectedImage && (
                                        <div className="flex flex-col items-center justify-between pt-1">
                                            <img src={`/storage/${selectedImage.path}`} />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setSelectedImage(null)
                                                }
                                                className="h-7 text-xs text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </Form>
    );
};

export default PageForm;

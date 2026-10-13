import ClientJoditEditor from "@/components/client-jodit-editor";
import GalleryImagePicker from "@/components/gallery-image-picker";
import InputError from "@/components/input-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import posts from "@/routes/admin/posts";
import type { Category, GalleryImage, Post } from "@/types/data";
import { Form, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    Copy,
    Edit3,
    Eye,
    Globe,
    Image as ImageIcon,
    Plus,
    Save,
    Search,
    Sparkles,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type PostFormProps = {
    post?: Post | null;
    categories?: Pick<Category, "id" | "name" | "slug">[];
    media?: { data: GalleryImage[] };
    counts?: Record<"all" | "image" | "video" | "other", number>;
    filter?: "all" | "image" | "video" | "other";
    search?: string;
    filterUrl?: string;
    cancelHref?: string;
};

const PostForm = ({
    post,
    categories = [],
    media = { data: [] },
    counts = { all: 0, image: 0, video: 0, other: 0 },
    filter = "image",
    search = "",
    filterUrl = "/admin/gallery",
    cancelHref,
}: PostFormProps) => {
    const action = post
        ? { action: posts.update.url(post.slug), method: "put" as const }
        : posts.store.form();

    // Title & Slug
    const [title, setTitle] = useState(post?.title ?? "");
    const [slug, setSlug] = useState(post?.slug ?? "");
    const [autoSlug, setAutoSlug] = useState(!post);
    const [copiedSlug, setCopiedSlug] = useState(false);

    // Core content
    const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
    const [content, setContent] = useState(post?.content ?? "");
    const [categoryId, setCategoryId] = useState<string>(
        post?.category_id ? String(post.category_id) : "none",
    );
    const [categorySearch, setCategorySearch] = useState("");

    // Featured Image & OG Image
    const [featuredImage, setFeaturedImage] = useState<GalleryImage | null>(
        post?.featured_image_asset ?? null,
    );
    const [ogImage, setOgImage] = useState<GalleryImage | null>(
        post?.og_image_asset ?? null,
    );

    // Publishing details
    const [status, setStatus] = useState<string>(post?.status ?? "draft");
    const [visibility, setVisibility] = useState<string>(
        post?.visibility ?? "public",
    );
    const [password, setPassword] = useState("");
    const [publishedAt, setPublishedAt] = useState<string>(
        post?.published_at ? post.published_at.slice(0, 16) : "",
    );
    const [isFeatured, setIsFeatured] = useState<boolean>(
        post?.is_featured ?? false,
    );

    // Tags
    const [tags, setTags] = useState<string[]>(post?.tags ?? []);
    const [tagDraft, setTagDraft] = useState("");

    // SEO
    const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
    const [metaDescription, setMetaDescription] = useState(
        post?.meta_description ?? "",
    );
    const [canonicalUrl, setCanonicalUrl] = useState(post?.canonical_url ?? "");
    const [ogTitle, setOgTitle] = useState(post?.og_title ?? "");
    const [ogDescription, setOgDescription] = useState(
        post?.og_description ?? "",
    );
    const [robots, setRobots] = useState(post?.robots ?? "index,follow");

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (autoSlug) {
            setSlug(slugify(val));
        }
    };

    const addTag = () => {
        const trimmed = tagDraft.trim();
        if (!trimmed) return;
        if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            setTags([...tags, trimmed]);
        }
        setTagDraft("");
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const permalinkPath = `/blog/${slug || "post-slug"}`;

    const handleCopySlug = () => {
        navigator.clipboard.writeText(permalinkPath);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
    };

    const visibleCategories = useMemo(
        () =>
            categories.filter((cat) =>
                cat.name
                    .toLowerCase()
                    .includes(categorySearch.trim().toLowerCase()),
            ),
        [categories, categorySearch],
    );

    // Jodit editor options
    const editorConfig = useMemo(
        () => ({
            readonly: false,
            placeholder: "Write your engaging story, insights, or update here...",
            minHeight: 480,
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
                "hr",
                "fullsize",
            ],
        }),
        [],
    );

    return (
        <Form {...action} className="space-y-6">
            {({ errors, processing }) => (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column (2 cols): Main content, Editor & SEO */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Title & Slug */}
                        <Card>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-base font-semibold">
                                        Post Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={title}
                                        maxLength={255}
                                        placeholder="e.g. 10 Proven Strategies to Scale Your E-Commerce Store"
                                        className="text-lg font-medium"
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Globe className="size-3.5" />
                                            <span>Permalink:</span>
                                            <span className="font-mono text-foreground font-medium">
                                                {permalinkPath}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => setAutoSlug(!autoSlug)}
                                            >
                                                <Edit3 className="mr-1 size-3" />
                                                {autoSlug ? "Manual Slug" : "Auto Slug"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={handleCopySlug}
                                            >
                                                {copiedSlug ? (
                                                    <Check className="mr-1 size-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="mr-1 size-3" />
                                                )}
                                                {copiedSlug ? "Copied" : "Copy URL"}
                                            </Button>
                                        </div>
                                    </div>
                                    {!autoSlug && (
                                        <div className="pt-2">
                                            <Input
                                                id="slug"
                                                name="slug"
                                                value={slug}
                                                maxLength={255}
                                                placeholder="post-slug-url"
                                                onChange={(e) => setSlug(slugify(e.target.value))}
                                                className="h-8 font-mono text-xs"
                                                required
                                            />
                                        </div>
                                    )}
                                    <input type="hidden" name="slug" value={slug} />
                                    <InputError message={errors.slug} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="excerpt">Excerpt / Summary</Label>
                                    <textarea
                                        id="excerpt"
                                        name="excerpt"
                                        rows={3}
                                        maxLength={500}
                                        value={excerpt}
                                        placeholder="Brief teaser or introduction shown on blog lists and post previews..."
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        onChange={(e) => setExcerpt(e.target.value)}
                                    />
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                        <span>Captivates readers before they click.</span>
                                        <span>{excerpt.length}/500</span>
                                    </div>
                                    <InputError message={errors.excerpt} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Editor */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Edit3 className="size-4 text-primary" />
                                    Post Content
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <ClientJoditEditor
                                    id="post_content"
                                    name="content"
                                    value={content}
                                    config={editorConfig}
                                    onChange={(newVal) => setContent(newVal)}
                                />
                                <InputError message={errors.content} />
                            </CardContent>
                        </Card>

                        {/* Search Engine Optimization (SEO) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Globe className="size-4 text-primary" />
                                    Search Engine Optimization (SEO)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="meta_title">SEO Meta Title</Label>
                                    <Input
                                        id="meta_title"
                                        name="meta_title"
                                        value={metaTitle}
                                        maxLength={255}
                                        placeholder={title || "Target search title"}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Recommended: 50–60 characters. If empty, post title is used.
                                    </p>
                                    <InputError message={errors.meta_title} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="meta_description">SEO Meta Description</Label>
                                    <textarea
                                        id="meta_description"
                                        name="meta_description"
                                        rows={3}
                                        maxLength={500}
                                        value={metaDescription}
                                        placeholder={excerpt || "Search engine description snippet..."}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        onChange={(e) => setMetaDescription(e.target.value)}
                                    />
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                        <span>Recommended: 120–160 characters.</span>
                                        <span>{metaDescription.length}/500</span>
                                    </div>
                                    <InputError message={errors.meta_description} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="canonical_url">Canonical URL</Label>
                                        <Input
                                            id="canonical_url"
                                            name="canonical_url"
                                            type="url"
                                            value={canonicalUrl}
                                            maxLength={2048}
                                            placeholder="https://example.com/original-article"
                                            onChange={(e) => setCanonicalUrl(e.target.value)}
                                        />
                                        <InputError message={errors.canonical_url} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="robots">Robots Indexing</Label>
                                        <Select
                                            name="robots"
                                            value={robots}
                                            onValueChange={(val) => setRobots(val)}
                                        >
                                            <SelectTrigger id="robots">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="index,follow">index, follow (Standard)</SelectItem>
                                                <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                                                <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                                                <SelectItem value="noindex,nofollow">noindex, nofollow (Hidden)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.robots} />
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Social Media Preview (Open Graph)
                                    </h4>

                                    <div className="space-y-2">
                                        <Label htmlFor="og_title">Social Title</Label>
                                        <Input
                                            id="og_title"
                                            name="og_title"
                                            value={ogTitle}
                                            placeholder={metaTitle || title || "Social share title"}
                                            onChange={(e) => setOgTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="og_description">Social Description</Label>
                                        <Input
                                            id="og_description"
                                            name="og_description"
                                            value={ogDescription}
                                            placeholder={metaDescription || excerpt || "Social share description"}
                                            onChange={(e) => setOgDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Social Share Image</Label>
                                        <input
                                            type="hidden"
                                            name="og_image"
                                            value={ogImage?.path ?? ""}
                                        />
                                        <div className="flex items-center gap-3">
                                            {ogImage ? (
                                                <div className="relative size-16 shrink-0 rounded-md border overflow-hidden">
                                                    <img
                                                        src={ogImage.url}
                                                        alt="OG Preview"
                                                        className="size-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                                                        onClick={() => setOgImage(null)}
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="size-16 shrink-0 rounded-md border border-dashed flex items-center justify-center text-muted-foreground bg-muted/30">
                                                    <ImageIcon className="size-5" />
                                                </div>
                                            )}
                                            <GalleryImagePicker
                                                id="post_og_image"
                                                media={media}
                                                counts={counts}
                                                filter={filter}
                                                search={search}
                                                filterUrl={filterUrl}
                                                selectedImage={ogImage}
                                                onSelect={(img) => setOgImage(img)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (1 col): Publishing, Featured Image, Category, Tags */}
                    <div className="space-y-6">
                        {/* Publish Status Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Publish Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        name="status"
                                        value={status}
                                        onValueChange={(val) => setStatus(val)}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft (Private)</SelectItem>
                                            <SelectItem value="published">Published (Public)</SelectItem>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visibility">Visibility</Label>
                                    <Select
                                        name="visibility"
                                        value={visibility}
                                        onValueChange={(val) => setVisibility(val)}
                                    >
                                        <SelectTrigger id="visibility">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="password">Password protected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.visibility} />
                                </div>

                                {visibility === "password" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Access Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={password}
                                            placeholder="Enter password..."
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="published_at">Publication Date</Label>
                                    <Input
                                        id="published_at"
                                        name="published_at"
                                        type="datetime-local"
                                        value={publishedAt}
                                        onChange={(e) => setPublishedAt(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Leave blank to publish automatically when status is active.
                                    </p>
                                    <InputError message={errors.published_at} />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_featured" className="text-sm font-medium">
                                            Featured Post
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Pin this post to highlighted hero placements.
                                        </p>
                                    </div>
                                    <Switch
                                        id="is_featured"
                                        checked={isFeatured}
                                        onCheckedChange={(checked) => setIsFeatured(checked)}
                                    />
                                    <input
                                        type="hidden"
                                        name="is_featured"
                                        value={isFeatured ? "1" : "0"}
                                    />
                                </div>

                                <div className="pt-3 border-t flex items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link href={cancelHref ?? posts.index.url()}>
                                            <ArrowLeft className="size-4 mr-1" />
                                            Cancel
                                        </Link>
                                    </Button>

                                    <Button type="submit" disabled={processing} className="min-w-28">
                                        {processing ? (
                                            <Spinner className="size-4 mr-2" />
                                        ) : (
                                            <Save className="size-4 mr-2" />
                                        )}
                                        {post ? "Update Post" : "Publish Post"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Featured Image Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Featured Image</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <input
                                    type="hidden"
                                    name="featured_image"
                                    value={featuredImage?.path ?? ""}
                                />
                                {featuredImage ? (
                                    <div className="relative aspect-video w-full rounded-md border overflow-hidden bg-muted">
                                        <img
                                            src={featuredImage.url}
                                            alt={featuredImage.alt || featuredImage.name}
                                            className="size-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                                            title="Remove image"
                                            onClick={() => setFeaturedImage(null)}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center aspect-video rounded-md border border-dashed bg-muted/20 text-muted-foreground p-4 text-center">
                                        <ImageIcon className="size-8 opacity-40 mb-1" />
                                        <span className="text-xs">No cover image selected</span>
                                    </div>
                                )}
                                <GalleryImagePicker
                                    id="post_featured_image"
                                    media={media}
                                    counts={counts}
                                    filter={filter}
                                    search={search}
                                    filterUrl={filterUrl}
                                    selectedImage={featuredImage}
                                    onSelect={(img) => setFeaturedImage(img)}
                                />
                                <InputError message={errors.featured_image} />
                            </CardContent>
                        </Card>

                        {/* Category Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Category</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Select
                                    value={categoryId}
                                    onValueChange={(val) => {
                                        setCategoryId(val);
                                        setCategorySearch("");
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div
                                            className="border-b p-2"
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    placeholder="Search categories..."
                                                    className="h-8 pl-8"
                                                />
                                            </div>
                                        </div>
                                        <SelectItem value="none">Uncategorized</SelectItem>
                                        {visibleCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input
                                    type="hidden"
                                    name="category_id"
                                    value={categoryId === "none" ? "" : categoryId}
                                />
                                <InputError message={errors.category_id} />
                            </CardContent>
                        </Card>

                        {/* Tags Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <input
                                    type="hidden"
                                    name="tags_text"
                                    value={tags.join(", ")}
                                />
                                <div className="flex min-h-9 flex-wrap gap-1.5">
                                    {tags.length === 0 ? (
                                        <span className="text-xs text-muted-foreground italic py-1">
                                            No tags added yet.
                                        </span>
                                    ) : (
                                        tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="gap-1 pr-1 font-normal"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    className="rounded-full hover:bg-muted p-0.5"
                                                    onClick={() => removeTag(tag)}
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={tagDraft}
                                        maxLength={50}
                                        placeholder="Add a tag..."
                                        className="h-8 text-xs"
                                        onChange={(e) => setTagDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        disabled={!tagDraft.trim()}
                                        onClick={addTag}
                                    >
                                        <Plus className="size-3.5" />
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Press Enter or click + to add tags.
                                </p>
                                <InputError message={errors.tags_text} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </Form>
    );
};

export default PostForm;

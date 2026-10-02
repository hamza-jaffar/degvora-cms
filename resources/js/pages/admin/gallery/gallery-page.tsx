import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import galleryRoutes from "@/routes/admin/gallery";
import { router } from "@inertiajs/react";
import {
    FileText,
    Film,
    Image as ImageIcon,
    LayoutGrid,
    Search,
    Upload,
    X,
} from "lucide-react";
import { useState } from "react";
import DisplayTab, { type GalleryMedia } from "./tabs/display";
import UploadForm from "./tabs/uploads-form";
import Heading from "@/components/heading";

type FilterType = "all" | "image" | "video" | "other" | "upload";

export type GalleryPageProps = {
    media: { data: GalleryMedia[] };
    counts: Record<"all" | "image" | "video" | "other", number>;
    filter: Exclude<FilterType, "upload">;
};

const filterOptions = [
    { label: "All media", value: "all", icon: LayoutGrid },
    { label: "Images", value: "image", icon: ImageIcon },
    { label: "Videos", value: "video", icon: Film },
    { label: "Other", value: "other", icon: FileText },
] as const;

const GalleryPage = ({ media, counts, filter }: GalleryPageProps) => {
    const [selectedFilter, setSelectedFilter] = useState<FilterType>(filter);
    const [search, setSearch] = useState("");
    const visibleMedia = media.data.filter((asset) => {
        const matchesSearch = asset.name
            .toLowerCase()
            .includes(search.toLowerCase());

        return matchesSearch;
    });

    const handleFilterChange = (filter: FilterType) => {
        setSelectedFilter(filter);

        if (filter === "upload") return;

        router.get(
            galleryRoutes.index.url(),
            filter === "all" ? {} : { filter },
            {
                only: ["media", "counts", "filter"],
                preserveState: true,
                preserveScroll: false,
                replace: true,
                reset: ["media"],
            },
        );
    };

    return (
        <div className="mx-auto w-full pace-y-8 p-8">
            <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
                <Heading
                    title="Media library"
                    description="Find and manage the images, clips, and documents used
                        across your site."
                />
                <Button
                    onClick={() =>
                        handleFilterChange(
                            selectedFilter === "upload" ? "all" : "upload",
                        )
                    }
                    className="shrink-0 gap-2"
                >
                    {selectedFilter === "upload" ? <X /> : <Upload />}
                    {selectedFilter === "upload"
                        ? "Close uploader"
                        : "Upload media"}
                </Button>
            </header>

            <section
                aria-label="Media totals"
                className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0"
            >
                {[
                    {
                        label: "Total files",
                        value: counts.all,
                        icon: LayoutGrid,
                        color: "text-foreground",
                    },
                    {
                        label: "Images",
                        value: counts.image,
                        icon: ImageIcon,
                        color: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                        label: "Videos",
                        value: counts.video,
                        icon: Film,
                        color: "text-sky-700 dark:text-sky-400",
                    },
                    {
                        label: "Other files",
                        value: counts.other,
                        icon: FileText,
                        color: "text-amber-700 dark:text-amber-400",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="flex items-center gap-3 px-4 py-4 first:pl-0 sm:px-5"
                    >
                        <stat.icon
                            className={`size-5 shrink-0 ${stat.color}`}
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-xl font-semibold text-foreground tabular-nums">
                                {stat.value}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </section>

            {selectedFilter === "upload" ? (
                <UploadForm onUploadSuccess={() => handleFilterChange("all")} />
            ) : (
                <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
                            {filterOptions.map((option) => {
                                const Icon = option.icon;
                                const isActive =
                                    selectedFilter === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() =>
                                            handleFilterChange(option.value)
                                        }
                                        className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                                        }`}
                                    >
                                        <Icon
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        {option.label}
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {counts[option.value]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full lg:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search files"
                                aria-label="Search media files"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <DisplayTab
                        media={visibleMedia}
                        hasMedia={counts[selectedFilter] > 0}
                        hasAnyMedia={counts.all > 0}
                        hasSearch={search.trim().length > 0}
                    />
                </>
            )}
        </div>
    );
};

export default GalleryPage;

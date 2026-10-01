import { Category } from "./data";

type Link = {
    active: boolean;
    label: string;
    page: number | null;
    url: string | number;
};

type RootStructure = {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
};

export type CategoryIndexPagination = RootStructure & {
    data: Category[];
};

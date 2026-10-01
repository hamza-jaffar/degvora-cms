import type { ReactNode } from 'react';

type FilterCardProps = {
    children: ReactNode;
};

type SectionProps = {
    children: ReactNode;
    className?: string;
};

function FilterCardRoot({ children }: FilterCardProps) {
    return (
        <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            {children}
        </div>
    );
}

function Left({ children, className = '' }: SectionProps) {
    return (
        <div
            className={`flex flex-1 flex-wrap items-center gap-3 ${className}`}
        >
            {children}
        </div>
    );
}

function Right({ children, className = '' }: SectionProps) {
    return (
        <div
            className={`flex flex-wrap items-center gap-3 md:justify-end ${className}`}
        >
            {children}
        </div>
    );
}

export const FilterCard = Object.assign(FilterCardRoot, {
    Left,
    Right,
});

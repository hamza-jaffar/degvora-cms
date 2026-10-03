import type { JoditEditorProps } from 'jodit-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

export default function ClientJoditEditor(props: JoditEditorProps) {
    const [Editor, setEditor] =
        useState<ComponentType<JoditEditorProps> | null>(null);
    const [loadError, setLoadError] = useState<unknown>(null);

    useEffect(() => {
        let isMounted = true;

        import('jodit-react')
            .then(({ default: JoditEditor }) => {
                if (isMounted) {
                    setEditor(() => JoditEditor);
                }
            })
            .catch((error: unknown) => {
                console.error(
                    'The rich text editor could not be loaded.',
                    error,
                );

                if (isMounted) {
                    setLoadError(error);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (Editor) {
        return <Editor {...props} />;
    }

    if (loadError !== null) {
        return (
            <div role="alert" className="text-sm text-destructive">
                The rich text editor could not be loaded. Please reload and try
                again.
            </div>
        );
    }

    return (
        <div
            aria-live="polite"
            className="min-h-24 animate-pulse rounded-md bg-muted"
        >
            Loading rich text editor…
        </div>
    );
}

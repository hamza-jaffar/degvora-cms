import { Head, Link, router } from '@inertiajs/react';
import Editor from '@monaco-editor/react';
import {
    ChevronDown,
    ChevronRight,
    File as FileIcon,
    FilePlus2,
    Folder,
    FolderOpen,
    FolderPlus,
    Loader2,
    MoreHorizontal,
    Save,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboard } from '@/routes';
import themes from '@/routes/admin/themes';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    editable?: boolean;
    children?: FileNode[];
}

interface PageProps {
    theme_name: string;
    file_tree: FileNode[];
}

function getLanguage(filename: string): string {
    if (filename.endsWith('.blade.php')) return 'html';
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        php: 'php',
        html: 'html',
        htm: 'html',
        css: 'css',
        scss: 'scss',
        sass: 'scss',
        less: 'less',
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        vue: 'html',
        json: 'json',
        xml: 'xml',
        svg: 'xml',
        md: 'markdown',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'ini',
        ini: 'ini',
        txt: 'plaintext',
    };
    return map[ext] ?? 'plaintext';
}

// ─── File icon colour ─────────────────────────────────────────────────────────

function getFileColor(filename: string): string {
    if (filename.endsWith('.blade.php')) return 'text-orange-400';
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        php: 'text-purple-400',
        html: 'text-orange-400',
        htm: 'text-orange-400',
        css: 'text-blue-400',
        scss: 'text-pink-400',
        sass: 'text-pink-400',
        js: 'text-yellow-400',
        jsx: 'text-cyan-400',
        ts: 'text-blue-500',
        tsx: 'text-cyan-500',
        json: 'text-yellow-300',
        md: 'text-gray-300',
        svg: 'text-green-400',
        xml: 'text-green-300',
    };
    return map[ext] ?? 'text-gray-400';
}

// ─── Tree node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
    node: FileNode;
    depth: number;
    selectedPath: string | null;
    selectedDirectoryPath: string;
    onSelect: (node: FileNode) => void;
    onSelectDirectory: (path: string) => void;
    onCreate: (kind: 'file' | 'directory', parent: string) => void;
    onDelete: (node: FileNode) => void;
}

function TreeNode({
    node,
    depth,
    selectedPath,
    selectedDirectoryPath,
    onSelect,
    onSelectDirectory,
    onCreate,
    onDelete,
}: TreeNodeProps) {
    const [open, setOpen] = useState(depth === 0);
    const isSelected = selectedPath === node.path;
    const isSelectedDirectory = selectedDirectoryPath === node.path;
    const isSelectedDirectoryAncestor =
        isSelectedDirectory ||
        selectedDirectoryPath.startsWith(`${node.path}/`);

    useEffect(() => {
        if (isSelectedDirectoryAncestor) setOpen(true);
    }, [isSelectedDirectoryAncestor]);

    if (node.type === 'directory') {
        return (
            <div>
                <div className="flex items-start pr-1">
                    <button
                        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left text-sm ${isSelectedDirectory ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                        style={{ paddingLeft: `${8 + depth * 12}px` }}
                        onClick={() => {
                            onSelectDirectory(node.path);
                            setOpen((o) => !o);
                        }}
                    >
                        {open ? (
                            <ChevronDown className="h-3 w-3 shrink-0 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-3 w-3 shrink-0 text-gray-500" />
                        )}
                        {open ? (
                            <FolderOpen className="h-4 w-4 shrink-0 text-yellow-400" />
                        ) : (
                            <Folder className="h-4 w-4 shrink-0 text-yellow-400" />
                        )}
                        <span className="truncate">{node.name}</span>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-gray-400 hover:bg-white/10 hover:text-white"
                                aria-label={`Actions for folder ${node.name}`}
                                title={`Actions for folder ${node.name}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem
                                onSelect={() => onCreate('file', node.path)}
                            >
                                <FilePlus2 />
                                Create file in this folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    onCreate('directory', node.path)
                                }
                            >
                                <FolderPlus />
                                Create folder in this folder
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {open && node.children && (
                    <div>
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.path}
                                node={child}
                                depth={depth + 1}
                                selectedPath={selectedPath}
                                selectedDirectoryPath={selectedDirectoryPath}
                                onSelect={onSelect}
                                onSelectDirectory={onSelectDirectory}
                                onCreate={onCreate}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const parentPath = node.path.split('/').slice(0, -1).join('/');

    return (
        <div className="flex items-start pr-1">
            <button
                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'} ${!node.editable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                style={{ paddingLeft: `${20 + depth * 12}px` }}
                onClick={() => node.editable && onSelect(node)}
                title={
                    node.editable
                        ? node.path
                        : 'This file type cannot be edited'
                }
            >
                <FileIcon
                    className={`h-3.5 w-3.5 shrink-0 ${getFileColor(node.name)}`}
                />
                <span className="truncate">{node.name}</span>
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-gray-400 hover:bg-white/10 hover:text-white"
                        aria-label={`Actions for file ${node.name}`}
                        title={`Actions for file ${node.name}`}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                    <DropdownMenuItem
                        onSelect={() => onCreate('file', parentPath)}
                    >
                        <FilePlus2 />
                        Create file in this folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => onCreate('directory', parentPath)}
                    >
                        <FolderPlus />
                        Create folder in this folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDelete(node)}
                    >
                        <Trash2 />
                        Delete file
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemeEditor({ theme_name, file_tree }: PageProps) {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [selectedDirectoryPath, setSelectedDirectoryPath] = useState('');
    const [content, setContent] = useState('');
    const [loadingFile, setLoadingFile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileNode | null>(null);
    const [createKind, setCreateKind] = useState<'file' | 'directory' | null>(
        null,
    );
    const [newEntryName, setNewEntryName] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const originalContentRef = useRef('');

    const loadFile = useCallback(
        async (node: FileNode, discardUnsavedChanges = false) => {
            if (
                isDirty &&
                !discardUnsavedChanges &&
                !confirm('You have unsaved changes. Discard them?')
            )
                return;
            setLoadingFile(true);
            setSelectedFile(node);
            setSelectedDirectoryPath(
                node.path.split('/').slice(0, -1).join('/'),
            );
            setIsDirty(false);
            setContent('');
            try {
                const res = await fetch(
                    themes.file.url({ query: { path: node.path } }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    },
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = (await res.json()) as { content: string };
                setContent(data.content);
                originalContentRef.current = data.content;
            } catch {
                toast.error('Failed to load file');
                setSelectedFile(null);
            } finally {
                setLoadingFile(false);
            }
        },
        [isDirty],
    );

    const openCreateDialog = (kind: 'file' | 'directory', parent: string) => {
        setSelectedDirectoryPath(parent);
        setNewEntryName('');
        setCreateKind(kind);
    };

    const handleDeleteFile = async () => {
        if (!fileToDelete || deleting) return;
        setDeleting(true);
        try {
            const csrfMeta = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            );
            const response = await fetch(themes.deleteFile.url(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfMeta?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ path: fileToDelete.path }),
            });
            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                const validationMessage = Object.values(result.errors ?? {})
                    .flat()
                    .find(Boolean);
                throw new Error(
                    validationMessage ??
                        result.message ??
                        `HTTP ${response.status}`,
                );
            }

            if (selectedFile?.path === fileToDelete.path) {
                setSelectedFile(null);
                setContent('');
                setIsDirty(false);
                originalContentRef.current = '';
            }

            setFileToDelete(null);
            toast.success('File deleted');
            router.reload({ only: ['file_tree'] });
        } catch (error) {
            toast.error(
                `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateEntry = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!createKind || creating) return;
        if (
            createKind === 'file' &&
            isDirty &&
            !confirm(
                'You have unsaved changes. Discard them and open the new file?',
            )
        ) {
            return;
        }

        setCreating(true);

        try {
            const csrfMeta = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            );
            const endpoint =
                createKind === 'file'
                    ? themes.createFile.url()
                    : themes.createDirectory.url();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfMeta?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    parent: selectedDirectoryPath,
                    name: newEntryName,
                }),
            });
            const result = (await response.json().catch(() => ({}))) as {
                message?: string;
                path?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok || !result.path) {
                const validationMessage = Object.values(result.errors ?? {})
                    .flat()
                    .find(Boolean);
                throw new Error(
                    validationMessage ??
                        result.message ??
                        `HTTP ${response.status}`,
                );
            }

            const createdPath = result.path;
            const createdName = createdPath.split('/').pop() ?? newEntryName;
            const kind = createKind;

            setCreateKind(null);
            setNewEntryName('');
            setIsDirty(false);
            toast.success(kind === 'file' ? 'File created' : 'Folder created');

            router.reload({
                only: ['file_tree'],
                onSuccess: () => {
                    if (kind === 'file') {
                        void loadFile(
                            {
                                name: createdName,
                                path: createdPath,
                                type: 'file',
                                editable: true,
                            },
                            true,
                        );
                    } else {
                        setSelectedDirectoryPath(createdPath);
                    }
                },
            });
        } catch (error) {
            toast.error(
                `Failed to create ${createKind}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        } finally {
            setCreating(false);
        }
    };

    const handleSave = useCallback(async () => {
        if (!selectedFile || saving) return;
        setSaving(true);
        try {
            const csrfMeta = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            );
            const csrfToken = csrfMeta?.content ?? '';
            const res = await fetch(themes.saveFile.url(), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ path: selectedFile.path, content }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as {
                    message?: string;
                };
                throw new Error(body.message ?? `HTTP ${res.status}`);
            }
            toast.success('File saved');
            originalContentRef.current = content;
            setIsDirty(false);
        } catch (err) {
            toast.error(
                `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        } finally {
            setSaving(false);
        }
    }, [selectedFile, content, saving]);

    // Ctrl+S / Cmd+S
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                void handleSave();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    const handleEditorChange = (value: string | undefined) => {
        const v = value ?? '';
        setContent(v);
        setIsDirty(v !== originalContentRef.current);
    };

    return (
        <>
            <Head title={`Editor — ${theme_name}`} />

            {/*
             * This wrapper uses fixed positioning to escape the sidebar layout
             * and cover the entire viewport, giving a true full-screen editor feel.
             */}
            <div className="fixed inset-0 z-40 flex bg-[#1e1e1e]">
                {/* ── Sidebar ── */}
                <aside className="flex w-52 shrink-0 flex-col border-r border-white/10 bg-[#252526]">
                    <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
                            Explorer
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-gray-300">
                            {theme_name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-gray-500">
                            In: {selectedDirectoryPath || '/'}
                        </p>
                        <div className="mt-2 flex gap-1.5">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 min-w-0 flex-1 justify-start gap-1.5 border-white/10 bg-white/5 px-2 text-[11px] text-gray-200 hover:bg-white/10 hover:text-white"
                                onClick={() => setCreateKind('file')}
                            >
                                <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
                                <span>New file</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 min-w-0 flex-1 justify-start gap-1.5 border-white/10 bg-white/5 px-2 text-[11px] text-gray-200 hover:bg-white/10 hover:text-white"
                                onClick={() => setCreateKind('directory')}
                            >
                                <FolderPlus className="h-3.5 w-3.5 shrink-0" />
                                <span>New folder</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto py-1 text-[13px]">
                        {file_tree.map((node) => (
                            <TreeNode
                                key={node.path}
                                node={node}
                                depth={0}
                                selectedPath={selectedFile?.path ?? null}
                                selectedDirectoryPath={selectedDirectoryPath}
                                onSelect={loadFile}
                                onSelectDirectory={setSelectedDirectoryPath}
                                onCreate={openCreateDialog}
                                onDelete={setFileToDelete}
                            />
                        ))}
                    </div>
                </aside>

                {/* ── Editor pane ── */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Tab / toolbar bar */}
                    <div className="flex h-9 shrink-0 items-center border-b border-white/10 bg-[#252526]">
                        {selectedFile ? (
                            <div className="flex h-full items-center gap-2 border-r border-white/10 bg-[#1e1e1e] px-4 text-sm text-gray-200">
                                <FileIcon
                                    className={`h-3.5 w-3.5 ${getFileColor(selectedFile.name)}`}
                                />
                                <span>{selectedFile.name}</span>
                                {isDirty && (
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-orange-400"
                                        title="Unsaved changes"
                                    />
                                )}
                            </div>
                        ) : (
                            <span className="px-4 text-sm text-gray-500">
                                No file open — select one from the explorer
                            </span>
                        )}

                        <div className="ml-auto flex items-center gap-2 pr-3">
                            {selectedFile && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                    onClick={handleSave}
                                    disabled={saving || !isDirty}
                                >
                                    {saving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}
                                    {saving ? 'Saving…' : 'Save'}
                                    <kbd className="ml-0.5 rounded bg-white/10 px-1 text-[10px] text-gray-400">
                                        Ctrl+S
                                    </kbd>
                                </Button>
                            )}
                            {/* Back link */}
                            <Link
                                href={themes.index.url()}
                                className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-200"
                            >
                                ← Back
                            </Link>
                        </div>
                    </div>

                    {/* Monaco */}
                    <div className="relative flex-1">
                        {loadingFile && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                            </div>
                        )}

                        {!selectedFile && !loadingFile && (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-600 select-none">
                                <FileIcon className="h-16 w-16 opacity-10" />
                                <p className="text-sm">
                                    Open a file from the explorer to start
                                    editing
                                </p>
                                <p className="text-xs opacity-60">
                                    Supported: PHP, HTML, Blade, CSS, JS, TS,
                                    JSON, MD & more
                                </p>
                            </div>
                        )}

                        {selectedFile && (
                            <Editor
                                height="100%"
                                language={getLanguage(selectedFile.name)}
                                value={content}
                                onChange={handleEditorChange}
                                theme="vs-dark"
                                loading={
                                    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                                    </div>
                                }
                                options={{
                                    fontSize: 14,
                                    fontFamily:
                                        "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                                    fontLigatures: true,
                                    lineNumbers: 'on',
                                    minimap: { enabled: true },
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'off',
                                    tabSize: 4,
                                    insertSpaces: true,
                                    automaticLayout: true,
                                    bracketPairColorization: { enabled: true },
                                    renderLineHighlight: 'all',
                                    smoothScrolling: true,
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: 'on',
                                    padding: { top: 12, bottom: 12 },
                                    scrollbar: {
                                        verticalScrollbarSize: 8,
                                        horizontalScrollbarSize: 8,
                                    },
                                }}
                            />
                        )}
                    </div>

                    {/* Status bar */}
                    <div className="flex h-6 shrink-0 items-center justify-between border-t border-white/10 bg-[#007acc] px-3">
                        <div className="flex items-center gap-4 text-[11px] text-white/90">
                            <span className="font-medium">⌂ {theme_name}</span>
                            {selectedFile && (
                                <span className="opacity-80">
                                    {selectedFile.path}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-white/90">
                            {selectedFile && (
                                <span className="capitalize">
                                    {getLanguage(selectedFile.name)}
                                </span>
                            )}
                            {isDirty && (
                                <span className="font-medium text-orange-200">
                                    ● Unsaved changes
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Dialog
                open={createKind !== null}
                onOpenChange={(open) => {
                    if (!open && !creating) {
                        setCreateKind(null);
                        setNewEntryName('');
                    }
                }}
            >
                <DialogContent>
                    <form onSubmit={handleCreateEntry} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                Create{' '}
                                {createKind === 'file' ? 'file' : 'folder'}
                            </DialogTitle>
                            <DialogDescription>
                                Created in{' '}
                                <span className="font-medium text-foreground">
                                    {selectedDirectoryPath || '/'}
                                </span>
                                {createKind === 'file' &&
                                    ' (use a supported file extension such as .blade.php, .css, .js, .json, or .md).'}
                            </DialogDescription>
                        </DialogHeader>
                        <Input
                            autoFocus
                            value={newEntryName}
                            onChange={(event) =>
                                setNewEntryName(event.target.value)
                            }
                            placeholder={
                                createKind === 'file'
                                    ? 'example.blade.php'
                                    : 'components'
                            }
                            aria-label={
                                createKind === 'file'
                                    ? 'File name'
                                    : 'Folder name'
                            }
                            required
                            maxLength={255}
                            disabled={creating}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={creating}
                                onClick={() => setCreateKind(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating}>
                                {creating && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Create{' '}
                                {createKind === 'file' ? 'file' : 'folder'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={fileToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setFileToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete theme file?</DialogTitle>
                        <DialogDescription>
                            Delete{' '}
                            <span className="font-medium text-foreground">
                                {fileToDelete?.path}
                            </span>
                            ? This action cannot be undone.
                            {fileToDelete?.path === selectedFile?.path &&
                                isDirty &&
                                ' Your unsaved changes will also be lost.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deleting}
                            onClick={() => setFileToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleting}
                            onClick={() => void handleDeleteFile()}
                        >
                            {deleting && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Delete file
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ThemeEditor.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Themes', href: themes.index.url() },
        { title: 'Editor' },
    ],
};

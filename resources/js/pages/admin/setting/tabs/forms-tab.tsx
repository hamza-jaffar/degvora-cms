import ConfirmationModal from "@/components/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Form, FormField, FormFieldType } from "@/types/data";
import { Link, router, useForm } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    Copy,
    Eye,
    FileText,
    Inbox,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FormsTabProps {
    forms: Form[];
}

const emptyField = (index: number): FormField => ({
    id: `f_${Date.now()}_${index}`,
    name: `field_${index + 1}`,
    label: `Field ${index + 1}`,
    type: "text",
    placeholder: "",
    help_text: "",
    required: false,
    width: "full",
    options: [],
});

const PRESET_TEMPLATES: Record<
    string,
    {
        name: string;
        slug: string;
        description: string;
        notification_email: string;
        submit_button_text: string;
        success_message: string;
        fields: FormField[];
    }
> = {
    contact: {
        name: "Contact Us",
        slug: "contact-us",
        description:
            "General inquiry and customer contact form for your website visitors.",
        notification_email: "",
        submit_button_text: "Send Message",
        success_message:
            "Thank you for contacting us! Our team will get back to you shortly.",
        fields: [
            {
                id: "c_name",
                name: "full_name",
                label: "Full Name",
                type: "text",
                placeholder: "John Doe",
                required: true,
                width: "half",
            },
            {
                id: "c_email",
                name: "email",
                label: "Email Address",
                type: "email",
                placeholder: "john@example.com",
                required: true,
                width: "half",
            },
            {
                id: "c_phone",
                name: "phone",
                label: "Phone Number",
                type: "tel",
                placeholder: "+1 234 567 890",
                required: false,
                width: "half",
            },
            {
                id: "c_subject",
                name: "subject",
                label: "Subject",
                type: "text",
                placeholder: "How can we help?",
                required: true,
                width: "half",
            },
            {
                id: "c_message",
                name: "message",
                label: "Message",
                type: "textarea",
                placeholder: "Write your message here...",
                required: true,
                width: "full",
            },
        ],
    },
    access: {
        name: "Access Request",
        slug: "access",
        description:
            "Request account, beta access, or portal credentials form.",
        notification_email: "",
        submit_button_text: "Request Access",
        success_message:
            "Your access request has been received. We are reviewing your application.",
        fields: [
            {
                id: "a_name",
                name: "full_name",
                label: "Full Name",
                type: "text",
                placeholder: "Jane Smith",
                required: true,
                width: "half",
            },
            {
                id: "a_work_email",
                name: "work_email",
                label: "Work Email",
                type: "email",
                placeholder: "jane@company.com",
                required: true,
                width: "half",
            },
            {
                id: "a_company",
                name: "company_name",
                label: "Company / Organization",
                type: "text",
                placeholder: "Acme Corp",
                required: true,
                width: "half",
            },
            {
                id: "a_role",
                name: "job_title",
                label: "Job Title / Role",
                type: "text",
                placeholder: "Engineering Lead",
                required: false,
                width: "half",
            },
            {
                id: "a_reason",
                name: "reason",
                label: "Reason for Access",
                type: "textarea",
                placeholder: "Please describe your use case or requirements...",
                required: true,
                width: "full",
            },
        ],
    },
    claim: {
        name: "Claim Form",
        slug: "claim",
        description:
            "Product warranty, return, or claim submission form for customers.",
        notification_email: "",
        submit_button_text: "Submit Claim",
        success_message:
            "Your claim has been registered. Our support team will inspect the details.",
        fields: [
            {
                id: "cl_name",
                name: "customer_name",
                label: "Customer Name",
                type: "text",
                placeholder: "Alex Johnson",
                required: true,
                width: "half",
            },
            {
                id: "cl_email",
                name: "email",
                label: "Email Address",
                type: "email",
                placeholder: "alex@example.com",
                required: true,
                width: "half",
            },
            {
                id: "cl_order",
                name: "order_number",
                label: "Order / Invoice Number",
                type: "text",
                placeholder: "#ORD-98214",
                required: true,
                width: "half",
            },
            {
                id: "cl_type",
                name: "claim_type",
                label: "Claim Type",
                type: "select",
                required: true,
                width: "half",
                options: [
                    "Damaged Item",
                    "Defective Unit",
                    "Missing Parts",
                    "Warranty Claim",
                    "Other",
                ],
            },
            {
                id: "cl_desc",
                name: "issue_details",
                label: "Issue Details",
                type: "textarea",
                placeholder:
                    "Provide comprehensive details about the issue...",
                required: true,
                width: "full",
            },
        ],
    },
};

export default function FormsTab({ forms }: FormsTabProps) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<Form | null>(null);
    const [formToDelete, setFormToDelete] = useState<Form | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    const form = useForm({
        name: "",
        slug: "",
        description: "",
        is_active: true,
        submit_button_text: "Submit",
        success_message: "Thank you! Your submission has been received.",
        notification_email: "",
        fields: [] as FormField[],
    });

    const openCreate = (templateKey?: string) => {
        setEditingForm(null);
        setPreviewMode(false);

        if (templateKey && PRESET_TEMPLATES[templateKey]) {
            const tmpl = PRESET_TEMPLATES[templateKey];
            form.setData({
                name: tmpl.name,
                slug: tmpl.slug,
                description: tmpl.description,
                is_active: true,
                submit_button_text: tmpl.submit_button_text,
                success_message: tmpl.success_message,
                notification_email: tmpl.notification_email,
                fields: JSON.parse(JSON.stringify(tmpl.fields)),
            });
        } else {
            form.setData({
                name: "",
                slug: "",
                description: "",
                is_active: true,
                submit_button_text: "Submit",
                success_message:
                    "Thank you! Your submission has been received.",
                notification_email: "",
                fields: [
                    {
                        id: `f_${Date.now()}_1`,
                        name: "full_name",
                        label: "Full Name",
                        type: "text",
                        placeholder: "John Doe",
                        required: true,
                        width: "full",
                    },
                    {
                        id: `f_${Date.now()}_2`,
                        name: "email",
                        label: "Email",
                        type: "email",
                        placeholder: "john@example.com",
                        required: true,
                        width: "full",
                    },
                    {
                        id: `f_${Date.now()}_3`,
                        name: "message",
                        label: "Message",
                        type: "textarea",
                        placeholder: "Your message...",
                        required: true,
                        width: "full",
                    },
                ],
            });
        }

        form.clearErrors();
        setEditorOpen(true);
    };

    const openEdit = (f: Form) => {
        setEditingForm(f);
        setPreviewMode(false);
        form.setData({
            name: f.name,
            slug: f.slug,
            description: f.description || "",
            is_active: f.is_active,
            submit_button_text: f.submit_button_text || "Submit",
            success_message:
                f.success_message ||
                "Thank you! Your submission has been received.",
            notification_email: f.notification_email || "",
            fields: JSON.parse(JSON.stringify(f.fields || [])),
        });
        form.clearErrors();
        setEditorOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.data.fields.length === 0) {
            toast.error("Please add at least one field to the form.");
            return;
        }

        if (editingForm) {
            form.put(`/admin/forms/${editingForm.slug}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditorOpen(false);
                    setEditingForm(null);
                },
            });
        } else {
            form.post("/admin/forms", {
                preserveScroll: true,
                onSuccess: () => {
                    setEditorOpen(false);
                },
            });
        }
    };

    const toggleStatus = (f: Form) => {
        router.post(
            `/admin/forms/${f.slug}/toggle`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const addField = () => {
        const next = emptyField(form.data.fields.length);
        form.setData("fields", [...form.data.fields, next]);
    };

    const removeField = (index: number) => {
        const updated = [...form.data.fields];
        updated.splice(index, 1);
        form.setData("fields", updated);
    };

    const updateField = (
        index: number,
        changes: Partial<FormField>,
    ) => {
        const updated = [...form.data.fields];
        updated[index] = { ...updated[index], ...changes };
        form.setData("fields", updated);
    };

    const moveField = (index: number, direction: "up" | "down") => {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= form.data.fields.length) {
            return;
        }
        const updated = [...form.data.fields];
        const [moved] = updated.splice(index, 1);
        updated.splice(target, 0, moved);
        form.setData("fields", updated);
    };

    const copyApiUrl = (slug: string) => {
        const url = `${window.location.origin}/forms/${slug}/submit`;
        navigator.clipboard.writeText(url);
        toast.success("Public submission URL copied to clipboard");
    };

    return (
        <Card id="settings-panel-forms">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        Form Module & Dynamic Submissions
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Build and manage custom forms (e.g. Contact Us, Access,
                        Claim). Active forms automatically populate dedicated
                        submission management pages in your dashboard sidebar.
                    </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={() => openCreate()}>
                        <Plus className="mr-1.5 size-4" />
                        Create Form
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* 1-Click Starter Templates */}
                <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Sparkles className="size-3.5 text-primary" />
                        Quick Starter Templates
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Click a template to quickly pre-populate standard fields
                        for common business needs:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-background hover:bg-muted"
                            onClick={() => openCreate("contact")}
                        >
                            + Contact Us Form
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-background hover:bg-muted"
                            onClick={() => openCreate("access")}
                        >
                            + Access Request Form
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-background hover:bg-muted"
                            onClick={() => openCreate("claim")}
                        >
                            + Warranty / Claim Form
                        </Button>
                    </div>
                </div>

                {/* Forms List */}
                {forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <FileText className="size-6 opacity-60" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold">
                            No forms created yet
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Create your first form to start collecting inquiries,
                            requests, or claims from your website visitors.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            className="mt-4"
                            onClick={() => openCreate()}
                        >
                            <Plus className="mr-1.5 size-4" /> Create Form
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.map((f) => (
                            <Card
                                key={f.id}
                                className={`flex flex-col justify-between transition-all ${
                                    f.is_active
                                        ? "border-border shadow-sm"
                                        : "opacity-75 bg-muted/20"
                                }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-base font-bold text-foreground">
                                                {f.name}
                                            </CardTitle>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                /{f.slug}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                f.is_active
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                    : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                                            }
                                        >
                                            {f.is_active
                                                ? "Enabled"
                                                : "Disabled"}
                                        </Badge>
                                    </div>
                                    {f.description && (
                                        <p className="line-clamp-2 mt-2 text-xs text-muted-foreground">
                                            {f.description}
                                        </p>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-4 pt-0">
                                    <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">
                                                Fields:
                                            </span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {(f.fields || []).length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Submissions:
                                            </span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {f.submissions_count ?? 0}
                                            </span>
                                            {typeof f.unread_submissions_count ===
                                                "number" &&
                                                f.unread_submissions_count >
                                                    0 && (
                                                    <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                        {
                                                            f.unread_submissions_count
                                                        }{" "}
                                                        new
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    {/* Action Links & Controls */}
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={f.is_active}
                                                onCheckedChange={() =>
                                                    toggleStatus(f)
                                                }
                                                aria-label={`Toggle ${f.name} status`}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {f.is_active
                                                    ? "Active in sidebar"
                                                    : "Hidden"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                title="Copy public submit endpoint"
                                                onClick={() =>
                                                    copyApiUrl(f.slug)
                                                }
                                            >
                                                <Copy className="size-3.5" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                title="Edit form"
                                                onClick={() => openEdit(f)}
                                            >
                                                <Pencil className="size-3.5" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                title="Delete form"
                                                onClick={() =>
                                                    setFormToDelete(f)
                                                }
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Link to view submissions */}
                                    <Link
                                        href={`/admin/forms/${f.slug}`}
                                        className="block"
                                    >
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full text-xs"
                                            size="sm"
                                        >
                                            <Inbox className="mr-1.5 size-3.5" />
                                            View Submissions
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Form Builder Dialog */}
            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <DialogTitle className="text-lg font-bold">
                                {editingForm
                                    ? `Edit Form: ${editingForm.name}`
                                    : "Create New Form"}
                            </DialogTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewMode(!previewMode)}
                            >
                                <Eye className="mr-1.5 size-3.5" />
                                {previewMode ? "Form Editor" : "Live Preview"}
                            </Button>
                        </div>
                        <DialogDescription>
                            Configure the form title, URL slug, field inputs, and
                            notification settings.
                        </DialogDescription>
                    </DialogHeader>

                    {previewMode ? (
                        /* Live Form Preview */
                        <div className="space-y-6 rounded-lg border bg-muted/10 p-6">
                            <div className="border-b pb-4">
                                <h3 className="text-xl font-bold">
                                    {form.data.name || "Form Title Preview"}
                                </h3>
                                {form.data.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {form.data.description}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {form.data.fields.map((fld) => (
                                    <div
                                        key={fld.id}
                                        className={`space-y-2 ${
                                            fld.width === "half"
                                                ? "sm:col-span-1"
                                                : "sm:col-span-2"
                                        }`}
                                    >
                                        <Label>
                                            {fld.label}{" "}
                                            {fld.required && (
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            )}
                                        </Label>
                                        {fld.type === "textarea" ? (
                                            <textarea
                                                rows={3}
                                                placeholder={fld.placeholder}
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                disabled
                                            />
                                        ) : fld.type === "select" ? (
                                            <select
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                disabled
                                            >
                                                <option value="">
                                                    {fld.placeholder ||
                                                        "Select an option..."}
                                                </option>
                                                {(fld.options || []).map(
                                                    (opt) => (
                                                        <option
                                                            key={opt}
                                                            value={opt}
                                                        >
                                                            {opt}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        ) : fld.type === "checkbox" ? (
                                            <div className="flex items-center gap-2 pt-1">
                                                <input
                                                    type="checkbox"
                                                    disabled
                                                    className="size-4 rounded"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {fld.placeholder ||
                                                        "I agree"}
                                                </span>
                                            </div>
                                        ) : (
                                            <Input
                                                type={fld.type}
                                                placeholder={fld.placeholder}
                                                disabled
                                            />
                                        )}
                                        {fld.help_text && (
                                            <p className="text-xs text-muted-foreground">
                                                {fld.help_text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button type="button" disabled className="w-full sm:w-auto">
                                {form.data.submit_button_text || "Submit"}
                            </Button>
                        </div>
                    ) : (
                        /* Form Editor */
                        <form onSubmit={handleSave} className="space-y-6">
                            {/* General Information */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="form_name">
                                        Form Name{" "}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="form_name"
                                        value={form.data.name}
                                        placeholder="e.g. Contact Us, Claim, Access"
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            form.setData({
                                                ...form.data,
                                                name,
                                                slug:
                                                    !editingForm && !form.data.slug
                                                        ? name
                                                              .toLowerCase()
                                                              .replace(
                                                                  /[^a-z0-9]+/g,
                                                                  "-",
                                                              )
                                                              .replace(
                                                                  /^-|-$/g,
                                                                  "",
                                                              )
                                                        : form.data.slug,
                                            });
                                        }}
                                        required
                                    />
                                    {form.errors.name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="form_slug">
                                        URL Slug{" "}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="form_slug"
                                        value={form.data.slug}
                                        placeholder="e.g. contact-us, access"
                                        onChange={(e) =>
                                            form.setData(
                                                "slug",
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9-]/g, ""),
                                            )
                                        }
                                        required
                                    />
                                    {form.errors.slug && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.slug}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="form_description">
                                        Description / Subtitle
                                    </Label>
                                    <Input
                                        id="form_description"
                                        value={form.data.description}
                                        placeholder="A brief message or instructions shown at the top of the form"
                                        onChange={(e) =>
                                            form.setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notification_email">
                                        Notification Email (Optional)
                                    </Label>
                                    <Input
                                        id="notification_email"
                                        type="email"
                                        value={form.data.notification_email}
                                        placeholder="alerts@yourdomain.com"
                                        onChange={(e) =>
                                            form.setData(
                                                "notification_email",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Receive email notifications whenever a
                                        new entry is submitted.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="submit_button_text">
                                        Submit Button Label
                                    </Label>
                                    <Input
                                        id="submit_button_text"
                                        value={form.data.submit_button_text}
                                        placeholder="Submit, Send Message, etc."
                                        onChange={(e) =>
                                            form.setData(
                                                "submit_button_text",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="success_message">
                                        Success Confirmation Message
                                    </Label>
                                    <Input
                                        id="success_message"
                                        value={form.data.success_message}
                                        placeholder="Thank you! Your submission has been received."
                                        onChange={(e) =>
                                            form.setData(
                                                "success_message",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* Fields Builder */}
                            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">
                                            Form Fields (
                                            {form.data.fields.length})
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Define the input controls for your
                                            form.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addField}
                                    >
                                        <Plus className="mr-1 size-3.5" />
                                        Add Field
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {form.data.fields.map((fld, idx) => (
                                        <div
                                            key={fld.id}
                                            className="rounded-lg border bg-card p-3.5 shadow-xs space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-2 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-semibold">
                                                        {fld.label ||
                                                            `Field ${idx + 1}`}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] uppercase font-mono"
                                                    >
                                                        {fld.type}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        disabled={idx === 0}
                                                        onClick={() =>
                                                            moveField(idx, "up")
                                                        }
                                                        title="Move up"
                                                    >
                                                        <ArrowUp className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        disabled={
                                                            idx ===
                                                            form.data.fields
                                                                .length -
                                                                1
                                                        }
                                                        onClick={() =>
                                                            moveField(
                                                                idx,
                                                                "down",
                                                            )
                                                        }
                                                        title="Move down"
                                                    >
                                                        <ArrowDown className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            removeField(idx)
                                                        }
                                                        title="Remove field"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-4">
                                                <div className="space-y-1 sm:col-span-2">
                                                    <Label className="text-xs">
                                                        Label
                                                    </Label>
                                                    <Input
                                                        value={fld.label}
                                                        placeholder="Label"
                                                        className="h-8 text-xs"
                                                        onChange={(e) => {
                                                            const label =
                                                                e.target.value;
                                                            updateField(idx, {
                                                                label,
                                                                name:
                                                                    fld.name ===
                                                                        `field_${idx + 1}` ||
                                                                    !fld.name
                                                                        ? label
                                                                              .toLowerCase()
                                                                              .replace(
                                                                                  /[^a-z0-9]+/g,
                                                                                  "_",
                                                                              )
                                                                              .replace(
                                                                                  /^_|_$/g,
                                                                                  "",
                                                                              )
                                                                        : fld.name,
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Key / Name
                                                    </Label>
                                                    <Input
                                                        value={fld.name}
                                                        placeholder="key_name"
                                                        className="h-8 font-mono text-xs"
                                                        onChange={(e) =>
                                                            updateField(idx, {
                                                                name: e.target.value.replace(
                                                                    /[^a-zA-Z0-9_]/g,
                                                                    "",
                                                                ),
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Input Type
                                                    </Label>
                                                    <Select
                                                        value={fld.type}
                                                        onValueChange={(val) =>
                                                            updateField(idx, {
                                                                type: val as FormFieldType,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">
                                                                Text
                                                            </SelectItem>
                                                            <SelectItem value="email">
                                                                Email
                                                            </SelectItem>
                                                            <SelectItem value="tel">
                                                                Phone / Tel
                                                            </SelectItem>
                                                            <SelectItem value="number">
                                                                Number
                                                            </SelectItem>
                                                            <SelectItem value="textarea">
                                                                Textarea
                                                            </SelectItem>
                                                            <SelectItem value="select">
                                                                Dropdown (Select)
                                                            </SelectItem>
                                                            <SelectItem value="radio">
                                                                Radio Buttons
                                                            </SelectItem>
                                                            <SelectItem value="checkbox">
                                                                Checkbox
                                                            </SelectItem>
                                                            <SelectItem value="date">
                                                                Date
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-4 items-center">
                                                <div className="space-y-1 sm:col-span-2">
                                                    <Label className="text-xs">
                                                        Placeholder / Help Text
                                                    </Label>
                                                    <Input
                                                        value={
                                                            fld.placeholder ||
                                                            ""
                                                        }
                                                        placeholder="Placeholder"
                                                        className="h-8 text-xs"
                                                        onChange={(e) =>
                                                            updateField(idx, {
                                                                placeholder:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Width
                                                    </Label>
                                                    <Select
                                                        value={
                                                            fld.width || "full"
                                                        }
                                                        onValueChange={(val) =>
                                                            updateField(idx, {
                                                                width: val as
                                                                    | "full"
                                                                    | "half",
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full">
                                                                Full (100%)
                                                            </SelectItem>
                                                            <SelectItem value="half">
                                                                Half (50%)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-center gap-2 pt-4">
                                                    <Switch
                                                        id={`req_${fld.id}`}
                                                        checked={fld.required}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            updateField(idx, {
                                                                required: checked,
                                                            })
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`req_${fld.id}`}
                                                        className="text-xs cursor-pointer"
                                                    >
                                                        Required
                                                    </Label>
                                                </div>
                                            </div>

                                            {/* Options for Select/Radio */}
                                            {(fld.type === "select" ||
                                                fld.type === "radio") && (
                                                <div className="rounded-md border bg-muted/30 p-2.5 space-y-2">
                                                    <Label className="text-xs font-semibold">
                                                        Options (comma separated
                                                        values)
                                                    </Label>
                                                    <Input
                                                        value={(
                                                            fld.options || []
                                                        ).join(", ")}
                                                        placeholder="Option 1, Option 2, Option 3"
                                                        className="h-8 text-xs bg-background"
                                                        onChange={(e) => {
                                                            const opts = e.target.value
                                                                .split(",")
                                                                .map((s) =>
                                                                    s.trim(),
                                                                );
                                                            updateField(idx, {
                                                                options: opts,
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditorOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : editingForm
                                          ? "Update Form"
                                          : "Create Form"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                open={formToDelete !== null}
                onOpenChange={(open) => !open && setFormToDelete(null)}
                title="Delete form?"
                description={
                    <>
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-foreground">
                            {formToDelete?.name}
                        </span>
                        ? This will also remove all associated form submissions.
                    </>
                }
                confirmLabel="Delete Form"
                destructive
                onConfirm={() => {
                    if (!formToDelete) {
                        return;
                    }
                    router.delete(`/admin/forms/${formToDelete.slug}`, {
                        preserveScroll: true,
                        onSuccess: () => setFormToDelete(null),
                    });
                }}
            />
        </Card>
    );
}

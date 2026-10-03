import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import menus from '@/routes/admin/menus';
import { Form, Link } from '@inertiajs/react';

type MenuRecord = {
    id: number;
    name: string;
    location: string | null;
};

export default function MenuForm({ menu }: { menu?: MenuRecord }) {
    const action = menu
        ? { action: menus.update.url(menu.id), method: 'put' as const }
        : { action: menus.store.url(), method: 'post' as const };

    return (
        <Form {...action} className="max-w-2xl space-y-6">
            {({ errors, processing }) => (
                <>
                    <section className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
                        <Heading
                            title="Menu details"
                            description="Give this menu a name and, if useful, a location your theme can reference later."
                            variant="small"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="name">Menu name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={menu?.name ?? ''}
                                placeholder="Main Menu"
                                maxLength={255}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Location{' '}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                defaultValue={menu?.location ?? ''}
                                placeholder="header"
                                maxLength={255}
                            />
                            <p className="text-xs text-muted-foreground">
                                A short identifier such as <code>header</code>{' '}
                                or <code>footer</code>.
                            </p>
                            <InputError message={errors.location} />
                        </div>
                    </section>

                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving…'
                                : menu
                                  ? 'Save changes'
                                  : 'Create menu'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={menus.index.url()}>Cancel</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

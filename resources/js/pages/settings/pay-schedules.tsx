import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SettingsLayout from '@/layouts/settings/layout';
import { store as storeSchedule, destroy as destroySchedule } from '@/routes/pay-schedules';

interface PaySchedule {
    id: number;
    name: string;
    amount: string;
    cadence: string;
    recurrence_interval: number;
    next_pay_date: string;
    is_primary: boolean;
    notes?: string | null;
}

interface PageProps {
    schedules: PaySchedule[];
    cadenceOptions: string[];
}

export default function PaySchedules() {
    const { props } = usePage<PageProps>();
    const { schedules, cadenceOptions } = props;

    const form = useForm({
        name: '',
        amount: '',
        cadence: 'fortnightly',
        recurrence_interval: 1,
        next_pay_date: '',
        is_primary: false,
        notes: '',
    });

    const cadenceLabels = useMemo(() => ({
        weekly: 'Weekly',
        fortnightly: 'Fortnightly',
        monthly: 'Monthly',
    }), []);

    return (
        <>
            <Head title="Pay schedules" />

            <Heading
                variant="small"
                title="Pay schedules"
                description="Create and manage the pay cycles that PlanYourPay will use to plan each period."
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Add a pay schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(storeSchedule(), {
                                    preserveScroll: true,
                                    onSuccess: () => form.reset('name', 'amount', 'next_pay_date', 'notes'),
                                });
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name">Label</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Primary salary"
                                />
                                {form.errors.name && (
                                    <p className="text-sm text-destructive">{form.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Net amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    placeholder="4000"
                                />
                                {form.errors.amount && (
                                    <p className="text-sm text-destructive">{form.errors.amount}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cadence">Cadence</Label>
                                <select
                                    id="cadence"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.data.cadence}
                                    onChange={(e) => form.setData('cadence', e.target.value)}
                                >
                                    {cadenceOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {cadenceLabels[option as keyof typeof cadenceLabels] || option}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.cadence && (
                                    <p className="text-sm text-destructive">{form.errors.cadence}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recurrence_interval">Repeat every</Label>
                                <Input
                                    id="recurrence_interval"
                                    type="number"
                                    min={1}
                                    value={form.data.recurrence_interval}
                                    onChange={(e) =>
                                        form.setData('recurrence_interval', Number(e.target.value) || 1)
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    Number of cadence cycles between pays (use 1 for every cycle).
                                </p>
                                {form.errors.recurrence_interval && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.recurrence_interval}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="next_pay_date">Next pay date</Label>
                                <Input
                                    id="next_pay_date"
                                    type="date"
                                    value={form.data.next_pay_date}
                                    onChange={(e) => form.setData('next_pay_date', e.target.value)}
                                />
                                {form.errors.next_pay_date && (
                                    <p className="text-sm text-destructive">{form.errors.next_pay_date}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_primary"
                                    checked={form.data.is_primary}
                                    onCheckedChange={(checked) =>
                                        form.setData('is_primary', Boolean(checked))
                                    }
                                />
                                <Label htmlFor="is_primary">Treat as primary pay schedule</Label>
                            </div>
                            {form.errors.is_primary && (
                                <p className="text-sm text-destructive">{form.errors.is_primary}</p>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={form.processing}>
                                Save schedule
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing schedules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {schedules.length === 0 && (
                            <p className="text-sm text-muted-foreground">No pay schedules yet.</p>
                        )}

                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="rounded-2xl border border-border p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-base font-medium">
                                            {schedule.name}
                                            {schedule.is_primary && (
                                                <span className="ml-2 text-xs text-primary">
                                                    Primary
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            ${Number(schedule.amount).toLocaleString()} ·{' '}
                                            {cadenceLabels[schedule.cadence as keyof typeof cadenceLabels]}
                                        </p>
                                    </div>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            router.delete(destroySchedule({
                                                routeParams: { paySchedule: schedule.id },
                                            }), { preserveScroll: true });
                                        }}
                                    >
                                        <Button variant="ghost" type="submit">
                                            Remove
                                        </Button>
                                    </form>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Next pay {schedule.next_pay_date}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PaySchedules.layout = (page: React.ReactNode) => (
    <SettingsLayout>{page}</SettingsLayout>
);

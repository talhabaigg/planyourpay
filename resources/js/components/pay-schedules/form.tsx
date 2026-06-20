import type { UseFormReturnType } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PayScheduleFormData = {
    name: string;
    amount: string | number;
    cadence: string;
    recurrence_interval: number;
    next_pay_date: string;
    is_primary: boolean;
    notes: string;
};

interface Props {
    form: UseFormReturnType<PayScheduleFormData>;
    cadenceOptions: string[];
    onSubmit: () => void;
    submitLabel: string;
}

const cadenceLabels: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
};

export default function PayScheduleForm({
    form,
    cadenceOptions,
    onSubmit,
    submitLabel,
}: Props) {
    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
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
                    <p className="text-sm text-destructive">
                        {form.errors.name}
                    </p>
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
                    <p className="text-sm text-destructive">
                        {form.errors.amount}
                    </p>
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
                            {cadenceLabels[option] ?? option}
                        </option>
                    ))}
                </select>
                {form.errors.cadence && (
                    <p className="text-sm text-destructive">
                        {form.errors.cadence}
                    </p>
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
                        form.setData(
                            'recurrence_interval',
                            Number(e.target.value) || 1,
                        )
                    }
                />
                <p className="text-sm text-muted-foreground">
                    Number of cadence cycles between pays (use 1 for every
                    cycle).
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
                    onChange={(e) =>
                        form.setData('next_pay_date', e.target.value)
                    }
                />
                {form.errors.next_pay_date && (
                    <p className="text-sm text-destructive">
                        {form.errors.next_pay_date}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Checkbox
                    id="is_primary"
                    checked={form.data.is_primary}
                    onCheckedChange={(checked) =>
                        form.setData('is_primary', Boolean(checked))
                    }
                />
                <Label htmlFor="is_primary">
                    Treat as primary pay schedule
                </Label>
            </div>

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
                {submitLabel}
            </Button>
        </form>
    );
}

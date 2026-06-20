import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types/navigation';
import {
    destroy as commitmentsDestroy,
    index as commitmentsIndex,
    store as commitmentsStore,
    update as commitmentsUpdate,
} from '@/routes/commitments';
import { index as payCyclesIndex } from '@/routes/pay-cycles';

interface CommitmentSummary {
    id: number;
    name: string;
    amount: string;
    recurrence_type: string;
    recurrence_interval: number;
    first_due_date: string | null;
    category?: string | null;
    notes?: string | null;
    active: boolean;
}

type CommitmentFormData = {
    name: string;
    amount: string;
    recurrence_type: string;
    recurrence_interval: number;
    first_due_date: string;
    category: string;
    notes: string;
    active: boolean;
};

const recurrenceOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'fortnightly', label: 'Fortnightly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
    { value: 'one_time', label: 'One-off' },
];

const emptyForm: CommitmentFormData = {
    name: '',
    amount: '',
    recurrence_type: 'fortnightly',
    recurrence_interval: 1,
    first_due_date: '',
    category: '',
    notes: '',
    active: true,
};

const serializeCommitment = (
    commitment: CommitmentSummary,
    overrides: Partial<CommitmentFormData> = {},
): CommitmentFormData => ({
    name: commitment.name ?? '',
    amount: commitment.amount ?? '',
    recurrence_type: commitment.recurrence_type ?? 'fortnightly',
    recurrence_interval: commitment.recurrence_interval ?? 1,
    first_due_date: commitment.first_due_date ?? '',
    category: commitment.category ?? '',
    notes: commitment.notes ?? '',
    active: commitment.active,
    ...overrides,
});

export default function CommitmentsIndex() {
    const { commitments = [] } = usePage<{ commitments: CommitmentSummary[] }>().props;
    const [editingId, setEditingId] = useState<number | null>(null);

    const createForm = useForm<CommitmentFormData>({ ...emptyForm });
    const editForm = useForm<CommitmentFormData>({ ...emptyForm });

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 2,
            }),
        []
    );

    const describeCadence = (commitment: CommitmentSummary) => {
        if (commitment.recurrence_type === 'one_time') {
            return 'Single payment';
        }

        if (commitment.recurrence_interval <= 1) {
            return recurrenceOptions.find((option) => option.value === commitment.recurrence_type)?.label ?? commitment.recurrence_type;
        }

        const baseLabel =
            recurrenceOptions.find((option) => option.value === commitment.recurrence_type)?.label ?? commitment.recurrence_type;

        return `${baseLabel} · every ${commitment.recurrence_interval}`;
    };

    const handleCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createForm.post(commitmentsStore().url, {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEditing = (commitment: CommitmentSummary) => {
        setEditingId(commitment.id);
        editForm.setData(serializeCommitment(commitment));
    };

    const cancelEditing = () => {
        setEditingId(null);
        editForm.reset();
    };

    const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingId) return;

        editForm.put(commitmentsUpdate({ commitment: editingId }).url, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                editForm.reset();
            },
        });
    };

    const handleToggle = (commitment: CommitmentSummary) => {
        const payload = serializeCommitment(commitment, { active: !commitment.active });

        router.put(commitmentsUpdate({ commitment: commitment.id }).url, payload, {
            preserveScroll: true,
        });
    };

    const handleDelete = (commitment: CommitmentSummary) => {
        if (!window.confirm(`Remove ${commitment.name}?`)) {
            return;
        }

        router.delete(commitmentsDestroy({ commitment: commitment.id }).url, {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6 p-4">
            <Head title="Commitments" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Commitments</h1>
                    <p className="text-sm text-muted-foreground">
                        Recurring outflows (mortgage, rent, memberships) that pre-fill every pay cycle. One-offs stay on pay cycles only.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={payCyclesIndex().url}>Back to pay cycles</Link>
                    </Button>
                </div>
            </div>

            <Card className="border-border bg-muted/40">
                <CardContent className="space-y-2 py-4 text-sm text-muted-foreground">
                    <p>
                        Add a commitment once and we&apos;ll carry it into future cycles. Pause a commitment any time to keep it from reserving cash.
                        On the Pay cycles screen, the upcoming "Save as recurring" toggle will copy an entry into this list automatically.
                    </p>
                </CardContent>
            </Card>

            <Card className="border border-border">
                <CardHeader>
                    <div>
                        <p className="text-lg font-semibold">New commitment</p>
                        <p className="text-sm text-muted-foreground">Define the recurring outflow you want every cycle to honor.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-name">Name</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(event) => createForm.setData('name', event.target.value)}
                                    placeholder="Mortgage"
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-amount">Amount</Label>
                                <Input
                                    id="create-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={createForm.data.amount}
                                    onChange={(event) => createForm.setData('amount', event.target.value)}
                                    placeholder="1400"
                                />
                                <InputError message={createForm.errors.amount} />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Cadence</Label>
                                <Select
                                    value={createForm.data.recurrence_type}
                                    onValueChange={(value) => createForm.setData('recurrence_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose cadence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {recurrenceOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.recurrence_type} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-interval">Interval</Label>
                                <Input
                                    id="create-interval"
                                    type="number"
                                    min={1}
                                    max={52}
                                    value={createForm.data.recurrence_interval}
                                    onChange={(event) =>
                                        createForm.setData('recurrence_interval', Number(event.target.value) || 1)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">Use 1 for every cycle, 2 for every second cycle, etc.</p>
                                <InputError message={createForm.errors.recurrence_interval} />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create-date">First due date</Label>
                                <Input
                                    id="create-date"
                                    type="date"
                                    value={createForm.data.first_due_date}
                                    onChange={(event) => createForm.setData('first_due_date', event.target.value)}
                                />
                                <InputError message={createForm.errors.first_due_date} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-category">Category</Label>
                                <Input
                                    id="create-category"
                                    value={createForm.data.category}
                                    onChange={(event) => createForm.setData('category', event.target.value)}
                                    placeholder="Housing"
                                />
                                <InputError message={createForm.errors.category} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-notes">Notes</Label>
                            <textarea
                                id="create-notes"
                                className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                value={createForm.data.notes}
                                onChange={(event) => createForm.setData('notes', event.target.value)}
                                placeholder="Anything special about this payment"
                            />
                            <InputError message={createForm.errors.notes} />
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-dashed p-3">
                            <Checkbox
                                id="create-active"
                                checked={createForm.data.active}
                                onCheckedChange={(checked) => createForm.setData('active', checked === true)}
                            />
                            <div>
                                <Label htmlFor="create-active">Active</Label>
                                <p className="text-xs text-muted-foreground">Pause to keep this out of future cycles.</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="w-full sm:w-auto"
                            >
                                Save commitment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {commitments.length === 0 && (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No commitments yet. Add your mortgage, rent, utilities, or subscriptions so future pay cycles can pre-fill them.
                        </CardContent>
                    </Card>
                )}

                {commitments.map((commitment) => {
                    const isEditing = editingId === commitment.id;

                    return (
                        <Card key={commitment.id} className="border border-border">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <p className="text-lg font-semibold text-foreground">{commitment.name}</p>
                                    {commitment.category && (
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{commitment.category}</p>
                                    )}
                                    {!isEditing && commitment.notes && (
                                        <p className="mt-1 text-xs text-muted-foreground">{commitment.notes}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant={commitment.active ? 'secondary' : 'outline'}>
                                        {commitment.active ? 'Active' : 'Paused'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {describeCadence(commitment)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {isEditing ? (
                                    <form className="space-y-4" onSubmit={handleEditSubmit}>
                                        <div className="grid gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-name-${commitment.id}`}>Name</Label>
                                                <Input
                                                    id={`edit-name-${commitment.id}`}
                                                    value={editForm.data.name}
                                                    onChange={(event) => editForm.setData('name', event.target.value)}
                                                />
                                                <InputError message={editForm.errors.name} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-amount-${commitment.id}`}>Amount</Label>
                                                <Input
                                                    id={`edit-amount-${commitment.id}`}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.data.amount}
                                                    onChange={(event) => editForm.setData('amount', event.target.value)}
                                                />
                                                <InputError message={editForm.errors.amount} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Cadence</Label>
                                                <Select
                                                    value={editForm.data.recurrence_type}
                                                    onValueChange={(value) => editForm.setData('recurrence_type', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {recurrenceOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={editForm.errors.recurrence_type} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-interval-${commitment.id}`}>Interval</Label>
                                                <Input
                                                    id={`edit-interval-${commitment.id}`}
                                                    type="number"
                                                    min={1}
                                                    max={52}
                                                    value={editForm.data.recurrence_interval}
                                                    onChange={(event) =>
                                                        editForm.setData('recurrence_interval', Number(event.target.value) || 1)
                                                    }
                                                />
                                                <InputError message={editForm.errors.recurrence_interval} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-date-${commitment.id}`}>First due date</Label>
                                                <Input
                                                    id={`edit-date-${commitment.id}`}
                                                    type="date"
                                                    value={editForm.data.first_due_date}
                                                    onChange={(event) => editForm.setData('first_due_date', event.target.value)}
                                                />
                                                <InputError message={editForm.errors.first_due_date} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-category-${commitment.id}`}>Category</Label>
                                                <Input
                                                    id={`edit-category-${commitment.id}`}
                                                    value={editForm.data.category}
                                                    onChange={(event) => editForm.setData('category', event.target.value)}
                                                />
                                                <InputError message={editForm.errors.category} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`edit-notes-${commitment.id}`}>Notes</Label>
                                                <textarea
                                                    id={`edit-notes-${commitment.id}`}
                                                    className="min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                    value={editForm.data.notes}
                                                    onChange={(event) => editForm.setData('notes', event.target.value)}
                                                />
                                                <InputError message={editForm.errors.notes} />
                                            </div>
                                            <div className="flex items-center gap-2 rounded-xl border border-dashed p-3">
                                                <Checkbox
                                                    id={`edit-active-${commitment.id}`}
                                                    checked={editForm.data.active}
                                                    onCheckedChange={(checked) => editForm.setData('active', checked === true)}
                                                />
                                                <div>
                                                    <Label htmlFor={`edit-active-${commitment.id}`}>Active</Label>
                                                    <p className="text-xs text-muted-foreground">Paused commitments skip future cycles.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button type="submit" size="sm" disabled={editForm.processing}>
                                                Save
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl bg-muted/40 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Amount</span>
                                                <span className="font-medium">
                                                    {currencyFormatter.format(Number(commitment.amount))}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-muted-foreground">Cadence</span>
                                                <span className="font-medium text-foreground">{describeCadence(commitment)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-muted-foreground">Next due</span>
                                                <span className="font-medium text-foreground">
                                                    {commitment.first_due_date ?? '—'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button variant="outline" size="sm" onClick={() => startEditing(commitment)}>
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(commitment)}
                                            >
                                                {commitment.active ? 'Pause' : 'Resume'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(commitment)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

CommitmentsIndex.l
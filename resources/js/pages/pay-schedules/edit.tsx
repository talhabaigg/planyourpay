import { Head, useForm, usePage } from '@inertiajs/react';
import type { PayScheduleFormData } from '@/components/pay-schedules/form';
import PayScheduleForm from '@/components/pay-schedules/form';
import {
    update as paySchedulesUpdate,
    index as paySchedulesIndex,
} from '@/routes/pay-schedules';

interface PayScheduleResource {
    id: number;
    name: string;
    amount: string;
    cadence: string;
    recurrence_interval: number;
    next_pay_date: string;
    is_primary: boolean;
    notes?: string | null;
}

export default function PaySchedulesEdit() {
    const { schedule, cadenceOptions = ['weekly', 'fortnightly', 'monthly'] } =
        usePage<{ schedule: PayScheduleResource; cadenceOptions: string[] }>()
            .props;

    const form = useForm<PayScheduleFormData>({
        name: schedule.name,
        amount: schedule.amount,
        cadence: schedule.cadence,
        recurrence_interval: schedule.recurrence_interval,
        next_pay_date: schedule.next_pay_date,
        is_primary: schedule.is_primary,
        notes: schedule.notes ?? '',
    });

    return (
        <div className="space-y-6 p-4">
            <Head title={`Edit ${schedule.name}`} />
            <div>
                <h1 className="text-2xl font-semibold">Edit {schedule.name}</h1>
                <p className="text-sm text-muted-foreground">
                    Update cadence, amount, or notes for this pay schedule.
                </p>
            </div>

            <PayScheduleForm
                form={form}
                cadenceOptions={cadenceOptions}
                submitLabel="Save changes"
                onSubmit={() =>
                    form.put(
                        paySchedulesUpdate({ pay_schedule: schedule.id }).url,
                        {
                            preserveScroll: true,
                        },
                    )
                }
            />
        </div>
    );
}

PaySchedulesEdit.layout = {
    breadcrumbs: [
        {
            title: 'Pay schedules',
            href: paySchedulesIndex().url,
        },
        {
            title: 'Edit',
            href: '#',
        },
    ],
};

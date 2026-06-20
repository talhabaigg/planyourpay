import { Head, useForm, usePage } from '@inertiajs/react';
import PayScheduleForm, { PayScheduleFormData } from '@/components/pay-schedules/form';
import { store as paySchedulesStore, index as paySchedulesIndex } from '@/routes/pay-schedules';

export default function PaySchedulesCreate() {
    const { cadenceOptions = ['weekly', 'fortnightly', 'monthly'] } = usePage<{ cadenceOptions: string[] }>().props;

    const form = useForm<PayScheduleFormData>({
        name: '',
        amount: '',
        cadence: cadenceOptions[1] ?? 'fortnightly',
        recurrence_interval: 1,
        next_pay_date: '',
        is_primary: false,
        notes: '',
    });

    return (
        <div className="space-y-6 p-4">
            <Head title="Add pay schedule" />
            <div>
                <h1 className="text-2xl font-semibold">Add pay schedule</h1>
                <p className="text-sm text-muted-foreground">
                    Define a recurring pay to feed future planning periods.
                </p>
            </div>

            <PayScheduleForm
                form={form}
                cadenceOptions={cadenceOptions}
                submitLabel="Create schedule"
                onSubmit={() =>
                    form.post(paySchedulesStore().url, {
                        preserveScroll: true,
                        onSuccess: () => form.reset(),
                    })
                }
            />
        </div>
    );
}

PaySchedulesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Pay schedules',
            href: paySchedulesIndex().url,
        },
        {
            title: 'Create',
            href: '#',
        },
    ],
};

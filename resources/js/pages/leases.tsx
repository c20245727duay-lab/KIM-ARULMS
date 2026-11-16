import AppLayout from '@/layouts/app-layout';
import { ApiError, apiRequest, getErrorMessage, type ApiValidationErrors, type PaginatedResponse } from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Leases', href: '/leases' },
];

type Tenant = {
    tenant_id: number;
    tenant_name: string;
    tenant_email: string;
};

type VacantUnit = {
    apartment_unit_id: number;
    unit_number: string;
    monthly_rent: number | string;
    building?: { building_block: string };
};

type LeaseOptions = {
    tenants: Tenant[];
    vacant_units: VacantUnit[];
};

type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';

type UtilityBill = {
    utility_charge: number | string;
    total_due: number | string;
    payment_status: PaymentStatus;
};

type Lease = {
    lease_id: number;
    lease_start: string;
    lease_end: string;
    monthly_rent: number | string;
    security_deposit: number | string;
    tenant?: Tenant;
    apartment_unit?: {
        unit_number: string;
        building?: { building_block: string };
    };
    utility_bills?: UtilityBill[];
};

type LeaseForm = {
    tenant_id: string;
    apartment_unit_id: string;
    monthly_rent: string;
    security_deposit: string;
    lease_start: string;
    lease_end: string;
    utility_charge: string;
    payment_status: PaymentStatus;
};

type TenantForm = {
    tenant_name: string;
    tenant_email: string;
    tenant_phone: string;
};

const fieldClassName =
    'mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100';

const formatInputDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (dateValue: string, days: number): string => {
    const [year, month, day] = dateValue.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    date.setDate(date.getDate() + days);
    return formatInputDate(date);
};

const emptyLeaseForm = (): LeaseForm => {
    const start = formatInputDate(new Date());

    return {
        tenant_id: '',
        apartment_unit_id: '',
        monthly_rent: '',
        security_deposit: '',
        lease_start: start,
        lease_end: addDays(start, 30),
        utility_charge: '0',
        payment_status: 'Pending',
    };
};

const emptyTenantForm = (): TenantForm => ({
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
});

export default function Leases() {
    const [leases, setLeases] = useState<Lease[]>([]);
    const [options, setOptions] = useState<LeaseOptions>({ tenants: [], vacant_units: [] });
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [formMode, setFormMode] = useState<'lease' | 'tenant' | null>(null);
    const [leaseForm, setLeaseForm] = useState<LeaseForm>(emptyLeaseForm);
    const [tenantForm, setTenantForm] = useState<TenantForm>(emptyTenantForm);
    const [formErrors, setFormErrors] = useState<ApiValidationErrors>({});
    const [saving, setSaving] = useState(false);
    const [updatingLeaseId, setUpdatingLeaseId] = useState<number | null>(null);
    const [paymentDrafts, setPaymentDrafts] = useState<Record<number, PaymentStatus>>({});
    const [notice, setNotice] = useState('');

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setLoadError('');

            try {
                const [leaseResponse, optionResponse] = await Promise.all([
                    apiRequest<PaginatedResponse<Lease>>(`/api/leases?page=${page}`),
                    apiRequest<LeaseOptions>('/api/leases/create'),
                ]);

                if (!active) return;

                setLeases(leaseResponse.data);
                setLastPage(leaseResponse.last_page);
                setTotal(leaseResponse.total);
                setOptions(optionResponse);
            } catch (error) {
                if (active) setLoadError(getErrorMessage(error));
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [page, refreshKey]);

    const startLease = () => {
        setLeaseForm(emptyLeaseForm());
        setFormErrors({});
        setFormMode('lease');
        setNotice('');
    };

    const startTenant = () => {
        setTenantForm(emptyTenantForm());
        setFormErrors({});
        setFormMode('tenant');
        setNotice('');
    };

    const saveLease = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setFormErrors({});
        setNotice('');

        try {
            await apiRequest('/api/leases', {
                method: 'POST',
                body: JSON.stringify({
                    ...leaseForm,
                    tenant_id: Number(leaseForm.tenant_id),
                    apartment_unit_id: Number(leaseForm.apartment_unit_id),
                    monthly_rent: Number(leaseForm.monthly_rent),
                    security_deposit: Number(leaseForm.security_deposit),
                    utility_charge: Number(leaseForm.utility_charge),
                }),
            });
            setFormMode(null);
            setNotice('Lease created and the apartment unit is now occupied.');
            setPage(1);
            setRefreshKey((key) => key + 1);
        } catch (error) {
            if (error instanceof ApiError) setFormErrors(error.validationErrors);
            else setLoadError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const saveTenant = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setFormErrors({});
        setNotice('');

        try {
            await apiRequest('/api/tenants', {
                method: 'POST',
                body: JSON.stringify(tenantForm),
            });
            setFormMode(null);
            setNotice('Tenant created.');
            setRefreshKey((key) => key + 1);
        } catch (error) {
            if (error instanceof ApiError) setFormErrors(error.validationErrors);
            else setLoadError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const updatePaymentStatus = async (leaseId: number) => {
        setUpdatingLeaseId(leaseId);
        setLoadError('');
        setNotice('');

        try {
            await apiRequest(`/api/leases/${leaseId}`, {
                method: 'PUT',
                body: JSON.stringify({ payment_status: paymentDrafts[leaseId] }),
            });
            setNotice('Payment status updated.');
            setRefreshKey((key) => key + 1);
        } catch (error) {
            setLoadError(getErrorMessage(error));
        } finally {
            setUpdatingLeaseId(null);
        }
    };

    const totalDue = Number(leaseForm.monthly_rent || 0) + Number(leaseForm.security_deposit || 0) + Number(leaseForm.utility_charge || 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leases" />
            <main className="flex flex-1 flex-col gap-6 p-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-sm text-neutral-500">Property management</p>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Leases</h1>
                        <p className="mt-1 text-sm text-neutral-500">{total} leases recorded</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={startTenant}
                            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                            Add tenant
                        </button>
                        <button
                            type="button"
                            onClick={startLease}
                            disabled={options.tenants.length === 0 || options.vacant_units.length === 0}
                            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                            Create lease
                        </button>
                    </div>
                </header>

                {notice && (
                    <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{notice}</p>
                )}
                {loadError && (
                    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                        {loadError}
                    </p>
                )}
                {!loading && options.tenants.length === 0 && (
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Add a tenant before creating a lease.
                    </p>
                )}
                {!loading && options.vacant_units.length === 0 && (
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        There are no vacant apartment units available to lease.
                    </p>
                )}

                {formMode && (
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                        {formMode === 'tenant' ? (
                            <form onSubmit={saveTenant} className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-lg font-semibold md:col-span-2">Add tenant</h2>
                                <FormField label="Full name" error={formErrors.tenant_name?.[0]}>
                                    <input
                                        className={fieldClassName}
                                        value={tenantForm.tenant_name}
                                        onChange={(event) => setTenantForm({ ...tenantForm, tenant_name: event.target.value })}
                                        maxLength={255}
                                        required
                                    />
                                </FormField>
                                <FormField label="Email" error={formErrors.tenant_email?.[0]}>
                                    <input
                                        type="email"
                                        className={fieldClassName}
                                        value={tenantForm.tenant_email}
                                        onChange={(event) => setTenantForm({ ...tenantForm, tenant_email: event.target.value })}
                                        maxLength={255}
                                        required
                                    />
                                </FormField>
                                <FormField label="Phone" error={formErrors.tenant_phone?.[0]}>
                                    <input
                                        type="tel"
                                        className={fieldClassName}
                                        value={tenantForm.tenant_phone}
                                        onChange={(event) => setTenantForm({ ...tenantForm, tenant_phone: event.target.value })}
                                        maxLength={30}
                                        required
                                    />
                                </FormField>
                                <div className="flex items-end gap-2">
                                    <FormActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Save tenant" />
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={saveLease} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <h2 className="text-lg font-semibold md:col-span-2 xl:col-span-3">Create lease</h2>
                                <FormField label="Tenant" error={formErrors.tenant_id?.[0]}>
                                    <select
                                        className={fieldClassName}
                                        value={leaseForm.tenant_id}
                                        onChange={(event) => setLeaseForm({ ...leaseForm, tenant_id: event.target.value })}
                                        required
                                    >
                                        <option value="">Select a tenant</option>
                                        {options.tenants.map((tenant) => (
                                            <option key={tenant.tenant_id} value={tenant.tenant_id}>
                                                {tenant.tenant_name} ({tenant.tenant_email})
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                                <FormField label="Vacant apartment unit" error={formErrors.apartment_unit_id?.[0]}>
                                    <select
                                        className={fieldClassName}
                                        value={leaseForm.apartment_unit_id}
                                        onChange={(event) => {
                                            const selectedId = event.target.value;
                                            const unit = options.vacant_units.find((item) => item.apartment_unit_id === Number(selectedId));
                                            setLeaseForm({
                                                ...leaseForm,
                                                apartment_unit_id: selectedId,
                                                monthly_rent: unit ? String(unit.monthly_rent) : '',
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select a vacant unit</option>
                                        {options.vacant_units.map((unit) => (
                                            <option key={unit.apartment_unit_id} value={unit.apartment_unit_id}>
                                                {unit.building?.building_block ?? 'Building'} · {unit.unit_number}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                                <FormField label="Monthly rent" error={formErrors.monthly_rent?.[0]}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={fieldClassName}
                                        value={leaseForm.monthly_rent}
                                        onChange={(event) => setLeaseForm({ ...leaseForm, monthly_rent: event.target.value })}
                                        required
                                    />
                                </FormField>
                                <FormField label="Security deposit" error={formErrors.security_deposit?.[0]}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={fieldClassName}
                                        value={leaseForm.security_deposit}
                                        onChange={(event) => setLeaseForm({ ...leaseForm, security_deposit: event.target.value })}
                                        required
                                    />
                                </FormField>
                                <FormField label="Lease start" error={formErrors.lease_start?.[0]}>
                                    <input
                                        type="date"
                                        min={formatInputDate(new Date())}
                                        className={fieldClassName}
                                        value={leaseForm.lease_start}
                                        onChange={(event) => {
                                            const start = event.target.value;
                                            const earliestEnd = addDays(start, 5);
                                            setLeaseForm({
                                                ...leaseForm,
                                                lease_start: start,
                                                lease_end: leaseForm.lease_end < earliestEnd ? earliestEnd : leaseForm.lease_end,
                                            });
                                        }}
                                        required
                                    />
                                </FormField>
                                <FormField label="Lease end (at least 5 days after start)" error={formErrors.lease_end?.[0]}>
                                    <input
                                        type="date"
                                        min={addDays(leaseForm.lease_start, 5)}
                                        className={fieldClassName}
                                        value={leaseForm.lease_end}
                                        onChange={(event) => setLeaseForm({ ...leaseForm, lease_end: event.target.value })}
                                        required
                                    />
                                </FormField>
                                <FormField label="Utility charge" error={formErrors.utility_charge?.[0]}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={fieldClassName}
                                        value={leaseForm.utility_charge}
                                        onChange={(event) => setLeaseForm({ ...leaseForm, utility_charge: event.target.value })}
                                        required
                                    />
                                </FormField>
                                <FormField label="Payment status" error={formErrors.payment_status?.[0]}>
                                    <select
                                        className={fieldClassName}
                                        value={leaseForm.payment_status}
                                        onChange={(event) =>
                                            setLeaseForm({
                                                ...leaseForm,
                                                payment_status: event.target.value as LeaseForm['payment_status'],
                                            })
                                        }
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </FormField>
                                <div className="flex items-end text-sm text-neutral-600 dark:text-neutral-300">
                                    Total due on creation: <strong className="ml-1">{formatAmount(totalDue)}</strong>
                                </div>
                                <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
                                    <FormActions saving={saving} onCancel={() => setFormMode(null)} submitLabel="Create lease" />
                                </div>
                            </form>
                        )}
                        {Object.values(formErrors).some((messages) => messages.length > 0) && (
                            <p role="alert" className="mt-3 text-sm text-red-600">
                                Please correct the highlighted fields.
                            </p>
                        )}
                    </section>
                )}

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-950">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Tenant</th>
                                    <th className="px-4 py-3 font-medium">Apartment unit</th>
                                    <th className="px-4 py-3 font-medium">Dates</th>
                                    <th className="px-4 py-3 font-medium">Monthly rent</th>
                                    <th className="px-4 py-3 font-medium">Total due</th>
                                    <th className="px-4 py-3 font-medium">Payment</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-neutral-500" colSpan={7}>
                                            Loading leases…
                                        </td>
                                    </tr>
                                ) : leases.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-neutral-500" colSpan={7}>
                                            No leases found.
                                        </td>
                                    </tr>
                                ) : (
                                    leases.map((lease) => {
                                        const bill = lease.utility_bills?.[0];
                                        const paymentStatus = paymentDrafts[lease.lease_id] ?? bill?.payment_status ?? 'Pending';

                                        return (
                                            <tr key={lease.lease_id}>
                                                <td className="px-4 py-3 font-medium">{lease.tenant?.tenant_name ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    {lease.apartment_unit?.building?.building_block ?? '—'} ·{' '}
                                                    {lease.apartment_unit?.unit_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
                                                </td>
                                                <td className="px-4 py-3">{formatAmount(lease.monthly_rent)}</td>
                                                <td className="px-4 py-3">{formatAmount(bill?.total_due ?? 0)}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        aria-label={`Payment status for lease ${lease.lease_id}`}
                                                        className="h-9 rounded-md border border-neutral-300 bg-white px-2 dark:border-neutral-700 dark:bg-neutral-950"
                                                        value={paymentStatus}
                                                        onChange={(event) =>
                                                            setPaymentDrafts({
                                                                ...paymentDrafts,
                                                                [lease.lease_id]: event.target.value as PaymentStatus,
                                                            })
                                                        }
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Overdue">Overdue</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            updatingLeaseId === lease.lease_id ||
                                                            paymentStatus === (bill?.payment_status ?? 'Pending')
                                                        }
                                                        onClick={() => void updatePaymentStatus(lease.lease_id)}
                                                        className="font-medium text-sky-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-300"
                                                    >
                                                        {updatingLeaseId === lease.lease_id ? 'Saving…' : 'Save'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />
                </section>
            </main>
        </AppLayout>
    );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {children}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

function FormActions({ saving, submitLabel, onCancel }: { saving: boolean; submitLabel: string; onCancel: () => void }) {
    return (
        <div className="flex gap-2">
            <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
                {saving ? 'Saving…' : submitLabel}
            </button>
            <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
            >
                Cancel
            </button>
        </div>
    );
}

function Pagination({ page, lastPage, onPageChange }: { page: number; lastPage: number; onPageChange: (page: number) => void }) {
    return (
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
            <span className="text-neutral-500">
                Page {page} of {lastPage}
            </span>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40 dark:border-neutral-700"
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40 dark:border-neutral-700"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function formatAmount(value: number | string): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(year, month - 1, day, 12));
}

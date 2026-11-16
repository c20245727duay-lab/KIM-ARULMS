import AppLayout from '@/layouts/app-layout';
import { ApiError, apiRequest, getErrorMessage, type ApiValidationErrors, type PaginatedResponse } from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Apartment units', href: '/apartment-units' },
];

type UnitStatus = 'Vacant' | 'Occupied' | 'Maintenance';

type ApartmentUnit = {
    apartment_unit_id: number;
    building_id: number;
    unit_number: string;
    monthly_rent: number | string;
    status: UnitStatus;
    building?: { building_block: string };
};

type Building = {
    building_id: number;
    building_block: string;
};

type UnitOptions = {
    buildings: Building[];
    statuses: UnitStatus[];
};

type UnitForm = {
    building_id: string;
    unit_number: string;
    monthly_rent: string;
    status: UnitStatus;
};

const emptyUnitForm = (): UnitForm => ({
    building_id: '',
    unit_number: '',
    monthly_rent: '',
    status: 'Vacant',
});

const fieldClassName =
    'mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100';

export default function ApartmentUnits() {
    const [units, setUnits] = useState<ApartmentUnit[]>([]);
    const [options, setOptions] = useState<UnitOptions>({ buildings: [], statuses: [] });
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [buildingFormOpen, setBuildingFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<UnitForm>(emptyUnitForm);
    const [buildingBlock, setBuildingBlock] = useState('');
    const [formErrors, setFormErrors] = useState<ApiValidationErrors>({});
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setLoadError('');

            try {
                const [unitResponse, optionResponse] = await Promise.all([
                    apiRequest<PaginatedResponse<ApartmentUnit>>(`/api/apartment-units?page=${page}`),
                    apiRequest<UnitOptions>('/api/apartment-units/create'),
                ]);

                if (!active) return;

                setUnits(unitResponse.data);
                setLastPage(unitResponse.last_page);
                setTotal(unitResponse.total);
                setOptions(optionResponse);
            } catch (error) {
                if (active) {
                    setLoadError(getErrorMessage(error));
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [page, refreshKey]);

    const startCreate = () => {
        setEditingId(null);
        setForm(emptyUnitForm());
        setFormErrors({});
        setFormOpen(true);
        setBuildingFormOpen(false);
        setNotice('');
    };

    const startEdit = (unit: ApartmentUnit) => {
        setEditingId(unit.apartment_unit_id);
        setForm({
            building_id: String(unit.building_id),
            unit_number: unit.unit_number,
            monthly_rent: String(unit.monthly_rent),
            status: unit.status,
        });
        setFormErrors({});
        setFormOpen(true);
        setBuildingFormOpen(false);
        setNotice('');
    };

    const saveUnit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setFormErrors({});
        setNotice('');

        const payload = {
            building_id: Number(form.building_id),
            unit_number: form.unit_number,
            monthly_rent: Number(form.monthly_rent),
            status: form.status,
        };

        try {
            await apiRequest(editingId ? `/api/apartment-units/${editingId}` : '/api/apartment-units', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            setFormOpen(false);
            setEditingId(null);
            setForm(emptyUnitForm());
            setNotice(editingId ? 'Apartment unit updated.' : 'Apartment unit created.');
            setRefreshKey((key) => key + 1);
        } catch (error) {
            if (error instanceof ApiError) setFormErrors(error.validationErrors);
            else setLoadError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const saveBuilding = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setFormErrors({});
        setNotice('');

        try {
            await apiRequest('/api/buildings', {
                method: 'POST',
                body: JSON.stringify({ building_block: buildingBlock }),
            });
            setBuildingBlock('');
            setBuildingFormOpen(false);
            setNotice('Building created.');
            setRefreshKey((key) => key + 1);
        } catch (error) {
            if (error instanceof ApiError) setFormErrors(error.validationErrors);
            else setLoadError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apartment units" />
            <main className="flex flex-1 flex-col gap-6 p-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-sm text-neutral-500">Property management</p>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Apartment units</h1>
                        <p className="mt-1 text-sm text-neutral-500">{total} units in your portfolio</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setBuildingFormOpen(true);
                                setFormOpen(false);
                                setFormErrors({});
                                setNotice('');
                            }}
                            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                            Add building
                        </button>
                        <button
                            type="button"
                            onClick={startCreate}
                            disabled={options.buildings.length === 0}
                            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                            Add unit
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
                {!loadError && options.buildings.length === 0 && !loading && (
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Add a building before creating apartment units.
                    </p>
                )}

                {(formOpen || buildingFormOpen) && (
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                        {buildingFormOpen ? (
                            <form onSubmit={saveBuilding} className="max-w-xl space-y-4">
                                <h2 className="text-lg font-semibold">Add building</h2>
                                <label className="block text-sm font-medium" htmlFor="building_block">
                                    Building block
                                    <input
                                        id="building_block"
                                        className={fieldClassName}
                                        value={buildingBlock}
                                        onChange={(event) => setBuildingBlock(event.target.value)}
                                        maxLength={50}
                                        required
                                    />
                                </label>
                                <FieldError errors={formErrors} field="building_block" />
                                <FormActions saving={saving} onCancel={() => setBuildingFormOpen(false)} submitLabel="Save building" />
                            </form>
                        ) : (
                            <form onSubmit={saveUnit} className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-lg font-semibold md:col-span-2">{editingId ? 'Edit apartment unit' : 'Add apartment unit'}</h2>
                                <label className="block text-sm font-medium" htmlFor="building_id">
                                    Building
                                    <select
                                        id="building_id"
                                        className={fieldClassName}
                                        value={form.building_id}
                                        onChange={(event) => setForm({ ...form, building_id: event.target.value })}
                                        required
                                    >
                                        <option value="">Select a building</option>
                                        {options.buildings.map((building) => (
                                            <option key={building.building_id} value={building.building_id}>
                                                {building.building_block}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError errors={formErrors} field="building_id" />
                                </label>
                                <label className="block text-sm font-medium" htmlFor="unit_number">
                                    Unit number
                                    <input
                                        id="unit_number"
                                        className={fieldClassName}
                                        value={form.unit_number}
                                        onChange={(event) => setForm({ ...form, unit_number: event.target.value })}
                                        maxLength={50}
                                        required
                                    />
                                    <FieldError errors={formErrors} field="unit_number" />
                                </label>
                                <label className="block text-sm font-medium" htmlFor="monthly_rent">
                                    Monthly rent
                                    <input
                                        id="monthly_rent"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={fieldClassName}
                                        value={form.monthly_rent}
                                        onChange={(event) => setForm({ ...form, monthly_rent: event.target.value })}
                                        required
                                    />
                                    <FieldError errors={formErrors} field="monthly_rent" />
                                </label>
                                <label className="block text-sm font-medium" htmlFor="status">
                                    Status
                                    <select
                                        id="status"
                                        className={fieldClassName}
                                        value={form.status}
                                        onChange={(event) => setForm({ ...form, status: event.target.value as UnitStatus })}
                                        required
                                    >
                                        {options.statuses.map((status) => (
                                            <option key={status}>{status}</option>
                                        ))}
                                    </select>
                                    <FieldError errors={formErrors} field="status" />
                                </label>
                                <div className="md:col-span-2">
                                    <FormActions
                                        saving={saving}
                                        onCancel={() => setFormOpen(false)}
                                        submitLabel={editingId ? 'Save changes' : 'Create unit'}
                                    />
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
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-950">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Building</th>
                                    <th className="px-4 py-3 font-medium">Unit</th>
                                    <th className="px-4 py-3 font-medium">Monthly rent</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-neutral-500" colSpan={5}>
                                            Loading units…
                                        </td>
                                    </tr>
                                ) : units.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-neutral-500" colSpan={5}>
                                            No apartment units found.
                                        </td>
                                    </tr>
                                ) : (
                                    units.map((unit) => (
                                        <tr key={unit.apartment_unit_id}>
                                            <td className="px-4 py-3">{unit.building?.building_block ?? '—'}</td>
                                            <td className="px-4 py-3 font-medium">{unit.unit_number}</td>
                                            <td className="px-4 py-3">{formatAmount(unit.monthly_rent)}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs dark:bg-neutral-800">
                                                    {unit.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(unit)}
                                                    className="font-medium text-sky-700 hover:underline dark:text-sky-300"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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

function FieldError({ errors, field }: { errors: ApiValidationErrors; field: string }) {
    const message = errors[field]?.[0];
    return message ? <span className="mt-1 block text-xs text-red-600">{message}</span> : null;
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

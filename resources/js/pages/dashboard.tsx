import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, DollarSign, Home, UserRound } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

type Lease = {
    lease_id: number;
    lease_start: string;
    lease_end: string;
    monthly_rent: number | string;
    tenant_name: string;
    building_block: string;
    unit_number: string;
};

type DashboardProps = {
    stats: {
        totalUnits: number;
        vacantUnits: number;
        occupiedUnits: number;
        maintenanceUnits: number;
        monthlyRevenue: number;
        activeLeases: number;
    };
    recentLeases: Lease[];
};

const formatAmount = (value: number | string) =>
    new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));

const formatDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(year, month - 1, day, 12));
};

export default function Dashboard({ stats, recentLeases }: DashboardProps) {
    const propertyMix = [
        { status: 'Vacant', count: stats.vacantUnits },
        { status: 'Occupied', count: stats.occupiedUnits },
        { status: 'Maintenance', count: stats.maintenanceUnits },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <main className="flex flex-1 flex-col gap-6 rounded-xl p-4">
                <header className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-neutral-500">Overview</p>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Apartment portfolio</h1>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Live data
                    </span>
                </header>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total units"
                        value={String(stats.totalUnits)}
                        icon={<Home className="h-5 w-5" />}
                        accent="bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    />
                    <StatCard
                        label="Occupied"
                        value={String(stats.occupiedUnits)}
                        icon={<UserRound className="h-5 w-5" />}
                        accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    />
                    <StatCard
                        label="Vacant"
                        value={String(stats.vacantUnits)}
                        icon={<Building2 className="h-5 w-5" />}
                        accent="bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    />
                    <StatCard
                        label="Monthly revenue"
                        value={formatAmount(stats.monthlyRevenue)}
                        icon={<DollarSign className="h-5 w-5" />}
                        accent="bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent leases</h2>
                            <span className="text-sm text-neutral-500">{stats.activeLeases} active</span>
                        </div>
                        <div className="space-y-3">
                            {recentLeases.length === 0 ? (
                                <p className="text-sm text-neutral-500">No leases found yet.</p>
                            ) : (
                                recentLeases.map((lease) => (
                                    <div
                                        key={lease.lease_id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{lease.tenant_name}</p>
                                            <p className="text-sm text-neutral-500">
                                                {lease.building_block} · {lease.unit_number}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatAmount(lease.monthly_rent)}</p>
                                            <p className="text-xs text-neutral-500">
                                                {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Portfolio health</h2>
                        <div className="space-y-4">
                            <MetricRow label="Vacant units" value={String(stats.vacantUnits)} tone="text-amber-600 dark:text-amber-300" />
                            <MetricRow label="Occupied units" value={String(stats.occupiedUnits)} tone="text-emerald-600 dark:text-emerald-300" />
                            <MetricRow label="Maintenance" value={String(stats.maintenanceUnits)} tone="text-sky-600 dark:text-sky-300" />
                            <MetricRow label="Monthly rent" value={formatAmount(stats.monthlyRevenue)} tone="text-violet-600 dark:text-violet-300" />
                        </div>
                    </section>
                </div>

                <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Property mix</h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {propertyMix.map(({ status, count }) => (
                            <div
                                key={status}
                                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
                            >
                                <p className="text-sm text-neutral-500">{status}</p>
                                <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{count}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">{label}</p>
                <div className={`rounded-md p-2 ${accent}`}>{icon}</div>
            </div>
            <p className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
        </div>
    );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <span className="text-sm text-neutral-500">{label}</span>
            <span className={`text-sm font-semibold ${tone}`}>{value}</span>
        </div>
    );
}

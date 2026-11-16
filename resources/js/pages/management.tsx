import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, ChevronDown, FileText, Home, Menu, Settings, Users, Wrench, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type Section = 'home' | 'tenants' | 'properties' | 'work-orders' | 'administration';
type UnitStatus = 'Vacant' | 'Occupied' | 'Maintenance';
type WorkOrderStatus = 'Open' | 'In Progress' | 'Completed';
type Priority = 'Low' | 'Medium' | 'High';

interface Summary {
    activeLeases: number;
    occupiedUnits: number;
    totalUnits: number;
    monthlyRent: string | number;
    tenantCount: number;
    openWorkOrders: number;
}

interface Tenant {
    tenant_id: number;
    tenant_name: string;
    tenant_email: string;
    tenant_phone: string;
    leases_count: number;
}

interface Building {
    building_id: number;
    building_block: string;
}

interface Unit {
    apartment_unit_id: number;
    building_id: number;
    unit_name?: string | null;
    unit_number: string;
    status: UnitStatus;
    building: Building;
}

interface WorkOrder {
    id: number;
    title: string;
    description: string;
    priority: Priority;
    status: WorkOrderStatus;
    created_at: string;
    apartment_unit: Unit;
}

interface ManagementProps {
    section: Section;
    summary: Summary;
    tenants?: Tenant[];
    buildings?: Building[];
    units?: Unit[];
    workOrders?: WorkOrder[];
}

const navigation = [
    { label: 'Home', href: '/home', icon: Home, section: 'home' },
    { label: 'Tenants', href: '/tenants', icon: Users, section: 'tenants' },
    { label: 'Properties', href: '/properties', icon: Building2, section: 'properties' },
    { label: 'Lease Management', href: '/dashboard', icon: FileText, section: 'leases' },
    { label: 'Work Orders', href: '/work-orders', icon: Wrench, section: 'work-orders' },
    { label: 'Administration', href: '/administration', icon: Settings, section: 'administration' },
];

async function submitJson(url: string, method: 'POST' | 'PUT' | 'PATCH', payload: Record<string, string>) {
    const response = await fetch(url, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`The server returned an unexpected response (HTTP ${response.status}).`);
    }

    const result = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
        const validationMessage = result.errors ? Object.values(result.errors).flat().join(' ') : undefined;
        throw new Error(validationMessage ?? result.message ?? `The request failed (HTTP ${response.status}).`);
    }

    return result;
}

function PageTitle({ children }: { children: string }) {
    return <h1 className="text-xl font-semibold tracking-tight text-slate-800">{children}</h1>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <Icon className="size-5" />
                </span>
            </CardContent>
        </Card>
    );
}

export default function Management({ section, summary, tenants = [], buildings = [], units = [], workOrders = [] }: ManagementProps) {
    const [busy, setBusy] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>, url: string, method: 'POST' | 'PUT' | 'PATCH', reload: string[]) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');

        const formData = new FormData(event.currentTarget);
        const form = event.currentTarget;
        const payload = Object.fromEntries(formData.entries()) as Record<string, string>;

        try {
            const result = await submitJson(url, method, payload);
            setNotice(result.message ?? 'Changes saved.');
            form.reset();
            router.reload({ only: reload });
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'The request could not be completed.');
        } finally {
            setBusy(false);
        }
    }

    async function updateUnitStatus(unit: Unit, status: UnitStatus) {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await submitJson(`/api/apartment-units/${unit.apartment_unit_id}`, 'PUT', {
                building_id: String(unit.building_id),
                unit_name: unit.unit_name ?? '',
                unit_number: unit.unit_number,
                status,
            });
            setNotice(result.message ?? 'Unit status updated.');
            router.reload({ only: ['units', 'summary'] });
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Could not update unit status.');
        } finally {
            setBusy(false);
        }
    }

    async function updateWorkOrderStatus(workOrder: WorkOrder, status: WorkOrderStatus) {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await submitJson(`/api/work-orders/${workOrder.id}/status`, 'PATCH', { status });
            setNotice(result.message ?? 'Work order status updated.');
            router.reload({ only: ['workOrders', 'summary'] });
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Could not update work order status.');
        } finally {
            setBusy(false);
        }
    }

    const pageTitle = {
        home: 'Home',
        tenants: 'Tenants',
        properties: 'Properties',
        'work-orders': 'Work Orders',
        administration: 'Administration',
    }[section];

    return (
        <>
            <Head title={pageTitle} />
            <div className="min-h-screen bg-[#f4f6f8] text-slate-800">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-[#343a40] text-slate-300 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <Link href="/home" className="flex h-[54px] items-center gap-2 border-b border-white/10 px-4 text-white">
                        <span className="flex size-8 items-center justify-center rounded-full bg-blue-600">
                            <Building2 className="size-4" />
                        </span>
                        <span className="text-sm font-semibold">
                            Arul<span className="text-blue-300">Homes</span>
                        </span>
                    </Link>
                    <nav aria-label="Main navigation" className="space-y-1 px-2 py-4">
                        {navigation.map(({ label, href, icon: Icon, section: itemSection }) => {
                            const active = section === itemSection;

                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    onClick={() => setSidebarOpen(false)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex h-9 items-center gap-3 rounded px-2.5 text-[13px] transition-colors ${active ? 'bg-[#51575d] font-medium text-white' : 'hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span>{label}</span>
                                    {label === 'Administration' && <ChevronDown className="ml-auto size-3.5" />}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-auto border-t border-white/10 px-4 py-4 text-xs text-slate-400">Apartment Rental Management</div>
                </aside>

                {sidebarOpen && (
                    <button
                        aria-label="Close navigation"
                        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="min-h-screen lg:pl-[220px]">
                    <header className="sticky top-0 z-20 flex h-[54px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-slate-500"
                                aria-label="Toggle navigation"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <Menu className="size-4" />
                            </Button>
                            <nav aria-label="Breadcrumb" className="text-[13px] text-slate-600">
                                <Link href="/home" className="hover:text-slate-900">
                                    Home
                                </Link>
                                {section !== 'home' && <span className="text-slate-400"> / {pageTitle}</span>}
                            </nav>
                        </div>
                        <span className="hidden text-xs text-slate-600 sm:inline">Apartment Management</span>
                    </header>

                    <main className="mx-auto max-w-[1500px] space-y-4 px-3 py-4 sm:px-5 sm:py-5">
                        {(error || notice) && (
                            <div
                                role={error ? 'alert' : 'status'}
                                className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
                            >
                                {error || notice}
                                <button
                                    type="button"
                                    className="underline"
                                    onClick={() => {
                                        setError('');
                                        setNotice('');
                                    }}
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {section === 'home' && (
                            <>
                                <div>
                                    <PageTitle>Home</PageTitle>
                                    <p className="mt-1 text-sm text-slate-500">A quick overview of your rental portfolio.</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <Metric label="Active leases" value={summary.activeLeases} icon={FileText} />
                                    <Metric label="Tenants" value={summary.tenantCount} icon={Users} />
                                    <Metric label="Occupied units" value={`${summary.occupiedUnits} / ${summary.totalUnits}`} icon={Building2} />
                                    <Metric label="Open work orders" value={summary.openWorkOrders} icon={Wrench} />
                                </div>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="font-semibold">Quick access</h2>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {navigation.slice(1).map(({ label, href }) => (
                                                <Button key={href} asChild variant="outline">
                                                    <Link href={href}>{label}</Link>
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {section === 'tenants' && (
                            <>
                                <PageTitle>Tenants</PageTitle>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="font-semibold">Add tenant</h2>
                                        <form
                                            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                                            onSubmit={(event) => handleSubmit(event, '/api/tenants', 'POST', ['tenants', 'summary'])}
                                        >
                                            <Input name="tenant_name" placeholder="Full name" aria-label="Tenant name" required maxLength={255} />
                                            <Input
                                                name="tenant_email"
                                                type="email"
                                                placeholder="Email address"
                                                aria-label="Tenant email"
                                                required
                                                maxLength={255}
                                            />
                                            <Input
                                                name="tenant_phone"
                                                type="tel"
                                                placeholder="Phone number"
                                                aria-label="Tenant phone"
                                                required
                                                maxLength={20}
                                            />
                                            <Button type="submit" disabled={busy}>
                                                Add tenant
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Phone</TableHead>
                                                        <TableHead className="text-right">Leases</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {tenants.map((tenant) => (
                                                        <TableRow key={tenant.tenant_id}>
                                                            <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                                                            <TableCell>{tenant.tenant_email}</TableCell>
                                                            <TableCell>{tenant.tenant_phone}</TableCell>
                                                            <TableCell className="text-right">{tenant.leases_count}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {tenants.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-20 text-center text-slate-500">
                                                                No tenants yet. Add your first tenant above.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {section === 'properties' && (
                            <>
                                <PageTitle>Properties</PageTitle>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="font-semibold">Add property</h2>
                                        <form
                                            className="mt-4 flex flex-col gap-3 sm:flex-row"
                                            onSubmit={(event) => handleSubmit(event, '/api/buildings', 'POST', ['buildings', 'units', 'summary'])}
                                        >
                                            <Input
                                                name="building_block"
                                                placeholder="Property or building name"
                                                aria-label="Property name"
                                                required
                                                maxLength={255}
                                            />
                                            <Button type="submit" disabled={busy}>
                                                Add property
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="font-semibold">Add apartment unit</h2>
                                        <form
                                            className="mt-4 grid gap-3 sm:grid-cols-5"
                                            onSubmit={(event) => handleSubmit(event, '/api/apartment-units', 'POST', ['units', 'summary'])}
                                        >
                                            <select
                                                name="building_id"
                                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                required
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Select property
                                                </option>
                                                {buildings.map((building) => (
                                                    <option key={building.building_id} value={building.building_id}>
                                                        {building.building_block}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                name="unit_name"
                                                placeholder="Apartment unit name"
                                                aria-label="Apartment unit name"
                                                maxLength={255}
                                            />
                                            <Input name="unit_number" placeholder="Unit number" aria-label="Unit number" required maxLength={50} />
                                            <Input
                                                name="monthly_rent"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Monthly rent"
                                                aria-label="Monthly rent"
                                                required
                                            />
                                            <input type="hidden" name="status" value="Vacant" />
                                            <Button type="submit" disabled={busy || buildings.length === 0}>
                                                Add unit
                                            </Button>
                                        </form>
                                        {buildings.length === 0 && (
                                            <p className="mt-2 text-sm text-amber-700">No properties are configured yet, so units cannot be added.</p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Property</TableHead>
                                                        <TableHead className="text-right">Units</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {buildings.map((building) => (
                                                        <TableRow key={building.building_id}>
                                                            <TableCell className="font-medium">{building.building_block}</TableCell>
                                                            <TableCell className="text-right">
                                                                {units.filter((unit) => unit.building_id === building.building_id).length}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {buildings.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="h-16 text-center text-slate-500">
                                                                No properties have been added.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Property</TableHead>
                                                        <TableHead>Unit name</TableHead>
                                                        <TableHead>Unit number</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {units.map((unit) => (
                                                        <TableRow key={unit.apartment_unit_id}>
                                                            <TableCell className="font-medium">{unit.building.building_block}</TableCell>
                                                            <TableCell>{unit.unit_name || '—'}</TableCell>
                                                            <TableCell>{unit.unit_number}</TableCell>
                                                            <TableCell>
                                                                <select
                                                                    aria-label={`Status for ${unit.building.building_block} unit ${unit.unit_number}`}
                                                                    className="h-8 rounded border border-slate-300 bg-white px-2 text-sm"
                                                                    value={unit.status}
                                                                    disabled={busy}
                                                                    onChange={(event) => updateUnitStatus(unit, event.target.value as UnitStatus)}
                                                                >
                                                                    <option>Vacant</option>
                                                                    <option>Occupied</option>
                                                                    <option>Maintenance</option>
                                                                </select>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {units.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-20 text-center text-slate-500">
                                                                No apartment units have been added.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {section === 'work-orders' && (
                            <>
                                <PageTitle>Work Orders</PageTitle>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="font-semibold">Create work order</h2>
                                        <form
                                            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                                            onSubmit={(event) => handleSubmit(event, '/api/work-orders', 'POST', ['workOrders', 'summary'])}
                                        >
                                            <Input name="title" placeholder="Issue title" aria-label="Issue title" required maxLength={255} />
                                            <select
                                                name="apartment_unit_id"
                                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                required
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Select unit
                                                </option>
                                                {units.map((unit) => (
                                                    <option key={unit.apartment_unit_id} value={unit.apartment_unit_id}>
                                                        {unit.building.building_block} · {unit.unit_number}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                name="priority"
                                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                defaultValue="Medium"
                                            >
                                                <option>Low</option>
                                                <option>Medium</option>
                                                <option>High</option>
                                            </select>
                                            <Input
                                                name="description"
                                                placeholder="Describe the issue"
                                                aria-label="Description"
                                                required
                                                maxLength={5000}
                                                className="lg:col-span-2"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={busy || units.length === 0}
                                                className="sm:col-span-2 lg:col-span-5 lg:justify-self-end"
                                            >
                                                Create work order
                                            </Button>
                                        </form>
                                        {units.length === 0 && (
                                            <p className="mt-2 text-sm text-amber-700">Add a property unit before creating a work order.</p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Issue</TableHead>
                                                        <TableHead>Property / unit</TableHead>
                                                        <TableHead>Priority</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {workOrders.map((workOrder) => (
                                                        <TableRow key={workOrder.id}>
                                                            <TableCell className="min-w-52">
                                                                <p className="font-medium">{workOrder.title}</p>
                                                                <p className="max-w-md truncate text-xs text-slate-500">{workOrder.description}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                {workOrder.apartment_unit.building.building_block} ·{' '}
                                                                {workOrder.apartment_unit.unit_number}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={workOrder.priority === 'High' ? 'destructive' : 'secondary'}>
                                                                    {workOrder.priority}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <select
                                                                    aria-label={`Status for ${workOrder.title}`}
                                                                    className="h-8 rounded border border-slate-300 bg-white px-2 text-sm"
                                                                    value={workOrder.status}
                                                                    disabled={busy}
                                                                    onChange={(event) =>
                                                                        updateWorkOrderStatus(workOrder, event.target.value as WorkOrderStatus)
                                                                    }
                                                                >
                                                                    <option>Open</option>
                                                                    <option>In Progress</option>
                                                                    <option>Completed</option>
                                                                </select>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {workOrders.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-20 text-center text-slate-500">
                                                                No work orders. Create one when maintenance is needed.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {section === 'administration' && (
                            <>
                                <PageTitle>Administration</PageTitle>
                                <p className="text-sm text-slate-500">Manage your account and application preferences.</p>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {[
                                        { title: 'Profile', description: 'Update your name and email address.', href: '/settings/profile' },
                                        { title: 'Password', description: 'Change your account password.', href: '/settings/password' },
                                        { title: 'Appearance', description: 'Choose your display preference.', href: '/settings/appearance' },
                                    ].map((item) => (
                                        <Card key={item.href} className="border-slate-200 shadow-sm">
                                            <CardContent className="p-5">
                                                <h2 className="font-semibold">{item.title}</h2>
                                                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                                                <Button asChild variant="outline" className="mt-4">
                                                    <Link href={item.href}>Open {item.title}</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

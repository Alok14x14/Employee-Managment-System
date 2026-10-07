import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    CalendarIcon,
    DollarSignIcon,
    FileTextIcon,
    LayoutGridIcon,
    Loader2,
    LogOutIcon,
    MenuIcon,
    SettingsIcon,
    UserIcon,
    XIcon,
    Building2Icon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Sidebar = () => {
    const { pathname } = useLocation();
    const [userName, setUserName] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, loading, logout } = useAuth();

    useEffect(() => {
        api.get('/profile').then(({ data }) => {
            if (data.firstName) setUserName(`${data.firstName} ${data.lastName || ''}`.trim());
        }).catch(() => {});
    }, []);

    const role = user?.role;
    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutGridIcon },
        ...(role === 'ADMIN' ? [
            { name: 'Employees', href: '/employees', icon: UserIcon },
            { name: 'Departments', href: '/departments', icon: Building2Icon }
        ] : [
            { name: 'Attendance', href: '/attendance', icon: CalendarIcon }
        ]),
        { name: 'Leave', href: '/leave', icon: FileTextIcon },
        { name: 'Payslips', href: '/payslips', icon: DollarSignIcon },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const sidebarBody = (
        <div className="flex flex-col h-full w-[240px]">
            {/* Brand Header */}
            <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200">
                <span className="text-sm font-semibold tracking-tight text-zinc-900">StaffFlow</span>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden text-zinc-400 hover:text-zinc-600 p-1 rounded-[6px]"
                    aria-label="Close navigation menu"
                >
                    <XIcon size={18} />
                </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {loading ? (
                    <div className="py-6 flex items-center justify-center text-zinc-400">
                        <Loader2 className="animate-spin w-4 h-4" />
                    </div>
                ) : (
                    navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`h-9 px-3 flex items-center gap-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`} />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })
                )}
            </nav>

            {/* Profile & Logout compact row */}
            <div className="p-3 border-t border-zinc-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-700 shrink-0">
                        {(userName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-900 truncate">
                            {userName || user?.name || 'Staff User'}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate capitalize">
                            {role === 'ADMIN' ? 'Admin' : 'Employee'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-[6px] transition-colors shrink-0"
                    title="Log out"
                    aria-label="Log out"
                >
                    <LogOutIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 z-40 px-4 flex items-center justify-between">
                <span className="text-sm font-semibold tracking-tight text-zinc-900">StaffFlow</span>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-[6px] transition-colors"
                    aria-label="Open navigation menu"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 z-50 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Slide-over Drawer */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 w-[240px] bg-white z-50 flex flex-col border-r border-zinc-200 transform transition-transform duration-200 ease-in-out ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarBody}
            </aside>

            {/* Desktop Fixed Sidebar */}
            <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-zinc-200">
                {sidebarBody}
            </aside>
        </>
    );
};

export default Sidebar;
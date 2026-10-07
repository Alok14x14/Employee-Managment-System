import React, { useEffect, useState } from 'react'
import {Link, useLocation} from 'react-router-dom'
import {CalendarIcon, ChevronRightIcon, DollarSignIcon, FileTextIcon, LayoutGridIcon, Loader2, LogOutIcon, MenuIcon, SettingsIcon, UserIcon, XIcon, Building2Icon, SunIcon, MoonIcon} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Sidebar = () => {
    const { pathname } = useLocation()
    const [userName, setUserName] = useState('')
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(true)
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    const {user, loading, logout} = useAuth()

    useEffect(()=>{
        api.get("/profile").then(({data})=> {
            if(data.firstName) setUserName(`${data.firstName} ${data.lastName || ""}`.trim());
        }).catch(() => {})
    },[])

    useEffect(()=>{
        setMobileOpen(false)
    },[pathname])

    const role = user?.role;
    const navItems = [
        {name: "Dashboard", href: "/dashboard", icon: LayoutGridIcon},
        ...(role === "ADMIN" ? [
            {name: "Employees", href: "/employees", icon: UserIcon},
            {name: "Departments", href: "/departments", icon: Building2Icon}
        ] : [
            {name: "Attendance", href: "/attendance", icon: CalendarIcon}
        ]),
        {name: "Leave", href: "/leave", icon: FileTextIcon},
        {name: "Payslips", href: "/payslips", icon: DollarSignIcon},
        {name: "Settings", href: "/settings", icon: SettingsIcon},
    ]

    const handleLogout = ()=>{
        logout()
        window.location.href = "/login"
    }

    const renderContent = (collapsed) => (
        <div className="w-[260px] h-full flex flex-col">
            {/* Brand header */}
            <div className="pt-6 pb-5 border-b border-slate-100 flex items-center justify-between pl-[22px] pr-5">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg flex shrink-0">
                        <UserIcon className='text-white size-5'/>
                    </div>
                    <div className={`transition-opacity duration-300 whitespace-nowrap ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                        <p className='font-bold text-[14px] text-slate-800 tracking-wide'>StaffFlow</p>
                        <p className='text-[11px] text-slate-500 font-medium'>Management System</p>
                    </div>
                </div>
                <button onClick={()=>setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 p-1">
                    <XIcon size={20}/>
                </button>
            </div>

            {/* Section label */}
            <div className={`pt-5 pb-2 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'} px-5`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Navigation</p>
            </div>

            {/* Navigation List */}
            <div className='flex-1 px-3 space-y-1 overflow-y-auto'>
                {loading ? (
                    <div className='px-3 py-3 flex items-center justify-center text-slate-400'>
                        <Loader2 className="animate-spin w-5 h-5" />
                    </div>
                ) : (
                    navItems.map((item)=>{
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link key={item.name} to={item.href} className={`group flex items-center gap-4 pl-[18px] pr-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                                {isActive && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-indigo-600"/>}
                                <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}/>
                                <span className={`flex-1 transition-opacity duration-300 whitespace-nowrap ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{item.name}</span>
                                {isActive && <ChevronRightIcon className={`w-4 h-4 text-indigo-400 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}/>}
                            </Link>
                        )
                    })
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-slate-100 space-y-1 overflow-hidden">
                <button 
                    onClick={toggleDarkMode}
                    className={`flex items-center gap-4 pl-[18px] pr-4 w-full py-3 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200`}
                >
                    {isDarkMode ? <SunIcon className="w-5 h-5 shrink-0 text-amber-500" /> : <MoonIcon className="w-5 h-5 shrink-0 text-slate-400" />}
                    <span className={`transition-opacity duration-300 whitespace-nowrap ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </span>
                </button>
                
                {userName && (
                    <div className="my-2 p-3 rounded-xl bg-slate-50 border border-slate-100 relative">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-[13px]">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className={`transition-opacity duration-300 whitespace-nowrap min-w-0 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                                <p className='text-[13px] font-semibold text-slate-800 truncate'>{userName}</p>
                                <p className='text-[11px] text-slate-500 truncate'>{role === "ADMIN" ? "Admin" : "Employee"}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <button onClick={handleLogout} className={`flex items-center gap-4 pl-[18px] pr-4 w-full py-3 rounded-xl text-[13px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200`}>
                    <LogOutIcon className="w-5 h-5 shrink-0"/>
                    <span className={`transition-opacity duration-300 whitespace-nowrap ${collapsed ? 'opacity-0' : 'opacity-100'}`}>Log out</span>
                </button>
            </div>
        </div>
    )

  return (
    <>
        {/* Mobile hamburger button */}
        <button onClick={()=>setMobileOpen(true)} className='lg:hidden fixed top-4 left-4 z-50 p-2 bg-white text-slate-800 rounded-lg shadow-md border border-slate-200'>
            <MenuIcon size={20}/>
        </button>

        {/* Mobile overlay */}
        {mobileOpen && <div className='lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40' onClick={()=>setMobileOpen(false)}/>}

        {/* Sidebar - desktop (light & collapsible rail) */}
        <div className="hidden lg:block w-[80px] shrink-0" />
        <aside 
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
            className={`hidden lg:flex flex-col h-full bg-white shrink-0 border-r border-slate-200 transition-all duration-300 ease-in-out z-30 fixed top-0 left-0 shadow-sm overflow-hidden ${isCollapsed ? 'w-[80px]' : 'w-[260px] shadow-xl'}`}
        >
            {renderContent(isCollapsed)}
        </aside>

        {/* Sidebar - mobile */}
        <aside className={`lg:hidden fixed inset-y-0 left-0 w-[260px] bg-white z-50 flex flex-col transform transition-transform duration-300 overflow-hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {renderContent(false)}
        </aside>
    </>
  )
}

export default Sidebar
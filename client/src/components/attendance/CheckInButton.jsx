import { Loader2Icon, LogInIcon, LogOutIcon, ClockIcon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const CheckInButton = ({todayRecord, onAction}) => {
    const [loading, setLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [elapsedTime, setElapsedTime] = useState("00:00:00")

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (todayRecord?.checkIn && !todayRecord?.checkOut) {
            const timer = setInterval(() => {
                const start = new Date(todayRecord.checkIn).getTime()
                const now = new Date().getTime()
                const diff = now - start
                
                const hours = Math.floor(diff / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                
                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                )
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [todayRecord])

    const handleAttendance = async () => {
        setLoading(true)
        try {
            await api.post("/attendance")
            onAction()
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message);
        }
        setLoading(false)
    }

    if(todayRecord?.checkOut){
        return (
            <div className='flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border-0 shadow-inner'>
                <h3 className='text-xl font-bold text-slate-900'>Work Day Completed</h3>
                <p className='text-slate-500 text-base mt-2'>Great job! See you tomorrow</p>
                <div className='mt-6 font-mono text-2xl font-bold text-indigo-600 bg-white px-6 py-3 rounded-2xl shadow-sm'>
                    Total: {todayRecord.workingHours} hrs
                </div>
            </div>
        )
    }

    const isCheckedIn = !!todayRecord?.checkIn;
    
    return (
        <div className="surface-card p-10 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background decoration */}
            <div className={`absolute top-0 w-full h-1.5 ${isCheckedIn ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            
            <div className="text-center mb-10">
                <p className="text-slate-500 font-medium mb-3 uppercase tracking-widest text-sm">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h2 className="text-6xl font-bold text-slate-800 tracking-tight font-mono">
                    {currentTime.toLocaleTimeString()}
                </h2>
            </div>
            
            {isCheckedIn && (
                <div className="mb-10 flex flex-col items-center animate-fade-in">
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-2">Time Elapsed</p>
                    <div className="font-mono text-4xl text-indigo-600 font-bold bg-indigo-50/50 px-8 py-3 rounded-2xl ring-1 ring-indigo-100">
                        {elapsedTime}
                    </div>
                    <p className="text-sm text-slate-500 mt-4 font-medium">Checked in at {new Date(todayRecord.checkIn).toLocaleTimeString()}</p>
                </div>
            )}
            
            <button onClick={handleAttendance} disabled={loading} className={`w-full max-w-md flex justify-center items-center gap-4 p-5 rounded-2xl text-white transition-all duration-300 shadow-xl hover:-translate-y-1 ${isCheckedIn ? "bg-linear-to-r from-rose-500 to-rose-600 shadow-rose-500/30 hover:shadow-rose-500/40" : "bg-linear-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/30 hover:shadow-indigo-500/40"}`}>
                {loading ? <Loader2Icon className="size-6 animate-spin"/> : isCheckedIn ? <LogOutIcon className="size-6"/> : <LogInIcon className="size-6"/>}
                <span className='text-lg font-semibold tracking-wide'>{loading ? "Processing..." : isCheckedIn ? "Clock Out" : "Clock In"}</span>
            </button>
        </div>
    )
}

export default CheckInButton
import { Check, Loader2, X } from 'lucide-react'
import React, { useState } from 'react'
import {format} from 'date-fns'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const LeaveHistory = ({leaves, isAdmin, onUpdate}) => {
    const [processing, setProcessing] = useState(null)
    const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: "" })

    const handleStatusUpdate = async (id, status, reason = "") => {
        let payload = { status };
        if (status === "REJECTED") {
            if (!reason) return;
            payload.rejectReason = reason;
        }

        setProcessing(id)
        try {
            await api.patch(`/leave/${id}`, payload)
            onUpdate();
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message)
        }finally{
            setProcessing(null)
        }
    }

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        handleStatusUpdate(rejectModal.leaveId, "REJECTED", rejectModal.reason);
        setRejectModal({ open: false, leaveId: null, reason: "" });
    }
  return (
     <div className='card overflow-hidden'>
            <div className="overflow-x-auto">
                <table className="table-modern">
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {isAdmin && <th className='text-center'>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 4} className="text-center py-12 text-slate-400">
                                    No leave applications found
                                </td>
                            </tr>
                        ) : (
                            leaves.map((leave)=>{
                                return (
                                    <tr key={leave._id || leave.id}>
                                        {isAdmin && (
                                            <td className='text-slate-900'>
                                            {leave.employee?.firstName} {leave.employee?.lastName}
                                        </td>
                                        )}
    
                                        <td>
                                            <span className='badge bg-slate-100 text-slate-600'>{leave.type}</span>
                                        </td>
    
                                        <td className='text-xs text-slate-500'>
                                            {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                                        </td>
    
                                        <td className='max-w-xs truncate text-slate-500' title={leave.reason}>
                                            {leave.reason}
                                        </td>
    
                                        <td>
                                            <span className={`badge ${leave.status === "APPROVED" ? "badge-success" : leave.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                        {isAdmin && (
                            <td>
                                {leave.status === "PENDING" && (
                                    <div className='flex justify-center gap-2'>
                                        <button
                                         disabled={!!processing}
                                        onClick={()=> handleStatusUpdate(leave._id || leave.id, "APPROVED")}
                                        className='p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors'>
                                            {processing === (leave._id || leave.id) ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                                        </button>

                                        <button
                                         onClick={()=> setRejectModal({ open: true, leaveId: leave._id || leave.id, reason: "" })}
                                         disabled={!!processing}
                                        className='p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors'>
                                            {processing === (leave._id || leave.id) ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                )}
                                
                            </td>
                        )}
                                        
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rejection Modal */}
            {rejectModal.open && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm' onClick={() => setRejectModal({ open: false, leaveId: null, reason: "" })}>
                    <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in' onClick={(e)=>e.stopPropagation()}>
                        <div className='flex items-center justify-between p-6 pb-0'>
                            <div>
                                <h2 className='text-lg font-semibold text-slate-800'>Reject Leave Request</h2>
                                <p className='text-sm text-slate-400 mt-0.5'>Please provide a reason for rejection</p>
                            </div>
                            <button onClick={() => setRejectModal({ open: false, leaveId: null, reason: "" })} className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600'>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
    
                        <form onSubmit={handleRejectSubmit} className='p-6 space-y-5'>
                            <div>
                                <textarea 
                                    value={rejectModal.reason}
                                    onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
                                    required 
                                    rows={3} 
                                    className="resize-none" 
                                    placeholder="E.g., Insufficient leave balance..." 
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRejectModal({ open: false, leaveId: null, reason: "" })} type='button' className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type='submit' className="btn-primary flex-1 flex items-center justify-center from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-rose-500/25">
                                    Reject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
  )
}

export default LeaveHistory
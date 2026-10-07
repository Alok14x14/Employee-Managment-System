import React from 'react'

const LoginLeftSide = () => {
  return (
    <div className="hidden md:flex w-1/2 bg-[#0A0A0B] border-r border-[#27272A] p-12 lg:p-16 flex-col justify-between text-white select-none">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm tracking-tight text-white">
          StaffFlow
        </span>
      </div>

      <div className="max-w-[400px] space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white leading-snug">
          Workforce operations, payroll, and attendance.
        </h1>
        <p className="text-sm text-[#A1A1AA] leading-relaxed">
          Centralized employee records, precise attendance tracking, and streamlined payroll distribution for technical teams.
        </p>
      </div>

      <div className="text-xs text-[#71717A]">
        Enterprise workforce management
      </div>
    </div>
  )
}

export default LoginLeftSide
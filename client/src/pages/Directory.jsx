import { useEffect, useState } from 'react'
import { Mail, Search, UsersRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useDepartments } from '../constants/departments'
import Pagination from '../components/Pagination'

const Directory = () => {
  const departments = useDepartments()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [positions, setPositions] = useState([])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (query.trim()) params.set('search', query.trim())
    if (department) params.set('department', department)
    if (position) params.set('position', position)
    api.get(`/employees/directory?${params.toString()}`)
      .then(({ data }) => {
        setEmployees(data.data || [])
        setTotal(data.total || 0)
        setPositions(data.positions || [])
      })
      .catch((error) => toast.error(error?.response?.data?.error || 'Could not load employee directory'))
      .finally(() => setLoading(false))
  }, [query, department, position, page])
  const totalPages = Math.max(1, Math.ceil(total / 10))

  return <div className="space-y-6">
    <div className="page-header"><div><h1 className="page-title">Employee directory</h1><p className="page-subtitle">Find colleagues by name, department, or job title.</p></div><span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><UsersRound className="size-3.5" />{loading ? '—' : total} colleagues</span></div>

    <div className="card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px_220px]">
      <label className="relative block"><span className="sr-only">Search colleagues</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" /><input type="search" placeholder="Search by name or email…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="pl-9" /></label>
      <label><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1) }}><option value="">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span className="sr-only">Filter by job title</span><select value={position} onChange={(event) => { setPosition(event.target.value); setPage(1) }}><option value="">All job titles</option>{positions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>

    {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="card h-28 skeleton" />)}</div> : employees.length === 0 ? <div className="card flex flex-col items-center p-12 text-center"><UsersRound className="size-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No colleagues found</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try a different name, department, or job title.</p></div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{employees.map((employee) => <article key={employee.id} className="card flex items-start gap-3 p-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">{employee.firstName?.[0]}{employee.lastName?.[0]}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{employee.firstName} {employee.lastName}</h2><p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{employee.position}</p><span className="mt-2 inline-flex max-w-full truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{employee.department}</span><a href={`mailto:${employee.email}`} className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"><Mail className="size-3.5 shrink-0" /><span className="truncate">{employee.email}</span></a></div></article>)}</div>}
    {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />}
  </div>
}

export default Directory

import { useMemo, useState } from 'react'

const usePagination = (items, pageSize = 10) => {
  const [page, setPage] = useState(1)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )
  return { pageItems, page: currentPage, totalPages, totalItems, setPage }
}

export default usePagination

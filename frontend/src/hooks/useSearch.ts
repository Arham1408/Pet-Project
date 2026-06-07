import { useMutation } from '@tanstack/react-query'
import { searchApi } from '@/lib/api'
import type { SearchRequest } from '@/types/api'

export function useSearch() {
  return useMutation({
    mutationFn: (req: SearchRequest) => searchApi.query(req).then(r => r.data),
  })
}

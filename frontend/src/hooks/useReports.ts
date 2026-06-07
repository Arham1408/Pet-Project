import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'

export const REPORT_KEYS = {
  all: ['reports'] as const,
  filtered: (params: object) => ['reports', params] as const,
  detail: (id: string) => ['reports', id] as const,
}

export function useReports(params?: { investor_id?: string; report_type?: string; limit?: number }) {
  return useQuery({
    queryKey: params ? REPORT_KEYS.filtered(params) : REPORT_KEYS.all,
    queryFn: () => reportsApi.list(params).then(r => r.data),
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: REPORT_KEYS.detail(id),
    queryFn: () => reportsApi.get(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useMarkReportRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reportsApi.markRead(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: REPORT_KEYS.all })
      qc.invalidateQueries({ queryKey: REPORT_KEYS.detail(id) })
    },
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (investorId: string) => reportsApi.generate(investorId).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REPORT_KEYS.all }),
  })
}

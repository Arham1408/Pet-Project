import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '@/lib/api'

export const ALERT_KEYS = {
  all: ['alerts'] as const,
  filtered: (params: object) => ['alerts', params] as const,
}

export function useAlerts(params?: { investor_id?: string; severity?: string; unread_only?: boolean }) {
  return useQuery({
    queryKey: params ? ALERT_KEYS.filtered(params) : ALERT_KEYS.all,
    queryFn: () => alertsApi.list(params).then(r => r.data),
    refetchInterval: 60_000, // poll every minute
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERT_KEYS.all }),
  })
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERT_KEYS.all }),
  })
}

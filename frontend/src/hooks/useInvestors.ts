import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { investorsApi, sourcesApi } from '@/lib/api'
import type { InvestorCreate, InvestorUpdate, SourceCreate } from '@/types/api'

export const INVESTOR_KEYS = {
  all: ['investors'] as const,
  detail: (id: string) => ['investors', id] as const,
  sources: (id: string) => ['investors', id, 'sources'] as const,
}

export function useInvestors() {
  return useQuery({
    queryKey: INVESTOR_KEYS.all,
    queryFn: () => investorsApi.list().then(r => r.data),
  })
}

export function useInvestor(id: string) {
  return useQuery({
    queryKey: INVESTOR_KEYS.detail(id),
    queryFn: () => investorsApi.get(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateInvestor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InvestorCreate) => investorsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVESTOR_KEYS.all }),
  })
}

export function useUpdateInvestor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvestorUpdate }) =>
      investorsApi.update(id, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: INVESTOR_KEYS.all })
      qc.invalidateQueries({ queryKey: INVESTOR_KEYS.detail(id) })
    },
  })
}

export function useDeleteInvestor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => investorsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVESTOR_KEYS.all }),
  })
}

export function useSyncInvestor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => investorsApi.sync(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: INVESTOR_KEYS.detail(id) }),
  })
}

export function useSources(investorId: string) {
  return useQuery({
    queryKey: INVESTOR_KEYS.sources(investorId),
    queryFn: () => sourcesApi.list(investorId).then(r => r.data),
    enabled: !!investorId,
  })
}

export function useCreateSource(investorId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SourceCreate) => sourcesApi.create(investorId, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVESTOR_KEYS.sources(investorId) }),
  })
}

export function useDeleteSource(investorId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sourceId: string) => sourcesApi.delete(investorId, sourceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVESTOR_KEYS.sources(investorId) }),
  })
}

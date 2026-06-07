import * as React from 'react'
import type { ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 3000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

let count = 0
function genId() { return (++count).toString() }

type State = { toasts: ToasterToast[] }

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(toasts: ToasterToast[]) {
  memoryState = { toasts }
  listeners.forEach(l => l(memoryState))
}

export function toast({ title, description, variant }: Omit<ToasterToast, 'id'>) {
  const id = genId()
  const newToasts = [{ id, title, description, variant, open: true }, ...memoryState.toasts].slice(0, TOAST_LIMIT)
  dispatch(newToasts)
  setTimeout(() => dispatch(memoryState.toasts.filter(t => t.id !== id)), TOAST_REMOVE_DELAY)
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) }
  }, [])
  return { toasts: state.toasts, toast }
}

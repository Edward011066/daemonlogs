import { AppError } from '../../utils/app-error.js'

const activeProcesses = new Map<number, AbortController>()

export function startProcess(usuarioId: number): AbortController {
  if (activeProcesses.has(usuarioId)) {
    throw new AppError(409, 'PROCESS_ALREADY_RUNNING', 'Já existe um processo em execução. Cancele-o antes de iniciar outro.')
  }
  const controller = new AbortController()
  activeProcesses.set(usuarioId, controller)
  return controller
}

export function cancelProcess(usuarioId: number): boolean {
  const controller = activeProcesses.get(usuarioId)
  if (!controller) return false
  controller.abort()
  activeProcesses.delete(usuarioId)
  return true
}

export function clearProcess(usuarioId: number): void {
  activeProcesses.delete(usuarioId)
}

export function hasActiveProcess(usuarioId: number): boolean {
  return activeProcesses.has(usuarioId)
}

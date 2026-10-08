// Export as a browser download.

import type { Exercise, Folder } from '@/core'
import { exportFile, exportFileName } from '@/core'

/**
 * Downloads the exercises as an export file, with the folders they're in, named after the one
 * exercise or today's date.
 */
export function downloadExport(exercises: Exercise[], folders: Folder[]) {
  const json = JSON.stringify(exportFile(exercises, folders), null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(exercises, new Date())
  link.click()
  // Some browsers start the download only after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

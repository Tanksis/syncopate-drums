import type { ReactNode } from 'react'
import { Dialog, DialogButton } from './Dialog'

/**
 * A modal that asks before something can't be taken back. Cancel has the focus, so Enter is safe;
 * Escape, Cancel and clicking outside call `onCancel`.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog
      title={title}
      onCancel={onCancel}
      buttons={
        <>
          <DialogButton autoFocus onClick={onCancel}>
            Cancel
          </DialogButton>
          <DialogButton danger onClick={onConfirm}>
            {confirmLabel}
          </DialogButton>
        </>
      }
    >
      {children}
    </Dialog>
  )
}

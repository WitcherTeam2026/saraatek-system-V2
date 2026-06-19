interface Props {
  message: string
  onClose?: () => void
}

export function ErrorBanner({ message, onClose }: Props) {
  return (
    <div className="flex items-start gap-2 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold leading-none">&times;</button>
      )}
    </div>
  )
}

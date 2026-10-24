import { ErrorComponent, Link, useLocation, useRouter, type ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useLocation({ select: location => location.pathname === '/' })
  return <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6" style={{ padding: 24 }}>
    <ErrorComponent error={error} />
    <div className="flex gap-2 items-center flex-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
      <button type="button" onClick={() => { void router.invalidate() }} className="px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold">Try Again</button>
      {isRoot ? <Link to="/" className="px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold">Home</Link> : <Link to="/" className="px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold" onClick={event => { event.preventDefault(); window.history.back() }}>Go Back</Link>}
    </div>
  </div>
}

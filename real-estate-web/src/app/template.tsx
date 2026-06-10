// Re-mounts on every navigation, giving each page a short entrance
// animation (see .page-transition in globals.css; honors reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition h-full">{children}</div>
}

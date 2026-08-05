export function PortalFooter() {
  return (
    <footer className="relative z-40 mb-16 md:mb-0 border-t border-border/60 px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
        <p className="font-mono">
          <span className="text-primary">//</span> GROSS BROS FUSION PORTAL · XRP-7 REBELLION NET
        </p>
        <nav className="flex items-center gap-5">
          <a
            href="#privacy"
            className="transition-colors hover:text-primary hover:text-glow"
          >
            Privacy Policy
          </a>
          <span aria-hidden className="h-3 w-px bg-border" />
          <a
            href="/terms"
            className="transition-colors hover:text-primary hover:text-glow"
          >
            Terms of Service
          </a>
        </nav>
      </div>
    </footer>
  )
}

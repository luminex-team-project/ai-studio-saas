export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <p>© {new Date().getFullYear()} Premium AI Studio</p>
      </div>
    </footer>
  )
}

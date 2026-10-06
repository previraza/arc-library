import { SiteHeader } from "@/site/library/site-header";
import { LibrarySidebar, type LibrarySection } from "@/site/library/library-sidebar";

/** Shared frame of the Components and Blocks sections: header, sticky sidebar, content column. */
export function LibraryShell({
  section,
  active,
  children,
}: {
  section: LibrarySection;
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-10 px-4 sm:px-6">
        <aside className="hidden w-60 shrink-0 py-8 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 pr-1">
            <LibrarySidebar section={section} active={active} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>
    </div>
  );
}
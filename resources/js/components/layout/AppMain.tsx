import { AppToolbar } from './AppToolbar';
import { AppContent } from './AppContent';
import { AppFooter } from './AppFooter';

export function AppMain({ loading }: { loading: boolean }) {
  return (
    <main className="flex-1 flex flex-col min-w-0">
      <AppToolbar />
      <AppContent loading={loading} />
      <AppFooter />
    </main>
  );
}

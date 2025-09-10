// import { User } from '@/api/user';
import { User } from '@/api/user';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { GalleryBreadcrumb } from '../gallery/GalleryBreadcrumb';
import NewGalleryButton from './NewGalleryButton';
interface DashboardProps {
  user: User | undefined;
  handleLogout: () => void;
  // handleLogin: (u: User) => void;
}
export default function Dashboard({ user, handleLogout }: DashboardProps) {
  //props: DashboardProps
  return (
    <>
      <SidebarProvider>
        <AppSidebar user={user} handleLogout={handleLogout} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <GalleryBreadcrumb />
              <NewGalleryButton />
            </div>
          </header>
          <main className="h-full">
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full">
              {/* {props.user ? (
                <button onClick={props.handleLogout}>Sign Out</button>
              ) : (
                <button onClick={props.handleLogin}>Sign In</button>
              )} */}
              {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
              </div> */}
              <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min overflow-auto">
                <Outlet /> {/* Nested routes render here */}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

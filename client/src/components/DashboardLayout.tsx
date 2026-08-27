import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckSquare,
  FlaskConical,
  Goal,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  MessagesSquare,
  PanelLeft,
  Settings,
  Sparkles,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuGroups = [
  {
    label: "Operate",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/" },
      { icon: MessagesSquare, label: "Chat", path: "/chat" },
      { icon: CheckSquare, label: "Tasks", path: "/tasks" },
      { icon: Goal, label: "Goals", path: "/goals" },
      { icon: BriefcaseBusiness, label: "Projects", path: "/projects" },
    ],
  },
  {
    label: "Grow",
    items: [
      { icon: BookOpen, label: "Learning", path: "/learning" },
      { icon: GraduationCap, label: "Exams", path: "/exams" },
      { icon: BrainCircuit, label: "Skills", path: "/skills" },
      { icon: FlaskConical, label: "Research", path: "/research" },
      { icon: LibraryBig, label: "Content", path: "/content" },
    ],
  },
  {
    label: "Reflect",
    items: [
      { icon: Sparkles, label: "Memory", path: "/memory" },
      { icon: ChartNoAxesCombined, label: "Progress", path: "/progress" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sparkle-sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 212;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] text-[#26322f] grid place-items-center p-6">
        <div className="max-w-md space-y-7 rounded-[2rem] border border-[#d8ddd2] bg-white p-9 text-center shadow-[0_20px_60px_rgba(38,50,47,0.10)]">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#153f35] text-[#f7f5ef]"><Sparkles className="size-6" /></div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7b8d84]">Private workspace</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to SPARKLE</h1>
            <p className="text-sm leading-6 text-[#68776f]">Your data is isolated to your account. Sign in to open your private operating dashboard.</p>
          </div>
          <Button onClick={() => startLogin()} size="lg" className="w-full bg-[#153f35] text-white hover:bg-[#0f3028]">Sign in privately</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuGroups.flatMap(group => group.items).find(item => item.path === location);

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - sidebarLeft;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar collapsible="icon" className="border-r border-[#dfe4dc] bg-[#153f35] text-[#edf3e9]" disableTransition={isResizing}>
          <SidebarHeader className="h-[78px] justify-center border-b border-white/10 px-3">
            <div className="flex w-full items-center gap-3">
              <button onClick={toggleSidebar} className="grid size-9 shrink-0 place-items-center rounded-xl text-[#d9e3d8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c38e]" aria-label="Toggle navigation"><PanelLeft className="size-4" /></button>
              {!isCollapsed && <div className="min-w-0"><p className="font-display text-lg font-semibold tracking-wide text-white">SPARKLE</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a7b9ae]">Personal operating system</p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-1 overflow-y-auto px-2 py-4">
            {menuGroups.map(group => (
              <SidebarGroup key={group.label} className="px-0 py-1.5">
                {!isCollapsed && <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8ea397]">{group.label}</SidebarGroupLabel>}
                <SidebarMenu>
                  {group.items.map(item => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-xl text-[#dfe7de] hover:bg-white/10 hover:text-white data-[active=true]:bg-[#d6c38e] data-[active=true]:font-semibold data-[active=true]:text-[#20302b]">
                        <item.icon className="size-4" /><span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c38e] group-data-[collapsible=icon]:justify-center">
                  <Avatar className="size-9 shrink-0 border border-white/15"><AvatarFallback className="bg-[#2d5a4b] text-xs font-semibold text-white">{user?.name?.charAt(0).toUpperCase() ?? "S"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-white">{user?.name || "Private user"}</p><p className="mt-1 truncate text-[11px] text-[#a7b9ae]">Private workspace</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-[#d6c38e]/50 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} />
      </div>
      <SidebarInset className="bg-[#f7f5ef]">
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#dfe4dc] bg-[#f7f5ef]/95 px-3 backdrop-blur"><SidebarTrigger className="size-9 rounded-xl bg-white text-[#153f35] shadow-sm" /><span className="font-display text-base font-semibold text-[#20302b]">{activeMenuItem?.label ?? "SPARKLE"}</span></div>}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}

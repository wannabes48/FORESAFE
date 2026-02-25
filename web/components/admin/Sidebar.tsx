"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/admin/login")
    }

    return (
        <div className={cn("pb-12 h-screen border-r bg-gray-100/40 dark:bg-gray-800/40", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        FORESAFE Admin
                    </h2>
                    <div className="space-y-1">
                        <Link href="/admin">
                            <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start" onClick={onLinkClick}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/admin/tags">
                            <Button variant={pathname === "/admin/tags" || pathname.startsWith("/admin/tags") ? "secondary" : "ghost"} className="w-full justify-start" onClick={onLinkClick}>
                                <Users className="mr-2 h-4 w-4" />
                                Tags Management
                            </Button>
                        </Link>
                        <Link href="/admin/settings">
                            <Button variant={pathname === "/admin/settings" ? "secondary" : "ghost"} className="w-full justify-start" onClick={onLinkClick}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="px-3 py-2 absolute bottom-0 w-full">
                <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/admin/Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/admin/login");
                return;
            }

            // Check role in profiles
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            if (error) {
                console.error("Error fetching profile:", error);
                router.push("/admin/login"); // Or access denied
                return;
            }

            if (!profile || profile.role !== "admin") {
                // Optionally show forbidden page
                // alert("Access Denied: Admins Only"); // Alert might be annoying
                router.push("/");
                return;
            }

            setIsAdmin(true);
        };

        checkUser();
    }, [router]);

    if (isAdmin === null) {
        return <div className="flex h-screen items-center justify-center">Checking permissions...</div>;
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b">
                <span className="font-bold">FORESAFE Admin</span>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Sidebar - Mobile: Overlay/Slide-in, Desktop: Fixed */}
            <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-in-out md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <Sidebar className="h-full" onLinkClick={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto h-screen">
                {children}
            </main>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}

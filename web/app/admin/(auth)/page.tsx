"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Users, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/Badge"

interface DashboardMetrics {
    totalTags: number;
    registeredTags: number;
    registrationRate: string;
}

interface RecentActivity {
    tag_id: string;
    created_at: string;
    is_registered: boolean;
    whatsapp_number: string | null;
}

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({ totalTags: 0, registeredTags: 0, registrationRate: "0%" });
    const [recentTags, setRecentTags] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch total tags
                const { count: totalTags, error: totalError } = await supabase
                    .from("tags")
                    .select("*", { count: "exact", head: true });

                // Fetch registered tags
                const { count: registeredTags, error: registeredError } = await supabase
                    .from("tags")
                    .select("*", { count: "exact", head: true })
                    .eq("is_registered", true);

                // Fetch recent activity (last 5 updated/created)
                const { data: recent, error: recentError } = await supabase
                    .from("tags")
                    .select("tag_id, created_at, is_registered, whatsapp_number")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (totalError || registeredError || recentError) throw new Error("Failed to fetch data");

                const total = totalTags || 0;
                const reg = registeredTags || 0;
                const rate = total > 0 ? ((reg / total) * 100).toFixed(1) + "%" : "0%";

                setMetrics({ totalTags: total, registeredTags: reg, registrationRate: rate });
                setRecentTags(recent || []);

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-4">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of FORESAFE system status.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalTags}</div>
                        <p className="text-xs text-muted-foreground">Total printed/generated tags</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registered Tags</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.registeredTags}</div>
                        <p className="text-xs text-muted-foreground">Active protected vehicles</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registration Rate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.registrationRate}</div>
                        <p className="text-xs text-muted-foreground">Of total inventory</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest tags added or updated in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentTags.length === 0 ? <p className="text-sm text-gray-500">No activity found.</p> :
                            recentTags.map((tag) => (
                                <div key={tag.tag_id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-sm">{tag.tag_id}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(tag.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={tag.is_registered ? "default" : "secondary"}>
                                            {tag.is_registered ? "Registered" : "Unclaimed"}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

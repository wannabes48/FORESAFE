"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Loader2, Upload, FileUp, Search, RefreshCw, Download, QrCode } from "lucide-react"
import Papa from "papaparse"
import QRCode from "qrcode"
import JSZip from "jszip"

interface Tag {
    tag_id: string
    whatsapp_number: string | null
    is_registered: boolean
    created_at: string
}

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [generatingQR, setGeneratingQR] = useState(false)
    const [search, setSearch] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchTags = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from("tags")
                .select("*")
                .order("created_at", { ascending: false })

            if (search) {
                query = query.ilike("tag_id", `%${search}%`)
            }

            const { data, error } = await query.limit(100)

            if (error) throw error
            setTags(data || [])
        } catch (error) {
            console.error("Error fetching tags:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTags()
    }, [search])

    const handleDownloadQRBatch = async () => {
        setGeneratingQR(true)
        try {
            // Fetch ALL tags for batch, not just search results or limit 100? 
            // For now let's just use the current visible tags or maybe fetch all if user wants?
            // User request implies "Batch" which usually means entire set or current selection.
            // Let's create a separate fetch for ALL tags to ensure we get everything for the batch if needed, 
            // OR just use current view. Let's ask user? "Download QR for CURRENT list" is safer.
            // But usually "Batch" implies large set. 
            // Let's implement fetching ALL tags to be safe for a "Batch Download" button.

            const { data: allTags, error } = await supabase
                .from("tags")
                .select("tag_id")

            if (error) throw error
            if (!allTags || allTags.length === 0) {
                alert("No tags found to generate QRs.")
                return
            }

            const zip = new JSZip()
            const folder = zip.folder("foresafe_qrs")

            // Limit to avoid browser crash on massive datasets if thousands? 
            // batch process? For now assuming reasonable size (< 1000).

            let count = 0;
            for (const tag of allTags) {
                const url = `https://foresafe.vercel.app/s/${tag.tag_id}`
                const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
                // Remove header to get base64 data
                const base64Data = qrDataUrl.split(',')[1]
                folder?.file(`${tag.tag_id}.png`, base64Data, { base64: true })
                count++;
            }

            const content = await zip.generateAsync({ type: "blob" })
            const downloadUrl = URL.createObjectURL(content)

            const link = document.createElement("a")
            link.href = downloadUrl
            link.download = `foresafe_qrs_${new Date().toISOString().split('T')[0]}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            alert(`Generated and downloaded ${count} QR codes.`)

        } catch (error: any) {
            console.error("QR Generation Error:", error)
            alert("Failed to generate QR batch: " + error.message)
        } finally {
            setGeneratingQR(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                try {
                    const rows = results.data as any[]
                    // Expected format: { tag_id: "FS-001", ... }
                    // Filter out empty rows
                    const validRows = rows.filter(r => r.tag_id).map(r => ({
                        tag_id: r.tag_id.trim().toUpperCase(),
                        is_registered: false // Default to false on import
                    }))

                    if (validRows.length === 0) {
                        alert("No valid tag_id found in CSV.")
                        setUploading(false)
                        return
                    }

                    const { error } = await supabase
                        .from("tags")
                        .upsert(validRows, { onConflict: "tag_id", ignoreDuplicates: true })

                    if (error) throw error

                    alert(`Successfully imported ${validRows.length} tags.`)
                    fetchTags()
                    if (fileInputRef.current) fileInputRef.current.value = ""
                } catch (error: any) {
                    console.error("Import error:", error)
                    alert("Import failed: " + error.message)
                } finally {
                    setUploading(false)
                }
            },
            error: (error) => {
                console.error("CSV Parse error:", error)
                setUploading(false)
                alert("Failed to parse CSV file.")
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tags Management</h1>
                    <p className="text-muted-foreground">Manage and import vehicle safety tags.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fetchTags()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadQRBatch} disabled={generatingQR}>
                        {generatingQR ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                        Download QR Batch
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".csv"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Import CSV
                        </Button>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tags Inventory</CardTitle>
                    <CardDescription>
                        Search and view tags. Displaying up to 100 recent matching results.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Tag ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    <div className="rounded-md border">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Tag ID</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Owner Contact</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created At</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {tags.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                No tags found. Import a CSV to get started.
                                                <br />
                                                <span className="text-xs">CSV Format: Header row with <code>tag_id</code> column.</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        tags.map((tag) => (
                                            <tr key={tag.tag_id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 font-medium">{tag.tag_id}</td>
                                                <td className="p-4">
                                                    <Badge variant={tag.is_registered ? "default" : "secondary"}>
                                                        {tag.is_registered ? "Registered" : "Unclaimed"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">{tag.whatsapp_number || "-"}</td>
                                                <td className="p-4">{new Date(tag.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

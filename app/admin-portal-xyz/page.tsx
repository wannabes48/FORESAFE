"use client"

import { useState } from "react"
import Papa from "papaparse"
import QRCode from "qrcode"
import JSZip from "jszip"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Upload, FileDown, Loader2 } from "lucide-react"

export default function AdminPage() {
    const [file, setFile] = useState<File | null>(null)
    const [stats, setStats] = useState<{ processed: number, added: number, skipped: number } | null>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0])
            setStats(null)
        }
    }

    const processCSV = async () => {
        if (!file) return

        setLoading(true)
        setStats(null)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as { tag_id: string }[]
                let added = 0
                let skipped = 0

                console.log("Parsed rows:", rows)

                // Process in chunks or one by one
                for (const row of rows) {
                    const tagId = row.tag_id?.trim().toUpperCase()
                    if (!tagId) continue

                    // Check if exists
                    const { data: existing } = await supabase
                        .from('tags')
                        .select('tag_id')
                        .eq('tag_id', tagId)
                        .single()

                    if (!existing) {
                        const { error } = await supabase
                            .from('tags')
                            .insert([{ tag_id: tagId, is_registered: false }])

                        if (!error) added++
                        else console.error(error)
                    } else {
                        skipped++
                    }
                }

                setStats({ processed: rows.length, added, skipped })
                setLoading(false)
            }
        })
    }

    const generateQRBatch = async () => {
        setGenerating(true)

        try {
            // Fetch all tags (or maybe just unregistered ones? Usually all for printing)
            // Let's fetch all tags
            const { data: tags, error } = await supabase
                .from('tags')
                .select('tag_id')

            if (error || !tags) throw new Error("Failed to fetch tags")

            const zip = new JSZip()
            const folder = zip.folder("foresafe_qrs")

            for (const tag of tags) {
                const url = `https://foresafe.in/s/${tag.tag_id}`
                const qrDataUrl = await QRCode.toDataURL(url, { width: 500, margin: 2 })

                // Remove header "data:image/png;base64,"
                const base64Data = qrDataUrl.split(',')[1]
                folder?.file(`${tag.tag_id}.png`, base64Data, { base64: true })
            }

            const content = await zip.generateAsync({ type: "blob" })
            const link = document.createElement("a")
            link.href = URL.createObjectURL(content)
            link.download = "foresafe_qrs.zip"
            link.click()

        } catch (error) {
            console.error("QR Generation failed:", error)
            alert("Failed to generate QR batch")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>FORESAFE Admin Portal</CardTitle>
                    <CardDescription>Upload CSV to create tags and generate QR codes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* CSV Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4 hover:bg-gray-50 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="space-y-2">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500">
                                CSV must have a header <code>tag_id</code>.
                            </p>
                        </div>
                    </div>

                    {file && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{file.name}</span>
                            <Button onClick={processCSV} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Processing..." : "Import Tags"}
                            </Button>
                        </div>
                    )}

                    {stats && (
                        <div className="bg-green-50 p-4 rounded-md text-green-800 text-sm">
                            <p><strong>Processed:</strong> {stats.processed}</p>
                            <p><strong>New Tags Added:</strong> {stats.added}</p>
                            <p><strong>Skipped (Duplicate):</strong> {stats.skipped}</p>
                        </div>
                    )}

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">QR Batch Generation</h3>
                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={generateQRBatch}
                            disabled={generating}
                        >
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            {generating ? "Generating batch..." : "Download All QR Codes (.zip)"}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Generates QR codes for ALL tags in database pointing to <code>foresafe.in/s/[tagId]</code>.
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

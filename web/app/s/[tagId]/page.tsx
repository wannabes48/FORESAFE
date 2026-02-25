"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/Button"
import { MessageCircle, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react"
import Link from "next/link"

export default function TagPage() {
    const params = useParams()
    const tagId = params.tagId as string
    const [tag, setTag] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState<string | null>(null)

    useEffect(() => {
        async function fetchTag() {
            const cleanTagId = tagId.trim().toUpperCase();
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('tag_id', cleanTagId)
                .single()

            if (error || !data) {
                setTag(null) // Tag not found or error
            } else {
                setTag(data)
            }
            setLoading(false)
        }
        fetchTag()
    }, [tagId])

    async function sendAlert(type: 'PARKING' | 'EMERGENCY' | 'GENERAL') {
        setSending(type)
        try {
            // 1. Send Push Notification via API
            const response = await fetch('/api/send-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId, type }),
            })

            const result = await response.json()

            // 2. If it's a GENERAL contact and we have a WhatsApp number, open WhatsApp
            if (type === 'GENERAL' && tag?.whatsapp_number) {
                const message = encodeURIComponent(`Hi, I'm at your vehicle (${tagId}). Please check your vehicle status.`)
                const whatsappUrl = `https://wa.me/${tag.whatsapp_number}?text=${message}`
                window.open(whatsappUrl, '_blank')
            }

            if (response.ok) {
                if (type !== 'GENERAL') {
                    alert("Owner has been notified anonymously!")
                }
            } else {
                alert(result.error || "Failed to notify owner. Please try again.")
            }
        } catch (error) {
            alert("An error occurred while sending the alert.")
        } finally {
            setSending(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Vehicle Contact</h1>
                    <p className="text-gray-500">
                        You are scanning tag <strong>{tagId}</strong>.
                    </p>
                    <p className="text-sm text-gray-500">
                        The owner will be notified instantly and anonymously.
                    </p>
                </div>

                {(!tag || !tag.is_registered) ? (
                    <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center space-y-6">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="h-10 w-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Tag Not Activated</h2>
                        <p className="text-gray-500 leading-relaxed">
                            This vehicle tag has not been activated by the owner yet.
                            If you are the owner, please link your device in the mobile app.
                        </p>
                        <Link href={`/register?tag=${tagId}`} className="block">
                            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg rounded-xl">
                                Activate This Tag
                            </Button>
                        </Link>
                    </div>
                ) : !tag.push_enabled ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Owner Unavailable</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            The owner has temporarily disabled notifications or is currently out of reach.
                            Please try again later or leave a physical note if possible.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button
                            onClick={() => sendAlert('GENERAL')}
                            disabled={!!sending}
                            className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 space-x-2 rounded-xl transition-all active:scale-95"
                        >
                            {sending === 'GENERAL' ? <Loader2 className="h-6 w-6 animate-spin" /> : <MessageCircle className="h-6 w-6" />}
                            <span>Contact Owner</span>
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => sendAlert('PARKING')}
                            disabled={!!sending}
                            className="w-full h-16 text-lg border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-101 text-yellow-800 space-x-2 rounded-xl transition-all active:scale-95"
                        >
                            {sending === 'PARKING' ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertTriangle className="h-6 w-6" />}
                            <span>Wrong Parking</span>
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => sendAlert('EMERGENCY')}
                            disabled={!!sending}
                            className="w-full h-16 text-lg animate-pulse space-x-2 rounded-xl transition-all active:scale-95"
                        >
                            {sending === 'EMERGENCY' ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldAlert className="h-6 w-6" />}
                            <span>Emergency</span>
                        </Button>
                    </div>
                )}

                <div className="text-center text-xs text-gray-400 mt-8">
                    Powered by <span className="font-bold text-blue-500">FORESAFE</span> relative anonymity system.
                </div>
            </div>
        </div>
    )
}

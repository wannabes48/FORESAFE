import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/Button"
import { MessageCircle, AlertTriangle, ShieldAlert } from "lucide-react"
import Link from "next/link"

interface PageProps {
    params: Promise<{ tagId: string }>
}

export default async function TagPage({ params }: PageProps) {
    const { tagId } = await params

    // Fetch tag details
    const { data: tag, error } = await supabase
        .from('tags')
        .select('*')
        .eq('tag_id', tagId)
        .single()

    // If tag doesn't exist or not registered, redirect to register
    if (error || !tag || !tag.is_registered) {
        redirect(`/register?tag=${tagId}`)
    }

    // Determine phone number (remove non-digits, ensure it has country code if not present, but we stored it with +91)
    const phone = tag.whatsapp_number

    // WhatsApp Messages
    const msgOwner = `Hi, I am reaching out regarding your vehicle (${tagId}).`
    const msgParking = `Urgent: Your vehicle (${tagId}) is parked incorrectly. Please move it.`
    const msgEmergency = `EMERGENCY: Regarding vehicle ${tagId}. Please respond immediately!`

    const linkOwner = `https://wa.me/${phone}?text=${encodeURIComponent(msgOwner)}`
    const linkParking = `https://wa.me/${phone}?text=${encodeURIComponent(msgParking)}`
    const linkEmergency = `https://wa.me/${phone}?text=${encodeURIComponent(msgEmergency)}`

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Vehicle Contact</h1>
                    <p className="text-gray-500">
                        You are scanning tag <strong>{tagId}</strong>.
                    </p>
                    <p className="text-sm text-gray-500">
                        Choose an option to contact the owner securely via WhatsApp.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link href={linkOwner} target="_blank" className="block w-full">
                        <Button className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 space-x-2">
                            <MessageCircle className="h-6 w-6" />
                            <span>WhatsApp Owner</span>
                        </Button>
                    </Link>

                    <Link href={linkParking} target="_blank" className="block w-full">
                        <Button variant="secondary" className="w-full h-16 text-lg border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 space-x-2">
                            <AlertTriangle className="h-6 w-6" />
                            <span>Wrong Parking</span>
                        </Button>
                    </Link>

                    <Link href={linkEmergency} target="_blank" className="block w-full">
                        <Button variant="destructive" className="w-full h-16 text-lg animate-pulse space-x-2">
                            <ShieldAlert className="h-6 w-6" />
                            <span>Emergency</span>
                        </Button>
                    </Link>
                </div>

                <div className="text-center text-xs text-gray-400 mt-8">
                    Powered by <span className="font-bold text-blue-500">FORESAFE</span> relative anonymity system.
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Shield, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { supabase } from "@/lib/supabaseClient"

import { countryCodes } from "@/lib/countries"

function RegisterForm() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Tag ID logic: use param if available
    const initialTag = searchParams.get("tag") || ""
    const [tagId, setTagId] = useState(initialTag)
    const [whatsapp, setWhatsapp] = useState("")
    const [countryCode, setCountryCode] = useState("+91")
    const [pushToken, setPushToken] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const isTagReadOnly = !!initialTag

    // Simulate push token collection
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    // In a real app, you'd get the FCM token here
                    // const token = await getToken(messaging, { vapidKey: '...' });
                    const mockToken = "mock-fcm-token-" + Math.random().toString(36).substr(2, 9);
                    setPushToken(mockToken);
                    console.log("Push token generated:", mockToken);
                }
            });
        }
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const formattedTag = tagId.trim().toUpperCase()
        let phone = whatsapp.trim().replace(/\D/g, "")
        phone = phone.replace(/^0+/, "")
        const code = countryCode.replace("+", "")
        phone = code + phone

        try {
            const { data: tagData, error: fetchError } = await supabase
                .from('tags')
                .select('is_registered')
                .eq('tag_id', formattedTag)
                .single()

            if (fetchError || !tagData) {
                setMessage({ type: 'error', text: "Invalid Tag ID. Please check the code on your sticker." })
                setLoading(false)
                return
            }

            if (tagData.is_registered) {
                setMessage({ type: 'error', text: "This Tag ID is already registered." })
                setLoading(false)
                return
            }

            const { error: updateError } = await supabase
                .from('tags')
                .update({
                    whatsapp_number: phone,
                    push_token: pushToken,
                    is_registered: true
                })
                .eq('tag_id', formattedTag)

            if (updateError) throw updateError

            router.push(`/register/success?id=${tagId.toUpperCase()}`);
            setMessage({ type: 'success', text: "Tag Registered! Your vehicle is now protected." })

        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: "Registration failed. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    if (message?.type === 'success') {
        return (
            <Card className="w-full max-w-md mx-auto mt-10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <CardTitle>Registration Successful!</CardTitle>
                    <CardDescription>
                        Your vehicle tag <strong>{tagId}</strong> is active.
                        <br />
                        <span className="text-sm text-gray-500">Please print and place your tag on your vehicle.</span>
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push('/register/success/' + tagId)}>View Tag</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    Register Tag
                </CardTitle>
                <CardDescription className="text-center">
                    Link your FORESAFE sticker to your WhatsApp.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="tag">
                            Tag ID
                        </label>
                        <Input
                            id="tag"
                            placeholder="FS-0001"
                            value={tagId}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagId(e.target.value)}
                            readOnly={isTagReadOnly}
                            className={isTagReadOnly ? "bg-muted" : ""}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="whatsapp">
                            WhatsApp Number
                        </label>
                        <div className="flex">
                            <select
                                className="flex h-9 w-[110px] items-center justify-between whitespace-nowrap rounded-l-md border border-r-0 border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                            >
                                {countryCodes.map((c) => (
                                    <option key={c.code + c.country} value={c.code}>
                                        {c.code} ({c.country})
                                    </option>
                                ))}
                            </select>
                            <Input
                                id="whatsapp"
                                placeholder="Phone number"
                                className="rounded-l-none"
                                value={whatsapp}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsapp(e.target.value)}
                                type="tel"
                                required
                                pattern="[0-9]{1,15}"
                                title="Please enter a valid mobile number"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Select your country code and enter your number.
                        </p>
                    </div>
                    {message?.type === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                            {message.text}
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? "Registering..." : "Register My Tag"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-500 text-center">
                    By registering, you agree to our Terms of Service.
                </p>
            </CardFooter>
        </Card >
    )
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    )
}

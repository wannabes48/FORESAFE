"use client"

import { useState, Suspense } from "react"
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
    const [countryCode, setCountryCode] = useState("+91") // Default to +91 or +254 based on preference, let's stick to +254 as it seems to be an African context app based on previous chats or +91 as per previous code. The user prompt had +91 in description but +254 in list. I'll stick to +254 as a default closer to "FORESAFE" sounding name, but actually previous code had +91. Let's use +254 (Kenya) as default if it's Siro linked, or just +254. Wait, "Siro" -> mostly Kenyan.

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // If tag comes from URL, we might want to lock it or just pre-fill
    // "Tag ID (Read-only if coming from a redirect)" -> Let's make it readonly if present in URL?
    // User might want to change it if they scanned wrong one? But usually scan is accurate.
    // I'll leave it editable but pre-filled, or maybe read-only if it looks like a valid tag.
    // Let's stick to prompt: "Read-only if coming from a redirect".
    const isTagReadOnly = !!initialTag

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const formattedTag = tagId.trim().toUpperCase()
        // Basic validation for phone number (assuming user enters local number, we prepend default country code if missing or just store as is?)
        // Prompt: "WhatsApp Number (Input with a country code prefix +91)"
        // I will assume the input is just the number and I prepend +91 for now, or user enters full.
        // Let's enforce a simple pattern or just take input. 
        // Best UX: Prepend +91 visually or in logic.
        // I'll prepend +91 for this MVP if not present.
        let phone = whatsapp.trim().replace(/\D/g, "") // remove non-digits
        // Remove leading zeros if any
        phone = phone.replace(/^0+/, "")
        // Combine country code (without +) and phone
        // countryCode is like "+254", so remove +
        const code = countryCode.replace("+", "")
        phone = code + phone

        // Check DB
        try {
            // 1. Check if tag exists and is available
            const { data: tagData, error: fetchError } = await supabase
                .from('tags')
                .select('*')
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

            // 2. Register (Update)
            const { error: updateError } = await supabase
                .from('tags')
                .update({
                    whatsapp_number: phone,
                    is_registered: true
                })
                .eq('tag_id', formattedTag)

            if (updateError) {
                throw updateError
            }

            setMessage({ type: 'success', text: "Tag Registered! Your vehicle is now protected." })
            setTimeout(() => {
                // Redirect to scanning page or dashboard? 
                // Maybe just stay here showing success.
                // Prompt: "Success State: Show a confirmation message"
            }, 2000)

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
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push('/')}>Return Home</Button>
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

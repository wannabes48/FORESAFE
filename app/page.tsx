import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, MessageCircle, AlertTriangle, Car, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center font-bold text-xl text-blue-600" href="#">
          <Shield className="h-6 w-6 mr-2" />
          FORESAFE
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
            How It Works
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#contact">
            Contact
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-blue-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Privacy, Your Safety.
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Connect with your vehicle securely. Receive alerts for parking and emergencies without sharing your phone number.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button className="h-11 px-8">Register Tag</Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" className="h-11 px-8">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Three simple steps to secure your vehicle.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                  <Car className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Get Your Tag</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Place the unique FORESAFE QR code on your vehicle's windshield or dashboard.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-900">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">2. Public Scans</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Anyone can scan the code to alert you about wrong parking or emergencies instantly.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-900">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">3. You Connect</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Receive a WhatsApp message immediately without revealing your personal number.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features/Trust Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm dark:bg-blue-800 text-blue-700">
                  Privacy First
                </div>
                <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Security through communication.
                </h2>
                <Link href="/register">
                  <Button className="mt-4">Get Started</Button>
                </Link>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <div className="flex items-start gap-4">
                  <Lock className="mt-1 h-6 w-6 text-blue-600" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Anonymous Contact</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Your phone number is never exposed to the public. All communication happens via our secure redirect system.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="mt-1 h-6 w-6 text-blue-600" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Instant Alerts</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Whether it's a blocked driveway or a hazard, know about it instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-white border-t">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Need Help?</h2>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mt-4">
              Our support team is available to assist you with registration or any other queries.
            </p>
            <div className="mt-8">
              <Link href="mailto:support@foresafe.in">
                <Button variant="secondary" className="mr-4">Email Support</Button>
              </Link>
              <Link href="https://wa.me/91XXXXXXXXXX" target="_blank">
                <Button variant="outline">WhatsApp Helpdesk</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 w-full shrink-0 items-center px-4 md:px-6 border-t flex flex-col sm:flex-row justify-between gap-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} FORESAFE. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

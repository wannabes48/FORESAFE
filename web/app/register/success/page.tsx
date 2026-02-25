"use client";
import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCode } from 'react-qrcode-logo';
import { Download, Printer, Car, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get('id');
  const qrRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadQR = () => {
    if (tagId) {
      qrRef.current?.download('png', `FORESAFE-${tagId}`);
    }
  };

  const printQR = () => {
    window.print();
  };

  if (!mounted) return <div className="p-10 text-center">Loading...</div>;

  if (!tagId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">No Tag ID Found</h1>
        <p className="text-gray-600">Please register a tag first.</p>
        <Link href="/register">
          <Button>Go to Registration</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-8 mt-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-green-600">Registration Complete!</h1>
        <p className="text-gray-600">Your vehicle is now FORESAFE protected.</p>
      </div>

      {/* Branded QR Card for Printing */}
      <div id="printable-tag" className="bg-white border-2 border-dashed border-gray-300 p-8 rounded-xl shadow-lg inline-block">
        <QRCode
          ref={qrRef}
          value={`https://foresafe.vercel.app/s/${tagId}`}
          size={250}
          logoImage="/logo.svg"
          logoWidth={60}
          logoPadding={5}
          logoPaddingStyle="circle"
          qrStyle="dots"
          eyeRadius={10}
          ecLevel="H"
        />
        <p className="mt-4 font-mono text-xl font-bold tracking-widest">{tagId}</p>
        <p className="text-xs text-gray-400 mt-1">foresafe.in</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 no-print">
        <button onClick={downloadQR} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
          <Download size={20} /> Download Digital Copy
        </button>
        <button onClick={printQR} className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg hover:bg-black transition">
          <Printer size={20} /> Print Tag
        </button>
      </div>

      {/* Placement Instructions */}
      <div className="bg-blue-50 p-6 rounded-xl text-left border border-blue-100 no-print">
        <h3 className="flex items-center gap-2 font-bold text-blue-800 mb-3">
          <Car size={20} /> Where to place your tag?
        </h3>
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
          <li><strong>Bottom Corner of Windshield:</strong> Place on the driver-side interior.</li>
          <li><strong>Clear Visibility:</strong> Ensure it&apos;s not blocked by wipers or tint strips.</li>
          <li><strong>Exterior Option:</strong> If printing as a sticker, use the rear window or bumper.</li>
          <li><strong>Test Scan:</strong> Always scan your own tag once after placement to ensure it works!</li>
        </ul>
      </div>
    </div>
  );
}

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10">
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
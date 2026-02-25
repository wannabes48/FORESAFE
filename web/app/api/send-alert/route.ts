import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { tagId: rawTagId, type } = await request.json();
    const tagId = rawTagId?.trim().toUpperCase();

    if (!tagId || !type) {
      return NextResponse.json({ error: 'Missing tagId or type' }, { status: 400 });
    }

    // Check if notifications are enabled for this tag
    const { data: tag, error } = await supabase
      .from('tags')
      .select('push_enabled, is_registered')
      .eq('tag_id', tagId)
      .single();

    if (error || !tag) {
      console.error(`Tag ${tagId} not found in database:`, error);
      return NextResponse.json({ error: `Tag ${tagId} not found. Please ensure it is registered.` }, { status: 404 });
    }

    if (!tag.is_registered) {
      return NextResponse.json({ error: `Tag ${tagId} exists but has not been activated by the owner.` }, { status: 400 });
    }

    if (!tag.push_enabled) {
      console.warn(`Push notifications disabled for tag ${tagId}`);
      return NextResponse.json({ error: 'Owner has temporarily disabled push notifications (Privacy Mode)' }, { status: 400 });
    }

    // Send push notification via OneSignal using the External ID (tagId)
    // This is the most reliable way to target the linked device
    const message = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [tagId],
      headings: { en: "FORESAFE Security Alert" },
      contents: { en: `Urgent: A ${type} issue has been reported for vehicle ${tagId}.` },
      priority: 10, // High priority to wake the device
      android_sound: "os_notification_custom_sound", // Optional custom sound
      ios_sound: "notification.wav"
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return NextResponse.json({
        error: 'Failed to send notification via OneSignal',
        details: result
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'Alert sent successfully',
      oneSignalId: result.id
    });
  } catch (err) {
    console.error('Error sending alert:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

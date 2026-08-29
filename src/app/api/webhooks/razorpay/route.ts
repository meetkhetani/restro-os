import { NextResponse, type NextRequest } from "next/server";
import { processRazorpayWebhook } from "@/domain/billing/service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const result = await processRazorpayWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      message: result.message,
    });
  } catch (error) {
    console.error("Razorpay webhook handler exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

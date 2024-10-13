import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const return_url = process.env.NEXT_BASE_URL + "/";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (_userSubscriptions[0] && _userSubscriptions[0].razorpayCustomerId) {
      // User has a subscription, create a payment link for management
      const paymentLink = await razorpay.paymentLink.create({
        amount: 2000,
        currency: "INR",
        accept_partial: false,
        description: "Subscription Management",
        customer: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.emailAddresses[0].emailAddress,
          contact: user?.phoneNumbers[0]?.phoneNumber || '',
        },
        notify: {
          email: true,
        },
        reminder_enable: false,
        notes: {
          purpose: "Subscription Management",
        },
      });

      return NextResponse.json({ url: paymentLink.short_url });
    }

    // User's first time subscribing
    const order = await razorpay.orders.create({
      amount: 2000 * 100, // Amount in paise (20 USD)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId,
      },
    });

    const options = {
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "LegalDoc AI",
      description: "Unlimited PDF sessions!",
      order_id: order.id,
      prefill: {
        name: user?.firstName + ' ' + user?.lastName,
        email: user?.emailAddresses[0].emailAddress,
        contact: user?.phoneNumbers[0]?.phoneNumber || '',
      },
      notes: {
        userId: userId,
      },
      theme: {
        color: "#F37254",
      },
    };

    return NextResponse.json({ options: options });
  } catch (error) {
    console.log("razorpay error", error);
    return new NextResponse("internal server error", { status: 500 });
  }
}
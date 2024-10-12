import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { userSubscriptions } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const checkSubscription = async () => {
  const { userId } = auth();
  if (!userId) {
    return false;
  }

  const _userSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  if (!_userSubscriptions[0]) {
    return false;
  }

  const userSubscription = _userSubscriptions[0];

  const isValid =
    userSubscription.razorpayPriceId &&
    userSubscription.razorpayCurrentPeriodEnd &&
    userSubscription.razorpayCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

  return !!isValid;
};

export const updateSubscription = async (
  userId: string, 
  subscriptionData: Partial<typeof userSubscriptions.$inferInsert>
) => {
  const {
    razorpayCustomerId,
    razorpaySubscriptionId,
    razorpayPriceId,
    razorpayCurrentPeriodEnd,
    status
  } = subscriptionData;

  await db
    .insert(userSubscriptions)
    .values({
      userId,
      razorpayCustomerId: razorpayCustomerId || '',
      razorpaySubscriptionId,
      razorpayPriceId,
      razorpayCurrentPeriodEnd,
      status: status || 'active',
    })
    .onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        razorpayCustomerId: razorpayCustomerId,
        razorpaySubscriptionId: razorpaySubscriptionId,
        razorpayPriceId: razorpayPriceId,
        razorpayCurrentPeriodEnd: razorpayCurrentPeriodEnd,
        status: status,
      },
    });
};
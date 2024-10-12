import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { chats, documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkSubscription } from "@/lib/subscription";

export async function getServerSideProps() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPremium = await checkSubscription();
  let firstChat;
  let documentCount = 0;

  if (userId) {
    firstChat = await db.select().from(chats).where(eq(chats.userId, userId));
    if (firstChat.length > 0) {
      firstChat = firstChat[0];
    }

    const userDocuments = await db.select().from(documents).where(eq(documents.userId, userId));
    documentCount = userDocuments.length;
  }

  return {
    isAuth,
    isPremium,
    firstChat,
    documentCount,
  };
}
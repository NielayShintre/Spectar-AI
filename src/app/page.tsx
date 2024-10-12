import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { chats, documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkSubscription } from "@/lib/subscription";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ),
});

export default async function Home() {
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

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <HomeClient isAuth={isAuth} isPremium={isPremium} firstChat={firstChat} />
    </Suspense>
  );
}
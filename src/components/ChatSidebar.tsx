"use client";
import { useState } from "react";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { chats } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSidebar = ({ chats, chatId }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleSubscription = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Create order by calling the server endpoint
      const response = await axios.post("/api/create-order", {
        amount: 2000, 
        currency: "INR",
        receipt: "receipt#1",
        notes: {},
      });

      const order = response.data;

      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, // Use public key
        amount: order.amount,
        currency: order.currency,
        name: "LegalDoc AI",
        description: "Upgrade to Premium",
        order_id: order.id, // This is the order_id created in the backend
        callback_url: "/api/verify-payment", // Your success URL
        prefill: {
          name: "Your Name",
          email: "your.email@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#F37254",
        },
        handler: function (response: any) {
          axios.post("/api/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
            .then((res) => {
              if (res.data.status === "ok") {
                window.location.href = "/payment-success";
              } else {
                alert("Payment verification failed");
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Error verifying payment");
            });
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen p-4 text-gray-200 bg-gray-900">
      <Link href="/">
        <Button className="w-full border-dashed border-white border">
          <PlusCircle className="mr-2 w-4 h-4"></PlusCircle>
          New Chat
        </Button>
      </Link>
      <div className="flex flex-col gap-2 mt-4">
        {chats.map((chat) => {
          return (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn(
                  "rounded-lg p-3 text-slate-300 flex items-center",
                  {
                    "bg-blue-600": chat.id === chatId,
                    "hover:text-white": chat.id !== chatId,
                  }
                )}
              >
                <MessageCircle className="mr-2" />
                <p className="w-full overflow-hidden truncate whitespace-nowrap text-ellipsis">
                  {chat.pdfName}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href="/">Home</Link>
          <Link href="/">Source</Link>
        </div>
        <Button
          className="mt-2 text-white bg-yellow-600 cursor-pointer"
          onClick={handleSubscription}
          disabled={loading}
        >
          Upgrade To Premium ✨
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
// HomeClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight, LogIn, Loader2, FileText, Scale } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";
import UpgradeModal from "@/components/UpgradeModal";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface HomeClientProps {
  isAuth: boolean;
  isPremium: boolean;
  firstChat: any;
}

export default function HomeClient({
  isAuth,
  isPremium,
  firstChat,
}: HomeClientProps) {
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchChatCount = async () => {
      try {
        const response = await axios.get("/api/get-chat-count");
        console.log("Current chat count:", response.data.count);
        setChatCount(response.data.count);
      } catch (error) {
        console.error("Error fetching chat count:", error);
      }
    };

    if (isAuth) {
      fetchChatCount();
    }
  }, [isAuth]);

  const handleSubscription = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post("/api/create-order", {
        amount: 2000,
        currency: "INR",
        receipt: "receipt#1",
        notes: {},
      });

      const order = response.data;

      const options = {
        key: process.env.RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: "Spectar AI",
        description: "Upgrade to Premium",
        order_id: order.id,
        handler: function (response: any) {
          setShowUpgradeModal(false); // Close the modal after successful payment
          axios
            .post("/api/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            .then((res) => {
              if (res.data.status === "ok") {
                router.push("/payment-success");
              } else {
                toast.error("Payment verification failed");
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              toast.error("Error verifying payment");
            });
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  console.log(
    "HomeClient render. isPremium:",
    isPremium,
    "chatCount:",
    chatCount
  );

  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-gradient-to-r from-blue-500 to-slate-300">
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center">
          <Scale className="w-12 h-12 mr-3 text-blue-900" />
          <h1 className="text-4xl font-bold text-blue-900">Spectar AI</h1>
        </div>
        <div className="max-w-4xl p-8 bg-white bg-opacity-90 rounded-lg shadow-xl">
          <div className="flex flex-col items-center text-center">
            {/* <div className="flex items-center mb-6">
              <FileText className="w-12 h-12 text-blue-500 mr-4" />
            </div> */}
            <div className="flex items-center">
              <FileText className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="mr-3 text-3xl font-bold text-gray-800">
                <span className="text-blue-600">Chat with</span> any Legal
                Document
              </h1>
              <UserButton afterSwitchSessionUrl="/" />
            </div>
            <div className="flex mt-3 space-x-3">
              {isAuth && firstChat && (
                <Link href={`/chat/${firstChat.id}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              )}
              {!isPremium && (
                <Button
                  className="text-white bg-yellow-600 hover:bg-yellow-700"
                  disabled={loading}
                  onClick={handleSubscription}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Get Premium"
                  )}
                </Button>
              )}
            </div>

            <p className="max-w-xl mt-3 text-lg text-gray-600">
              Empowering lawyers with AI-driven insights
            </p>

            <div className="w-full mt-3">
              {isAuth ? (
                <>
                  <p className="mb-2 text-sm text-gray-600">
                    Credits Used: <strong>{chatCount}/3</strong>
                    {!isPremium && chatCount >= 3 && (
                      <span className="ml-2 text-red-500">
                        (Upgrade to create more chats)
                      </span>
                    )}
                  </p>
                  <FileUpload
                    isPremium={isPremium}
                    chatCount={chatCount}
                    onUpgradeRequired={handleSubscription}
                  />
                </>
              ) : (
                <Link href="/sign-in">
                  <Button>
                    Login to get Started!
                    <LogIn className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setLoading(false);
        }}
        onUpgrade={handleSubscription}
        // isLoading={loading}
      />
    </div>
  );
}

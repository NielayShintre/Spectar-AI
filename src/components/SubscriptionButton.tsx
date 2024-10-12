"use client";
import React from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";

type Props = { isPremium: boolean };
 
const SubscriptionButton = ({ isPremium }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/razorpay");
      const subscriptionId = response.data.subscriptionId;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        subscription_id: subscriptionId,
        name: "LegalDoc AI",
        description: "Premium Plan Subscription",
        handler: function (response: any) {
          router.refresh();
        },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} onClick={handleSubscription}>
      {isPremium ? "Manage Subscription" : "Get Premium"}
    </Button>
  );
};

export default SubscriptionButton;

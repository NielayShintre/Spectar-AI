import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay"; // Ensure this is correctly set up in your lib
import fs from "fs";
import path from "path";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";

const ordersFilePath = path.resolve(process.cwd(), "orders.json");

const readData = (): any[] => {
  if (fs.existsSync(ordersFilePath)) {
    const data = fs.readFileSync(ordersFilePath, "utf-8");
    return JSON.parse(data);
  }
  return [];
};

const writeData = (data: any[]) => {
  fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2));
};

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await req.json();
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  try {
    const isValidSignature = validateWebhookSignature(
      body,
      razorpay_signature,
      secret
    );
    if (isValidSignature) {
      const orders = readData();
      const order = orders.find((o) => o.order_id === razorpay_order_id);
      if (order) {
        order.status = "paid";
        order.payment_id = razorpay_payment_id;
        writeData(orders);
      }
      console.log("Payment verification successful");
      return NextResponse.json({ status: "ok" });
    } else {
      console.log("Payment verification failed");
      return NextResponse.json(
        { status: "verification_failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", message: "Error verifying payment" },
      { status: 500 }
    );
  }
}

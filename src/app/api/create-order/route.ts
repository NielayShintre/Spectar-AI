import { NextResponse } from 'next/server';
import { razorpay } from "@/lib/razorpay";
import fs from "fs";
import path from "path";

const ordersFilePath = path.join('/tmp', 'orders.json');

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
  try {
    const { amount, currency, receipt, notes } = await req.json();

    const options = {
      amount: amount * 100,
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    const orders = readData();
    orders.push({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: "created",
    });
    writeData(orders);

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating order" },
      { status: 500 }
    );
  }
}

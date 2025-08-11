import axios from "axios";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";

dotenv.config();
export const createCashfreeOrder = async (amount, userId) => {
  try {
    const orderId = uuidv4();
    const customerId = userId;
    const orderAmount = amount;

    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_email: "user@example.com",
        customer_phone: "9999999999"
      },
    };

    const response = await axios.post("https://sandbox.cashfree.com/pg/orders", payload, {
      headers: {
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json"
      },
    });

    if (response.data.order_id) {
      return response.data;
    }

    throw new Error("Error creating order");
  } catch (err) {
    console.error("Error creating Cashfree order:", err.message);
    throw err;
  }
};

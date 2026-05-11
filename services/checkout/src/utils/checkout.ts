// @ts-ignore — intasend-node may not have types
import IntaSend from "intasend-node";

const INTASEND_API_TOKEN = process.env.INTASEND_API_TOKEN || "";
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY || "";
const INTASEND_TEST_MODE = process.env.INTASEND_TEST_MODE !== "false";

const intasend = new IntaSend(INTASEND_API_TOKEN, INTASEND_PUBLISHABLE_KEY, INTASEND_TEST_MODE);

export default async function checkout(data: {
  first_name: string;
  last_name: string;
  email: string;
  host: string;
  amount: number;
  phone_number: string | number;
  api_ref: string;
}) {
  await intasend.collection().mpesaStkPush({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    host: data.host,
    amount: data.amount,
    phone_number: data.phone_number,
    api_ref: data.api_ref,
  });
  console.log(`✅  STK push sent for ${data.api_ref}`);
}

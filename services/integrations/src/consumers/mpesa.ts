// @ts-ignore — intasend-node has no types
import IntaSend from "intasend-node";
import { env } from "../config/env";

const intasend = new IntaSend(
  env.INTASEND_API_TOKEN,
  env.INTASEND_PUBLISHABLE_KEY,
  env.INTASEND_TEST_MODE
);

export async function handleMpesa(data: {
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

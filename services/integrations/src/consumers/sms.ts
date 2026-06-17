import axios from "axios";
import { env } from "../config/env";

export async function handleSms(data: { phoneNumbers: string; message: string }) {
  const payload = {
    data: [
      {
        message_bag: {
          numbers: data.phoneNumbers,
          message: data.message,
          sender: "UjumbeSMS",
        },
      },
    ],
  };

  await axios.post(`${env.UJUMBESMS_API_URL}/api/messaging`, payload, {
    headers: {
      email: env.UJUMBESMS_ACCOUNT_EMAIL,
      "X-Authorization": env.UJUMBESMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  console.log(`✅  SMS sent to ${data.phoneNumbers}`);
}

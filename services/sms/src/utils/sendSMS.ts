import axios from "axios";

const UJUMBESMS_API_URL = process.env.UJUMBESMS_API_URL || "https://ujumbesms.co.ke";
const UJUMBESMS_API_KEY = process.env.UJUMBESMS_API_KEY || "";
const UJUMBESMS_ACCOUNT_EMAIL = process.env.UJUMBESMS_ACCOUNT_EMAIL || "";

export async function sendSMS(data: { phoneNumbers: string; message: string }) {
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

  await axios.post(`${UJUMBESMS_API_URL}/api/messaging`, payload, {
    headers: {
      email: UJUMBESMS_ACCOUNT_EMAIL,
      "X-Authorization": UJUMBESMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  console.log(`✅  SMS sent to ${data.phoneNumbers}`);
}

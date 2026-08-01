import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 8010,
  // IntaSend (M-Pesa)
  INTASEND_API_TOKEN: process.env.INTASEND_API_TOKEN || "",
  INTASEND_PUBLISHABLE_KEY: process.env.INTASEND_PUBLISHABLE_KEY || "",
  INTASEND_TEST_MODE: process.env.INTASEND_TEST_MODE !== "false",
  // UjumbeSMS
  UJUMBESMS_API_URL: process.env.UJUMBESMS_API_URL || "https://ujumbesms.co.ke",
  UJUMBESMS_API_KEY: process.env.UJUMBESMS_API_KEY || "",
  UJUMBESMS_ACCOUNT_EMAIL: process.env.UJUMBESMS_ACCOUNT_EMAIL || "",
  // Resend SMTP
  EMAIL_SENDER: process.env.EMAIL_SENDER || "",
  EMAIL_RECIPIENT: process.env.EMAIL_RECIPIENT || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
};

const axios = require("axios");

const {
  UJUMBESMS_API_KEY,
  UJUMBESMS_ACCOUNT_EMAIL,
  UJUMBESMS_API_URL,
} = require("../config");

/**
 * **sendSMS** - sms notifier function
 *
 * Example of **data** Object
 * ```json
 * {
 *  "phoneNumbers": "01110203456",
 *  "message": "sms message"
 * }
 * ```
 *
 * @param {Object} data Object
 * @param {string} data.phoneNumbers String of phone numbers delimited by comma.
 * @param {string} data.message Message to send
 */
async function sendSMS(data) {
  // BulkSMS API: /api/messaging

  // Params
  // Sample request JSON data- UjumbeSMS
  // data: [
  //   {
  //     message_bag: {
  //       numbers: "0723660400,0712090304",
  //       message: "Messagefromthefirstbag",
  //       sender: "DEPTHSMS",
  //     },
  //   },
  // ];

  const response = await axios.post(
    `${UJUMBESMS_API_URL}/api/messaging`,
    {
      data: [
        {
          message_bag: {
            numbers: data.phoneNumbers,
            message: data.message,
            sender: "UjumbeSMS",
          },
        },
      ],
    },
    {
      headers: {
        email: UJUMBESMS_ACCOUNT_EMAIL,
        "X-Authorization": UJUMBESMS_API_KEY,
      },
    }
  );

  console.log(response.data);
  // console.log({ response: response.data[0] });
}

module.exports = { sendSMS };

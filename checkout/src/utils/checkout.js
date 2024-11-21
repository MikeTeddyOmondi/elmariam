// import axios from "axios";
import { config } from "dotenv";
// import { QueueMsg } from "../types";
// const IntaSend = require("intasend-node");
import IntaSend from "intasend-node";

config();

const { INTASEND_API_TOKEN, INTASEND_PUBLISHABLE_KEY, INTASEND_TEST_MODE } =
  process.env;

let intasend = new IntaSend(
  INTASEND_PUBLISHABLE_KEY,
  INTASEND_API_TOKEN,
  Boolean(INTASEND_TEST_MODE) // set to false when going live
);

// Typescript
// let intasend = new IntaSend(
//   (publishable_key = INTASEND_PUBLISHABLE_KEY),
//   (token = INTASEND_API_TOKEN),
//   (test_mode = true) // set to false when going live
// );

let collection = intasend.collection();
// console.log(collection);

// Trigger STK Push
async function checkout(data) {
  // console.log({ data });

  // Parse the string data into an JSON object
  const dataParsed = JSON.parse(data);
  // console.log({ dataParsed });

  // Example of Body (Data Expected):
  // {
  //   "first_name": "Joe",
  //   "last_name": "Doe",
  //   "email": "joe@doe.com",
  //   "host": "https://yourwebsite.com",
  //   "amount": 10,
  //   "phone_number": "254717135176",
  //   "api_ref": "test",
  // }

  collection
    .mpesaStkPush({ ...dataParsed })
    .then((resp) => {
      console.log(`Resp: ${JSON.stringify(resp)}`);
    })
    .catch((err) => {
      console.error(`[!] Intasend Error: ${err}`);
    });
}

export default checkout;

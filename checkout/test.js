const IntaSend = require("intasend-node");

let intasend = new IntaSend(
  (publishable_key = "ISPubKey_test_66f7b755-66c5-459f-96cd-0b5ebee58b30"),
  (token = "ISSecretKey_test_3a05f838-7ef6-4ef2-aae2-c15a2c704fa8"),
  (test_mode = true) // set to false when going live
);

let collection = intasend.collection();

collection
  .mpesaStkPush({
    first_name: "Joe",
    last_name: "Doe",
    email: "joe@doe.com",
    host: "https://yourwebsite.com",
    amount: 10,
    phone_number: "254717135176",
    api_ref: "test",
  })
  .then((resp) => {
    // Redirect user to URL to complete payment
    console.log(`STK Push Resp:`, resp);
  })
  .catch((err) => {
    console.error(`STK Push Resp error:`, err.toString());
    console.log(typeof err);
  });

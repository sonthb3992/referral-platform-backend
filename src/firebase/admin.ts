import * as admin from "firebase-admin";

const serviceAccount = require("./caffino-referral-platform-firebase-adminsdk-jtdrz-bf68f436c4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;

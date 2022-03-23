
var admin = require("firebase-admin");

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aucx-8f0c7-default-rtdb.firebaseio.com"
});

const database = admin.database();
module.exports = {
  db:database,
  admin:admin
};

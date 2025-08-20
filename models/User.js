const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    paytmNumber: String,
    paymentAmount: Number,
    paymentTime: Date
});

module.exports = mongoose.model("User", UserSchema);

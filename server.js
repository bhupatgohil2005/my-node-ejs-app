const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const User = require("./models/User");

require("dotenv").config();


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "demo_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,   // use your Railway Mongo connection string
      collectionName: "sessions",
    }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);


// Connect MongoDB
mongoose.connect("mongodb://mongo:krgHKrjDXdTfnFSjUnHweiFtvoMAqwKd@switchyard.proxy.rlwy.net:34291")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Routes ---
app.get("/", (req, res) => res.redirect("/login"));

// Login Page
app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {

    let { username, password } = req.body;
    let user = await User.findOne({ username });

    if (!user) {
        // new user → save → go to paytm
    
        user = new User({ username, password });
        await user.save();
        req.session.userId = user._id;
        return res.redirect("/paytm");  
    } else {
        // existing user → check if payment already exists
        
        req.session.userId = user._id;
        if (user.paymentAmount || user.paymentTime) {
            
            return res.redirect("/payment");  
        } else {
           
            return res.redirect("/paytm");    
        }
    }
});


app.post("/payment", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    let user = await User.findById(req.session.userId);
    res.render("payment", { amount: user.paymentAmount, time: user.paymentTime });
});


// Paytm Page
app.get("/paytm", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    res.render("paytm");
});

app.post("/paytm", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    let user = await User.findById(req.session.userId);

    if (!user.paymentAmount) {
        const randomAmount = Math.floor(Math.random() * (500+ 1));
        user.paytmNumber = req.body.paytmNumber;
        user.paymentAmount = randomAmount;
        user.paymentTime = new Date();
        await user.save();
    }
    res.redirect("/payment");
});

// Payment Page
app.get("/payment", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    let user = await User.findById(req.session.userId);
    res.render("payment", { amount: user.paymentAmount, time: user.paymentTime });
});


const PORT = process.env.PORT || 3000;
// Server start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


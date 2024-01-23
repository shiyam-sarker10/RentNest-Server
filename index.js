const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()

// RentNest
// M4MQFDSAzWdVPFhr

// middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  
}));
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obcasl9.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    
    await client.connect();
    const userCollection = client.db("RentNest").collection("users");
    await userCollection.createIndex({ email: 1 }, { unique: true });

    
    // Posting user info when registaring 
    app.post("/register", async (req, res) => {
      const { name,email,number,role, password } = req.body;



      try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await userCollection.insertOne({ name, email, number, role, password: hashedPassword });

        res.send(result);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error (email is not unique)
          res.status(400).json({ success: false, message: "Email is already registered" });
        } else {
          // Other errors
          console.error('Error registering user:', error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
      }
    });

    // Check userInfo when login 
    app.get("/registeredUsers", async (req, res) => {
      const { email, password } = req.query;
      console.log({ email, password });

      try {
        const query = { email: email };
        const result = await userCollection.findOne(query);

        if (!result) {
          return res.send({error:"notFound" });
        }

        const hashedPassword = result.password;

        // Using bcrypt.compare with async/await
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (passwordMatch) {
          console.log('Password is correct');
          res.send(result);
        } else {
          console.log('Password is incorrect');
          res.status(401).json({ success: false, message: "Password is incorrect" });
        }
      } catch (error) {
        if (error.code === 11000) {
          res.status(400).json({ success: false, message: "Email is already registered" });
        } else {
          console.error('Error checking user password:', error);
          res.status(500).json({ success: false, message: "Internal server error" });
        }
      }
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("The project is running");
});

app.listen(port, () => {
    console.log(`this is running ${port}`);
});
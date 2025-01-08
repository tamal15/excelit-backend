const express= require("express")
const { MongoClient, ServerApiVersion } = require('mongodb');
const { v4: uuidv4 } = require("uuid");
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app=express();
const port = process.env.PORT || 5000;
// app.use(express.json({ limit: '50mb' }));
const server = http.createServer(app);
const io = new Server(server);
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.json())


  // const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q45my.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqcn4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {

  try{
      await client.connect();
      console.log("connected to database");
      const database = client.db('Overseas');
      const homeProjectCollection = database.collection('HomeProject');     
      const userCollection = database.collection('users');
      const cashcategoryCollection = database.collection('cashcategory');
      const chatsCollection = database.collection('chats');
      

    // Fetch chat history
 // Fetch chat history

  app.get("/api/chats", async (req, res) => {
  const { productId, userEmail } = req.query;

  try {
    const messages = await chatsCollection
      .find({
        productId,
        $or: [
          { senderEmail: userEmail },
          { receiverEmail: userEmail },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});



// Save a message
app.post("/api/chats", async (req, res) => {
  const { productId, senderEmail, receiverEmail, message,productimage,productmodel } = req.body;

  if (!productId || !senderEmail || !receiverEmail || !message) {
    return res.status(400).json({ error: "Incomplete message data." });
  }

  try {
    const chat = {
      productId,
      senderEmail,
      receiverEmail,
      message,
      timestamp: new Date(),
      productimage,
      productmodel
    };

    // Save the chat message to the database
    const result = await chatsCollection.insertOne(chat);

    // Return the saved message with its ID
    res.status(201).json({ ...chat, _id: result.insertedId });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Failed to save chat message." });
  }
});





// Socket.IO for real-time messaging
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("sendMessage", async (chat) => {
    const { productId, senderEmail, receiverEmail, message } = chat;

    try {
      if (!productId || !senderEmail || !receiverEmail || !message) {
        throw new Error("Incomplete message data.");
      }

      const newChat = {
        productId,
        senderEmail,
        receiverEmail,
        message,
        timestamp: new Date(),
      };

      // Save the chat message to the database
      const result = await chatsCollection.insertOne(newChat);

      const savedMessage = { ...newChat, _id: result.insertedId };

      // Emit the message to both participants
      io.to(senderEmail).emit("receiveMessage", savedMessage);
      io.to(receiverEmail).emit("receiveMessage", savedMessage);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });
});








      app.post("/api/form-submit", async (req, res) => {
        console.log(req.body)
        try {
          
          const result = await cashcategoryCollection.insertOne(req.body);
          res.status(200).json({ message: "Data submitted successfully!", result });
        } catch (error) {
          console.error("Error saving data:", error);
          res.status(500).json({ message: "Failed to submit data" });
        } 
      });

      app.get("/getcategoryparts", async (req, res) => {
        const result = await cashcategoryCollection.find({}).toArray();
        res.json(result);
      });

 // add database user collection 
 app.post('/users', async(req,res)=>{
  const user=req.body;
  console.log(user)
  const result=await userCollection.insertOne(user);
  // console.log(body)
  res.json(result);
 
})
 app.post('/postdatarecruitment', async(req,res)=>{
  const user=req.body;
  console.log(req.body)
  const result=await postrecruitmentCollection.insertOne(user);
  res.json(result);
 
})



 





  // database searching check admin 
  app.get('/userLogin/:email', async(req,res)=>{
    const email=req.params.email;
    const query={email:email}
    const user=await userCollection.findOne(query)
    let isAdmin=false;
    if(user?.role==='admin'){
      isAdmin=true;
    }
    res.json({admin:isAdmin})
});


// post pproject home 
app.post('/postproject', async (req, res) => {
  try {
    const { title, description, image } = req.body;

    // Insert the data into the MongoDB collection
    const result = await homeProjectCollection.insertOne({
      title,
      description,
      image,
      createdAt: new Date(),
    });

    // Check if insert was successful and return the inserted data
    if (result.acknowledged) {
      res.status(201).json({
        message: 'Banner added successfully',
        data: {
          _id: result.insertedId,
          title,
          description,
          image,
          createdAt: new Date(),
        },
      });
    } else {
      res.status(500).json({ message: 'Error adding banner' });
    }
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ message: 'Error adding banner' });
  }
});

app.get('/users/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  // console.log(query)
  const user = await userCollection.findOne(query);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

















      
      app.get("/getcareerwork", async (req, res) => {
        const result = await CareerworkCollection.find({}).toArray();
        res.json(result);
      });
      app.get("/getcareerglobal", async (req, res) => {
        const result = await CareerglobalCollection.find({}).toArray();
        res.json(result);
      });
     
      


      app.get("/getcitydetails/:countryId/:cityName", async (req, res) => {
        const { countryId, cityName } = req.params;
      
        try {
          // Ensure countryId is treated as an ObjectId
          const country = await contactpartaddressCollection.findOne({ _id: new ObjectId(countryId) });
      
          if (!country) {
            return res.status(404).send("Country not found");
          }
      
          // Find city with case-insensitive match for cityName
          const city = country.cities.find(
            (c) => c.name.toLowerCase() === cityName.toLowerCase()
          );
      
          if (!city) {
            return res.status(404).send("City not found");
          }
      
          // Include country flag in the response
          res.json({
            ...city,
            countryFlag: country.flag, // Add the flag of the country to the response
            country: country.country // Include the country name
          });
        } catch (error) {
          console.error("Error fetching city details:", error);
          res.status(500).send("Internal server error");
        }
      });
      
      


      

    // update data
    app.put("/bannerupdate/:id", async (req, res) => {
      
      const { id } = req.params;
      const { heading, description, media } = req.body;
  
      const updateResult = await homebannerCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { heading, description, media } }
      );
   res.json(updateResult);
  }); 

  


  
  

  app.delete("/awardsclientsdelete/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await awardclientsCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Award not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting award", error });
    }
  });
  

  }

  finally{
      // await client.close();
  }
}

run().catch(console.dir)

   app.get('/', (req,res)=>{
    res.send("online shopping");
   });
  
 app.listen(port, ()=>{
    console.log("runnning online on port", port);
  }); 

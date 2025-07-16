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
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.json())

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
  // const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q45my.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqcn4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = "mongodb+srv://facepart:t0d9hHm80glokYIP@cluster0.4awdg7q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
      const database = client.db('faceArt');
      const homeProjectCollection = database.collection('HomeProject');     
      const userCollection = database.collection('users');
      const parcelbookCollection = database.collection('parcelboking');
      

   




     

     

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






// parcel booking 
app.post("/api/bookings", async (req, res) => {
      const booking = req.body;
      console.log(" Received booking:", booking);

      if (
        !booking.pickupAddress ||
        !booking.deliveryAddress ||
        !booking.parcelType ||
        !booking.paymentMode ||
        !booking.createdAt 
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await parcelbookCollection.insertOne(booking);
      res.status(201).json({ message: "Booking created", id: result.insertedId });
    });


    app.get("/api/bookings", async (req, res) => {
  const bookings = await parcelbookCollection
    .find()
    .sort({ _id: -1 })
    .toArray();

  res.json(bookings);
});

app.get("/api/deliveryagents", async (req, res) => {
  const agents = await userCollection
    .find({ role: "delivery" })
    .toArray();
  res.json(agents);
});


 app.post("/api/parcelbooking/:id/assign", async (req, res) => {
  const parcelId = req.params.id;
  const { deliveryAgentId } = req.body;

  if (!deliveryAgentId) {
    return res.status(400).json({ message: "deliveryAgentId is required" });
  }

  const agent = await userCollection
    .findOne({ _id: new ObjectId(deliveryAgentId) });

  if (!agent) {
    return res.status(404).json({ message: "Delivery agent not found" });
  }

  const result = await parcelbookCollection
    .updateOne(
      { _id: new ObjectId(parcelId) },
      {
        $set: {
          deliveryAgentId: agent._id,
          deliveryAgentName: agent.displayName,
        },
      }
    );

  res.json({ message: "Agent assigned", modifiedCount: result.modifiedCount });
});


app.get("/api/parcelbooking/agent/:name", async (req, res) => {
      const agentName = req.params.name;

      const parcels = await parcelbookCollection
        .find({ deliveryAgentName: agentName })
        .sort({ _id: -1 })
        .toArray();

      res.json(parcels);
    });


  app.get("/api/parcels/customer/:customer", async (req, res) => {
  console.log("Customer param:", req.params.customer);
  const parcels = await parcelbookCollection
    .find({ customer: req.params.customer })
    .toArray();
  console.log("Found parcels:", parcels);
  res.json(parcels);
});

app.get("/api/parcels", async (req, res) => {
    const customerName = req.query.customerName;
    const result = await parcelbookCollection.find({ customer: customerName }).toArray();
    res.json(result);
  });

  // Socket.IO: driver sends live location
  io.on("connection", (socket) => {
    console.log("Driver or customer connected");

    socket.on("driverLocation", ({ parcelId, lat, lng }) => {
      // broadcast to all customers tracking this parcel
      io.emit(`parcel-${parcelId}`, { lat, lng });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });



app.post("/api/parcelbooking/:id/status", async (req, res) => {
  const parcelId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  const result = await parcelbookCollection
    .updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { status } }
    );

  res.json({ message: "Status updated", modifiedCount: result.modifiedCount });
});


  
app.get("/api/admin/dashboard-metrics", async (req, res) => {

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const dateRegex = new RegExp(`^${todayStr}`);

  // Total counts
  const totalBookingsCount = await parcelbookCollection.countDocuments({});
  const totalFailedCount = await parcelbookCollection.countDocuments({ status: "Failed" });
  const totalCODCount = await parcelbookCollection.countDocuments({
    paymentMode: { $regex: /^cod$/i }
  });

  // Today counts
  const todayBookingsCount = await parcelbookCollection.countDocuments({
    createdAt: { $regex: dateRegex }
  });

  const todayFailedCount = await parcelbookCollection.countDocuments({
    status: "Failed",
    createdAt: { $regex: dateRegex }
  });

  const todayCODCount = await parcelbookCollection.countDocuments({
    paymentMode: { $regex: /^cod$/i },
    createdAt: { $regex: dateRegex }
  });

  res.json({
    totalBookingsCount,
    totalFailedCount,
    totalCODCount,
    todayBookingsCount,
    todayFailedCount,
    todayCODCount,
  });
});


app.get("/api/admin/all-parcels", async (req, res) => {

  const parcels = await parcelbookCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  res.json(parcels);
});


app.get("/api/admin/bookings-by-date", async (req, res) => {

  const result = await parcelbookCollection.aggregate([
    {
      $addFields: {
        dateOnly: {
          $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } }
        }
      }
    },
    {
      $group: {
        _id: "$dateOnly",
        totalBookings: { $sum: 1 },
        failedDeliveries: {
          $sum: {
            $cond: [{ $eq: ["$status", "Failed"] }, 1, 0]
          }
        },
        codParcels: {
          $sum: {
            $cond: [
              { $regexMatch: { input: "$paymentMode", regex: /^cod$/i } },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { _id: -1 } // newest date first
    }
  ]).toArray();

  res.json(result);
});



app.get("/api/admin/parcels-by-date", async (req, res) => {
  
  const { date, filter } = req.query; // date = 'YYYY-MM-DD', filter = 'total' | 'failed' | 'cod'

  if (!date) {
    return res.status(400).json({ error: "Missing date query parameter" });
  }

  const query = {
    createdAt: { $regex: `^${date}` },
  };

  if (filter === "failed") {
    query.status = "Failed";
  } else if (filter === "cod") {
    query.paymentMode = { $regex: /^cod$/i };
  }
  // if filter is 'total' or not provided, no extra filters

  const parcels = await parcelbookCollection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  res.json(parcels);
});


// View all users
app.get("/api/admin/users", async (req, res) => {
  const users = await userCollection.find({}).sort({ displayName: 1 }).toArray();
  res.json(users);
});

// View all bookings
app.get("/api/admin/bookings", async (req, res) => {
  const bookings = await parcelbookCollection.find({}).sort({ createdAt: -1 }).toArray();
  res.json(bookings);
});

app.get('/userRole/:email', async (req, res) => {
  const email = req.params.email;
  console.log(email)

  try {
    const user = await userCollection.findOne({ email });
    console.log(user)
    if (user && user.role) {
      res.send({ role: user.role });
    } else {
      res.status(404).send({ message: 'Role not found for this email' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

 app.get('/userLogins/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });

      if (user) {
        res.send({
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          admin: user.role === 'admin',
        });
      } else {
        res.status(404).send({ message: 'User not found' });
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
    res.send("courier service");
   });
  
 app.listen(port, ()=>{
    console.log("runnning online on port", port);
  }); 

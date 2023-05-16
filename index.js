const express=require('express')
const cors =require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express()
const port=process.env.PORT || 5000

// Middleware 
app.use(cors())
app.use(express.json())

// CarService 
// c7ChK4LZQ1C9bIdk 


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.8eid0qf.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection=client.db('carDB').collection('service')
    const bookingCollection=client.db('carDB').collection('booking')

    // JWT start

    const verifyJWT =(req,res,next)=>{
      console.log(req.headers.authorization);
      const authorization=req.headers.authorization
      if(!authorization){
        return res.status(401).send({error:true, message:'unauthorized access'})
      }
      const token=authorization.split(' ')[1]
      console.log(token);
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
        if(error){
          return res.status(403).send({error:true, message:'unauthorized access'})
        }
        req.decoded=decoded
        next()
      })
    }

    app.post('/jwt',(req,res)=>{
      const user=req.body
      console.log(user);
      const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token})

    })
    // JWT end 



    app.post('/booking', async(req,res)=>{
      const addService=req.body
      console.log(addService);
      const result= await bookingCollection.insertOne(addService)
      res.send(result)
    })

    app.get('/booking',verifyJWT, async(req,res)=>{
      const decoded=req.decoded
      if(decoded.email!==req.query.email){
        return res.status(403).send({error:1, message:'forbidden'})
      }
      let query={}
      if(req.query?.email){
        query={email:req.query.email}
      }
      const cursor=bookingCollection.find(query)
      const result= await cursor.toArray()
      res.send(result)

    })

    app.get('/services', async(req,res)=>{
      const cursor=serviceCollection.find()
      const result= await cursor.toArray()
      res.send(result)

    })

    app.delete('/booking/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result= await bookingCollection.deleteOne(query);
      res.send(result)
    })

    // for update to get single data

    app.get('/checkout/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result= await serviceCollection.findOne(query, options);
      res.send(result)
    })

    app.patch('/booking/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      // const options={upsert:true}
      const booking=req.body
      const updatedBooking={
        $set:{
         status:booking.status
        }
      }
      const result= await bookingCollection.updateOne(query,updatedBooking)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res)=>{
    res.send('Car servicing')
})

app.listen(port, ()=>{
    console.log(`Car is running port ${port}`);
})
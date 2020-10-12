const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require ('mongodb').ObjectId;
require('dotenv').config();


const port = 5000


var serviceAccount = require("./configs/volunteer-work-assignment-firebase-adminsdk-osetl-f267829786.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const app = express();

app.use(cors());
app.use(bodyParser.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qxxep.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology:true });
 client.connect(err => {
  const eventCollection = client.db("volunteerWork").collection("events");
  

  app.post('/addEvent',(req,res)=>{
      const newEvent = req.body;
      eventCollection.insertOne(newEvent)
      .then(result => {
          res.send('added successfully');
      })
  })

  app.delete('/delete/:id', (req, res) =>{
      eventCollection.deleteOne({_id: ObjectId(req.params.id)})
      .then(result => {
        res.send(result.deletedCount > 0);
      })
})

  app.get('/events', (req,res) => {
      const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          admin.auth().verifyIdToken(idToken)
            .then(function(decodedToken) {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            if (tokenEmail == queryEmail) {
                eventCollection.find({email : queryEmail})
                .toArray((err,documents) => {
                    res.send(documents);
                })
            }
            })
            .catch(function(error) {
                res.send('Un-authorized access')
            });
      }
     else{
         res.send('Un-authorized access')
     }
  })

});
 

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)
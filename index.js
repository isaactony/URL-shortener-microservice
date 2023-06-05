require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');
const mySecret = process.env.DB_URL;

const client = new MongoClient(mySecret, { useUnifiedTopology: true });
const db = client.db("urlmicroservice");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body);
  const url = req.body.url;
  const { hostname } = urlparser.parse(url);

  // Check if the URL is valid
  if (!hostname) {
    res.json({ error: "Invalid URL" });
    return;
  }
  
  dns.lookup(hostname, async (err) => {
    if (err) {
      res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount
      };

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({ error: "Invalid URL" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

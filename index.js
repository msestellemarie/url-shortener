var path = require('path');
var express = require('express');
var mongo = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/';
var app = express();

createCounter();

app.listen(process.env.PORT || 5000);

app.use(express.static(path.join(__dirname, "public")));

app.get('/:id*', function(req, res){
  var original = req.params.id + req.params[0];
  checkURL(original, function(err, data){
    if(data.length !== 0){
      res.redirect(data[0].original);
    }
    //strengthen & only add new if doesn't exist
    else if(original.match('http') !== null){
      shortenURL(original, function(err, data){
        if(err){return err;}
        res.send(data);
      });
    }
    else {
      res.send(
        {
          error: "Invalid URL"
        }
      )
    }
  });
});

function shortenURL(original, callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    getID(function(err, data){
      client.db('shortener').collection('urls').insert({
        original: original,
        shortened: "http://localhost:5000/" + (data + 1)
      }, function(err, data){
        callback(err, {original: data.ops[0].original, shortened: data.ops[0].shortened});
        client.end;
      })
    })
  })
}

function createCounter(){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db('shortener').collection('counter').insert({
      _id: 'userid',
      seq: 0
    })
  })
}

function getID(callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db('shortener').collection('counter').findAndModify(
        {_id: 'userid'},
        [],
        {$inc: {seq: 1}}
      , function(err, data){
      callback(err, data.value.seq);
      }
    )
  })
}

function checkURL(shortened, callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db('shortener').collection('urls').find({
      shortened: "http://localhost:5000/" + shortened
    }).toArray(function(err, data){
      callback(err, data);
    })
  })
}

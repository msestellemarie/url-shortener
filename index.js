var path = require('path');
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var url =  process.env.MONGODB_URI || 'mongodb://localhost:27017/shortener';
var database = process.env.MONGODB_URI.split(/(mongodb:\/\/[\w\W]*\/)/).filter(Boolean)[1] || 'shortener';
var host = process.env.HOST_NAME || 'http://192.168.1.7:5000/';

createCounter();

app.listen(process.env.PORT || 5000);

app.use(express.static(path.join(__dirname, "public")));

app.get('/:id*', function(req, res){
  var original = req.params.id + req.params[0];
  checkURL(original, function(err, data){
    if(data.length !== 0){
      res.redirect(data[0].original);
    }
    else if(original.match(/^https?:\/\/www.[a-zA-Z]+.[a-zA-Z]+/) !== null){
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
    checkOriginalURL(original, function(err, data){
      if(data.length !== 0){
        callback(err, {original: original, shortened: data[0].shortened});
      }
      else {
        getID(function(err, data){
          client.db(database).collection('urls').insert({
            original: original,
            shortened: host + (data + 1)
          }, function(err, data){
            callback(err, {original: data.ops[0].original, shortened: data.ops[0].shortened});
            client.end;
          })
        })
      }
    })
  })
}

function createCounter(){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db(database).collection('counter').insert({
      _id: 'userid',
      seq: 0
    })
  })
}

function getID(callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db(database).collection('counter').findAndModify(
        {_id: 'userid'},
        [],
        {$inc: {seq: 1}}
      , function(err, data){
      callback(err, data.value.seq);
      }
    )
  })
}

function checkURL(find, callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db(database).collection('urls').find({
      shortened: host + find
    }).toArray(function(err, data){
      callback(err, data);
    })
  })
}

function checkOriginalURL(find, callback){
  mongo.connect(url, function(err, client){
    if(err){return err;}
    client.db(database).collection('urls').find({
      original: find
    }).toArray(function(err, data){
      callback(err, data);
    })
  })
}

const express = require('express');
const router = express.Router();
const Document = require('../models/document');
const Address = require('../models/address');
const Tag = require('../models/tags');
const Trade = require('../models/trade');
const base64Img = require('base64-img');
const fs = require('fs');

/* GET home page. */
router.get('/tags', function(req, res) {
  Tag.find({}, function(err, docs) {
    res.json(docs);
  });
});

router.post('/tags', function(req, res) {
  const tags = req.body.tags;
  let count = 0;
  tags.forEach(function(tag) {
    let new_tag = new Tag();
    new_tag.name = tag.name;
    new_tag.save(function(err, done) {
      if (done) {
        count++
        if(count === tags.length) {
          res.sendStatus(200);
        }
      }
    });
  });
});

router.post('/', function(req, res, next) {
  let doc = new Document();
  doc.address = req.body.address;
  doc.dateCreated = new Date();
  let tags = [];
  req.body.tags.forEach(function(tag) {
    tags.push(tag.name);
  });
  doc.tags = tags;
  const image = req.body.data;
  let filename = req.body.fileName;
  if (!filename) {
    filename = generateFilename();
  } else {
    filename = filename.slice(0, filename.indexOf('.'));
    filename = filename + '.jpg';
  }
  doc.fileLocation = 'public/files/' + filename;
  filename = filename.slice(0, filename.indexOf('.'));
  base64Img.img('data:image/jpeg;base64,' + image, 'public/files', filename, function(err, filepath) {
    doc.save((err, done) => {
      if(done) {
        res.json(doc.tags);
      }
    });
  });
});

router.get('/address', function(req, res) {
  Address.find({}, function(err, docs) {
    res.json(docs);
  });
});

router.delete('/trade', function(req, res) {
  const phone_number = req.body.phone_number;
  const address = req.body.address;

  Trade.findOne({phone_number: phone_number}, function(err, trade) {
    if (trade) {
      let sites = [];
      trade.sites.forEach(function(site) {
        if (site.address !== address) {
          sites.push(site);
        }
      });
      Trade.findOneAndUpdate({phone_number: phone_number}, {'$set': {sites: sites}}, function(err, updated) {
        if(updated) {
          res.sendStatus(200);
        }
        else {
          res.sendStatus(400);
        }
      })
    } else {
      res.sendStatus(400);
    }
  });
});

router.post('/trade', function(req, res) {
  const phone_number = req.body.phone_number;
  const address = req.body.address;
  const cost = req.body.cost;
  Trade.findOne({phone_number: phone_number}, function(err, result) {
    let sites = result.sites;
    sites.push({address: address, cost: cost})
    Trade.findOneAndUpdate({phone_number: phone_number}, {'$set': {sites: sites}}, function(err, done) {
      if (done) {
        res.sendStatus(200);
      } else {
        res.sendStatus(400);
      }
    });
  });
});

router.get('/trades', function(req, res) {
  Trade.find({}, function(err, trades) {
    res.json(trades);
  });
});

router.post('/trades', function(req, res) {
  const name = req.body.name;
  const phone_number = req.body.phone_number;
  const category = req.body.category;
  Trade.findOne({phone_number: phone_number}, function(err, result) {
    if (result) {
      res.sendStatus(400);
    } else {
      let new_trade = new Trade();
      new_trade.name = name;
      new_trade.phone_number = phone_number;
      new_trade.category = category.name;
      new_trade.save(function(err, done) {
        if (done) {
          res.send(done);
        }
      });
    }
  }); 
});

router.delete('/trades', function(req,res) {
  const phone_number = req.body.phone_number;
  Trade.findOneAndDelete({phone_number: phone_number}, function(err, result) {
    if (err) {
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

router.patch('/trades', function( req, res) {
  const name = req.body.name;
  const phone_number = req.body.phone_number;
  const category = req.body.category;
  const old_number = req.body.old_number;

  Trade.findOneAndUpdate({phone_number: old_number},
    {
      '$set': {
        name: name, 
        phone_number: phone_number, 
        category: category.name
      }
    }, 
    function(err, update) {
      if(update) {
        res.sendStatus(200);
      }
  });
});

router.get('/trades/:address/', function(req, res) {
  const address = req.params.address;
  Trade.find({address: address}, function(err, trades) {
    res.json(trades);
  });
});

router.get('/:id', function(req, res, next) {
  const address = req.params.id;
  Document.find({address: address}, function(err, doc) {
    res.json(doc);
  });
});

router.post('/address', function(req, res) {
  const address = req.body.address;
  let add = new Address();
  add.address = address;
  add.save(function(err, done) {
    if (done) {
      res.sendStatus(200);
    }
  })
});

function generateFilename() {
  const letters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let filename = '';
  while (filename.length < 10) {
    const letterIndex = Math.floor(Math.random() * 62);
    filename += letters[letterIndex];
  }
  filename += '.jpg';
  return filename;
}

module.exports = router;

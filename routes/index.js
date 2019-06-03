const express = require('express');
const router = express.Router();
const Document = require('../models/document');
const Address = require('../models/address');
const Tag = require('../models/tags');
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
        if(count === tags.length - 1) {
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

const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Address = require('../models/Address');
const base64Img = require('base64-img');
const fs = require('fs');

/* GET home page. */
router.post('/', function(req, res, next) {
  let doc = new Document();
  doc.address = req.body.address;
  doc.dateCreated = new Date();
  doc.tags = [];
  const image = req.body.data;
  let filename = req.body.fileName;
  filename = filename.slice(0, filename.indexOf('.'));
  filename = filename + '.JPG';
  doc.fileLocation = 'public/files/' + filename;
  filename = filename.slice(0, filename.indexOf('.'));
  base64Img.img('data:image/jpeg;base64,' + image, 'public/files', filename, function(err, filepath) {
    doc.save((err, done) => {
      if(done) {
        res.sendStatus(200);
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

module.exports = router;

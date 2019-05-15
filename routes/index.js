const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const base64Img = require('base64-img');
const fs = require('fs');
const multer  = require('multer');
var upload = multer({ dest: 'public/files/' });

/* GET home page. */
router.post('/', upload.single('fileData'), function(req, res, next) {
  let doc = new Document();
  doc.address = req.body.address;
  doc.dateCreated = new Date();
  doc.tags = [];
  doc.fileLocation = req.file.destination + req.file.originalname;
  doc.save((err, done) => {
    if(done) {
      fs.rename(req.file.path, req.file.destination + req.file.originalname, function (err) {
        if (err) throw err;
        console.log('renamed complete');
        res.sendStatus(200);
      });
    }
  });
});

router.get('/:id', function(req, res, next) {
  const address = req.params.id;
  Document.find({address: address}, function(err, doc) {
    res.json(doc);
  });
});

module.exports = router;

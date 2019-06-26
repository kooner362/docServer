const express = require('express');
const router = express.Router();
const Document = require('../models/document');
const User = require('../models/user');
const Address = require('../models/address');
const Tag = require('../models/tags');
const Trade = require('../models/trade');
const base64Img = require('base64-img');
const fs = require('fs');
const bcrypt = require('bcrypt');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
var imaps = require('imap-simple');
const base64 = require('base64topdf');
var file = '';
/* GET home page. */

var config = {
  imap: {
      user: 'kooner362@gmail.com',
      password: '154AcZ21',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000
  }
};

router.get('/read-email', (req, res) => {
  let address_regex = /\d+\s[A-z]+\s{0,1}[A-z]+/i;

  imaps.connect(config).then(function (connection) {
    connection.openBox('INBOX').then(function () {
 
        var searchCriteria = ['UNSEEN'];
        var fetchOptions = {
          bodies: ['HEADER', 'TEXT'],
          markSeen: true
      }; 
        return connection.search(searchCriteria, fetchOptions);
    }).then(function (messages) {
        var attachments = [];
        messages.forEach(function (message) {
          let address = message.parts[1].body.subject[0].match(address_regex) ? message.parts[1].body.subject[0].match(address_regex)[0] : null;
            if(address !== null) {
              attachments.push({data: message.parts[0].body, address: address})
            }
        });
        return Promise.all(attachments);
    }).then(function (attachments) {
      let base64pdfs = [];
      attachments.forEach(attachment => {
        let beg_index = 0;
        let found = false;
        let base_val = '';
        let attachment_arr = attachment.data.split('\r\n');
        while (!found) {
          if (attachment_arr[beg_index] !== 'Content-Transfer-Encoding: base64') {
            beg_index++;
          } else {
            beg_index += 2;
            found = true;
          }
        }

        found = false;
        let end_index = beg_index;
        while (!found) {
          if (attachment_arr[end_index].length !== 76) {
            found = true;
          } else {
            end_index ++;
          }
        }

        for (let i=beg_index; i <= end_index; i++) {
          base_val += attachment_arr[i];
        }
        
        base64pdfs.push(base_val)
        let fname = generateFilename('.pdf');
        insertPDFtoDoc(attachment.address, fname);
        addressChecker(attachment.address, (err, exists) => {
          if (err) {
            createAddress(attachment.address, (err, created) => {

            });
          }
          let decodedBase64 = base64.base64Decode(base_val, `/home/Documents/docServer/public/files/${fname}`);
        });
      })
      res.json(base64pdfs)
    });
});
});

router.get('/tags', (req, res) => {
  Tag.find({}, function(err, docs) {
    res.json(docs);
  });
});

router.post('/register', (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;
  const password1 = req.body.password1;

  if (password === password1) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
          let user = new User();
          user.first_name = first_name;
          user.last_name = last_name;
          user.email = email;
          user.password = hash;
          user.save((err, done) => {
            if (done) {
              res.sendStatus(200);
            } else {
              res.sendStatus(400);
            }
          });
      });
    });
  } else {
    res.sendStatus(400);
  }
});

router.post('/login', (req, res) => {
  const email =  req.body.email;
  const password = req.body.password;
  User.findOne({email: email}, (err, user) => {
    if (user) {
      bcrypt.compare(password, user.password, function(err, resp) {
        if (resp) {
          res.json({user: true, password: true});
        } else {
          res.json({user: true, password: false}); //bad password
        }
      });
    } else {
      res.json({user: false, password: true}); //bad user email
    }
  });
});



router.post('/tags', (req, res) => {
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

router.patch('/', (req, res) => {
  const id =  req.body.id;
  const category = req.body.category;

  Document.findOneAndUpdate({_id: id}, {'$set': {tags: [category]}}, (err, done) => {
    if (done) {
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });
});

router.delete('/', (req, res) => {
  const id = req.body.id;
  Document.findOneAndDelete({_id: id}, (err, done) => {
    if (done) {
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });
});

router.post('/', (req, res, next) => {
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
    filename = generateFilename('.jpg');
  } else {
    filename = filename.slice(0, filename.indexOf('.'));
    filename = filename + '.jpg';
  }
  doc.fileLocation = 'public/files/' + filename;
  filename = filename.slice(0, filename.indexOf('.'));
  base64Img.img('data:image/jpeg;base64,' + image, 'public/temp', filename, function(err, filepath) {
    doc.save((err, done) => {
      if(done) {
        file = filename;
        compressit();
        setTimeout(function() {
          res.json(doc.tags);
        }, 5000);
      }
    });
  });
});

router.get('/address', (req, res) => {
  Address.find({}, function(err, docs) {
    res.json(docs);
  });
});

router.delete('/trade', (req, res) => {
  const phone_number = req.body.phone_number;
  const address = req.body.address;

  Trade.findOne({phone_number: phone_number}, (err, trade) => {
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

router.post('/trade', (req, res) => {
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

router.patch('/trade', (req, res) => {
  const phone_number = req.body.phone_number;
  const address = req.body.address;
  const cost = req.body.cost;
  Trade.findOne({phone_number: phone_number}, function(err, trade) {
    if (trade) {
      let sites = trade.sites;
      sites.forEach((site) => {
        if (site.address === address) {
          site.cost = cost;
        }
      });
      Trade.findOneAndUpdate({phone_number: phone_number}, {'$set': {sites: sites}}, function(err, done) {
        if (done) {
          res.sendStatus(200);
        } else {
          res.sendStatus(400);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });
});

router.get('/trades', (req, res) => {
  Trade.find({}, function(err, trades) {
    res.json(trades);
  });
});

router.post('/trades', (req, res) => {
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

router.delete('/trades', (req,res) => {
  const phone_number = req.body.phone_number;
  Trade.findOneAndDelete({phone_number: phone_number}, function(err, result) {
    if (err) {
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

router.patch('/trades', ( req, res) => {
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

router.get('/trades/:address/', (req, res) => {
  const address = req.params.address;
  Trade.find({address: address}, function(err, trades) {
    res.json(trades);
  });
});

router.get('/:id', (req, res, next) => {
  const address = req.params.id;
  Document.find({address: address}, function(err, doc) {
    res.json(doc);
  });
});

router.post('/address', (req, res) => {
  const address = req.body.address;
  let add = new Address();
  add.address = address;
  add.save(function(err, done) {
    if (done) {
      res.sendStatus(200);
    }
  })
});

function generateFilename(type) {
  const letters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let filename = '';
  while (filename.length < 10) {
    const letterIndex = Math.floor(Math.random() * 62);
    filename += letters[letterIndex];
  }
  filename += type;
  return filename;
}

function compressit () {
  (async () => {
    const files = await imagemin([`public/temp/${file}.{jpg,png}`], 'public/files', {
        plugins: [
            imageminJpegtran(),
            imageminPngquant({quality: '65-80'})
        ]
    }); 
  })();
}

function insertPDFtoDoc(address, filename) {
  let new_doc = new Document();
  new_doc.address = address;
  new_doc.dateCreated = new Date();
  new_doc.tags = [];
  new_doc.fileLocation = `public/files/${filename}`;
  new_doc.save((err, saved) => {
    if (saved) {
      return true;
    } else {
      return false;
    }
  });
}

function addressChecker(address, callback) {
  Address.findOne({address: address}, (err, found) => {
    if (found) {
      return callback(null, true);
    } else {
      return callback(true, null);
    }
  });
}

function createAddress(address, callback) {
  let new_address = new Address();
  new_address.address = address;
  new_address.save((err, done) => {
    if (done) {
      return callback(null, true);
    } else {
      return callback(true, null);
    }
  });
}

module.exports = router;

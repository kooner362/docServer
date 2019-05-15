var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    address: {type: String},
    dateCreated: {type: Date},
    tags: {type: Array},
    fileLocation: {type: String}
});

module.exports = mongoose.model('Document', schema);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    address: {type: String}
});

module.exports = mongoose.model('Address', schema);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    sites: {type: Array}, //Array of objects with address and cost for that site i.e {address: '123 Fake Street', cost: 2500}
    category: {type: String},
    name: {type: String},
    phone_number: {type: String}
});

module.exports = mongoose.model('Trade', schema);
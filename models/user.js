var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    first_name: {type: String},
    last_name: {type: String},
    email: {type: String},
    password: {type: String},
    user_type: {type: String}
});

module.exports = mongoose.model('User', schema);
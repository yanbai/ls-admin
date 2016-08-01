var db = require('./db');
var extend = require('../tools/mixin');

function Question(questionnaireId, title, type, content) {
    this.questionnaireId = questionnaireId;
    this.title = title;
    this.type = type;
    this.content = content;
}


Question.prototype.save = function(callback) {
    var t = this;
        db.collection("question", function(err, collection) {
            if (err) {
                return callback(err)
            }
            collection.insert(t, function(err, docs) {
                //db.close();
                if (err) return callback(err);
                return callback(null);
            })
        })
}

Question.getById = function(_id, callback) {
        db.collection('question', function(err, collection) {
            if (err) {
                // db.close();
                return callback(err);
            }
            collection.find({ 'questionnaireId': _id }).toArray(function(err, doc) {
                // db.close();
                if (err) return callback(err);
                callback(null, doc);
            })
        })
}

Question.findOne = function(_id, callback) {
        db.collection('question', function(err, collection) {
            if (err) {
                // db.close();
                return callback(err);
            }
            collection.findOne({ '_id': require('mongodb').ObjectID(_id) }, function(err, doc) {
                // db.close();
                if (err) return callback(err);
                callback(null, doc);
            })

        })
}

Question.update = function(_id, ob, cb) {
        db.collection('question', function(err, collection) {
            if (err) {
                // db.close();
                return cb(err);
            }
            collection.update({
                '_id': require('mongodb').ObjectID(_id)
            }, { $set: ob }, function(err) {
                // db.close();
                if (err) return cb(err);
                cb(null);
            })
        })
}

Question.deleteById = function(_id, cb) {
        db.collection("question", function(err, collection) {
            if (err) {
                // db.close();
                return cb(err)
            }
            if (typeof _id == "object") {
                // if _id is array, delete many
                _id.forEach(function(it, index) {
                    collection.remove({ "_id": require('mongodb').ObjectID(it) }, function(err) {
                        // db.close();
                        if (err) return cb(err);
                        cb(null);
                    })
                })
            } else {
                // if _id is string, delete one
                collection.remove({ "_id": require('mongodb').ObjectID(_id) }, function(err) {
                    // db.close();
                    if (err) return cb(err);
                    cb(null);
                })
            }
        })
}


module.exports = Question;

// var db = require("./db");

var db = require('./db');
var extend = require('../tools/mixin');

/*
answer:
    [
        {
            quizId:.......,
            quizAnswer:["中餐","西餐"]
        },
        {
            quizId:.......,
            quizAnswer:    
        },
    ]

*/
function Answer(ob) {
    this.wei_user_info = ob.wei_user_info;
    this.questionnaire_id = ob.questionnaire_id;
    this.answer = ob.answer;
}

module.exports = Answer;

Answer.prototype.save = function(callback) {
    var t = this;
        db.collection('answer', function(err, collection) {
            if (err) {
                return callback(err);
            }
            collection.insert(t, {
                safe: true
            }, function(err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
};
Answer.getAll = function(callback) {
        db.collection('answer', function(err, collection) {
            if (err) {
                return callback(err);
            }
            collection.find().sort({ time: -1 }).toArray(function(err, docs) {
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
};

Answer.getByQuestionnaireId = function(_id, callback) {
        db.collection('answer', function(err, collection) {
            if (err) {
                return callback(err);
            }
            collection.find({ 'questionnaire_id': _id }).toArray(function(err, doc) {
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
}
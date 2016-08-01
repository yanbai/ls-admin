var db = require('./db');
var extend = require('../tools/mixin');

function Quiz(user, title, startTime, endTime) {
    this.user = user;
    this.title = title;
    this.startTime = startTime;
    this.endTime = endTime;
}

function addOneYear(dateOb) {
    return new Date(Date.parse(dateOb) + 1000 * 60 * 60 * 24 * 365)
}

module.exports = Quiz;

Quiz.prototype.save = function(callback) {
    var now = new Date();
    var oneYearLater = addOneYear(now);
    var createTime = {
        date: now,
        year: now.getFullYear(),
        month: now.getFullYear() + "-" + (now.getMonth() + 1),
        day: now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate(),
        minute: now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " +
            now.getHours() + ":" + (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes())
    }

    var defaultEndTime = {
        date: oneYearLater,
        year: oneYearLater.getFullYear(),
        month: oneYearLater.getFullYear() + "-" + (oneYearLater.getMonth() + 1),
        day: oneYearLater.getFullYear() + "-" + (oneYearLater.getMonth() + 1) + "-" + oneYearLater.getDate(),
        minute: oneYearLater.getFullYear() + "-" + (oneYearLater.getMonth() + 1) + "-" + oneYearLater.getDate() + " " +
            oneYearLater.getHours() + ":" + (oneYearLater.getMinutes() < 10 ? '0' + oneYearLater.getMinutes() : oneYearLater.getMinutes())
    }

    var quiz = {
        createTime: createTime,
        user: this.user,
        startTime: this.startTime || createTime,
        endTime: this.endTime || defaultEndTime,
        title: this.title
    };
    console.log(quiz);
        db.collection('quiz', function(err, collection) {
            if (err) {
                // db.close();
                return callback(err);
            }

            collection.insert(quiz, function(err, docs) {
                // db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
};

Quiz.getAll = function(callback) {
        db.collection('quiz', function(err, collection) {
            if (err) {
                // db.close();
                return callback(err);
            }
            collection.find().sort({ time: -1 }).toArray(function(err, docs) {

                if (err) {
                    return callback(err);
                }
                callback(null, docs);
                // db.close();
            });
        });
};

Quiz.getById = function(_id, callback) {
        db.collection('quiz', function(err, collection) {
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

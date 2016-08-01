var db = require('./db');
var extend = require('../tools/mixin');

function Menu(obj) {
    this.name = obj.name;
    this.sub_name = obj.subName;
    this.type = obj.type;
    this.sale_count = obj.saleCount;
    this.prev_price = obj.prevPrice;
    this.now_price = obj.nowPrice;
    this.admin_id = obj.adminId;
    this.img_src = obj.imgSrc;
}

module.exports = Menu;

Menu.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + "-" + (date.getMonth() + 1),
            day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }
        //要存入数据库的文档
    var menu = {};
    extend(menu,this);
    menu.time = time;
    //打开数据库
        db.collection('menu', function(err, collection) {
            if (err) {
                // mongodb.close();
                return callback(err);
            }
            collection.insert(menu, {
                safe: true
            }, function(err) {
                // mongodb.close();
                if (err) {
                    return callback(err); //失败！返回 err
                }
                callback(null); //返回 err 为 null
            });
        });
};

Menu.update = function(_id, ob, callback) {
        db.collection('menu', function(err, collection) {
            if (err) {
                // mongodb.close();
                return callback(err);
            }
            collection.update({
                _id: require('mongodb').ObjectID(_id)
            }, {
                $set: ob
                // todo
            }, function(err) {
                // mongodb.close();
                if (err) return callback(err);
                callback(null);
            })
        })
}

Menu.delete = function(_id, callback) {
        db.collection('menu', function(err, collection) {
            if (err) {
                // mongodb.close();
                return callback(err);
            }
            collection.remove({
                _id: require('mongodb').ObjectID(_id)
            }, function(err) {
                // mongodb.close();
                if (err) return callback(err);
                callback(null);
            })
        })
}

Menu.getById = function(_id, callback) {
        db.collection('menu', function(err, collection) {
            if (err) {
                // mongodb.close();
                return callback(err);
            }
            collection.findOne({
                '_id': require('mongodb').ObjectID(_id)
            }, function(err, doc) {
                // mongodb.close();
                if (err) return callback(err);

                callback(null, doc);
            })
        })
}

Menu.getAll = function(name, callback) {
    //打开数据库
        db.collection('menu', function(err, collection) {
            if (err) {
                // // mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //根据 query 对象查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                // // mongodb.close();
                if (err) {
                    return callback(err); //失败！返回 err
                }
                callback(null, docs); //成功！以数组形式返回查询的结果
            });
        });
};
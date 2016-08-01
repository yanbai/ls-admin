var settings = require('../settings'),
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

var db_options = {
    // w:-1,// 设置w=-1是mongodb 1.2后的强制要求，见官方api文档
    safe: true,
    logger:{
        doDebug:true,
        debug:function(msg,obj){
            console.log('[debug]',msg);
        },
        log:function(msg,obj){
            console.log('[log]',msg);
        },
        error:function(msg,obj){
            console.log('[error]',msg);
        }
    }
}

var db = new Db(settings.db, new Server(settings.host, 27017), db_options);

db.open(function(err, db) {
    db.authenticate('', function(err, result) {
        if (err) {
            db.close();
            // res.end('Authenticate failed!');
            return;
        }
        console.log("open db");
    });
    db.on('close', function(){
        db.open(function(err, db) {
            db.authenticate('', function(err, result) {
                if (err) {
                    db.close();
                    // res.end('Authenticate failed!');
                    return;
                }
                console.log("open db");
            });
        });
    });
    
});

module.exports = db;

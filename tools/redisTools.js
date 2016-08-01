var config = require('./configUtils');
var nodes = config.getConfigs().nodes;
var node = nodes[0];
var redisTools = {
    openClient: function () {
        

        var client = require('redis').createClient(node.port, node.address, {"no_ready_check":true});
        client.auth(node.username + '-' + node.password + '-' + node.dbname);
        client.on('error', function (err) {
            console.log('error: ' + err);
        });
        return client;
    },

    hsetRedis: function(id, key, val, callback){
        var client = this.openClient();
        client.hset(id, key, val, function(err, reply) {
            if (err){
                console.log('hset ' + key + 'error: ' + err);
            }
            console.log('hset [' + key + ']:[' + val + '] reply is:' + reply);
            client.quit();
            callback(err, reply);
        })
    },

    hgetRedis: function (id, key, callback) {
        var client = this.openClient();
        client.hget(id, key, function (err, reply) {
            if (err)
                console.log('hget error:' + err);
            client.quit();
            callback(err, reply);
        });
    },

    hdelRedis: function(id, key, callback){
        var client = this.openClient();
        client.hdel(id, key, function (err, reply) {
            if (err)
                console.log('hdel error:' + err);
            client.quit();
            callback.call(null, err, reply);
        });
    }

}

module.exports = redisTools;
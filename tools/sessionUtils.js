var crypto = require('crypto');
var config = require('./configUtils');

var EXPIRES = 20 * 60 * 1000;
var redisMatrix = require('./redisMatrix');
var redisTools = require('./redisTools');


var sign = function (val, secret) {
    return val + '.' + crypto
        .createHmac('sha1', secret)
        .update(val)
        .digest('base64')
        .replace(/[\/\+=]/g, '');
};
var generate = function () {
    var session = {};
    session.id = (new Date()).getTime() + Math.random().toString();
    session.id = sign(session.id, config.getConfigs().SECRET);
    session.expire = (new Date()).getTime() + EXPIRES;
    return session;
};
var serialize = function (name, val, opt) {
    var pairs = [name + '=' + encodeURIComponent(val)];
    opt = opt || {};

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires);
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
};

var setHeader = function (req, res, next) {
    var writeHead = res.writeHead;
    res.writeHead = function () {
        var cookies = res.getHeader('Set-Cookie');
        cookies = cookies || [];
        //if, Set-Cookie=="" ==> cookies=[] ==> session={"session_id":11111(req.session.id)} ==> cookies=[{"session_id":11111}]
        // ==> Set-Cookie=[{"session_id":11111}]

        //else if, cookies==Set-Cookie==[{"session_id":xxxxxxxxxx}] ==> session={"session_id":11111} ==> 
        //cookies=[{"session_id":11111},{"session_id":11111}] ==> Set-Cookie=[{"session_id":11111},{"session_id":11111}]


        console.log('writeHead, cookies: ' + cookies);
        var session = serialize(config.getConfigs().session_key, req.session.id);
        console.log('writeHead, session: ' + session);
        cookies = Array.isArray(cookies) ? cookies.concat(session) : [cookies, session];
        res.setHeader('Set-Cookie', cookies);
        return writeHead.apply(this, arguments);
    };
    next();
};

exports = module.exports = function session() {
    return function (req, res, next) {

        var id = req.cookies[config.getConfigs().session_key];
        //no "session_id" field in cookie
        //Set-Cookie not set yet
        //set req.session to {id:11111,expires:time1}
        //save session to redis as {11111(id set above):{session:{id:11111,expires:time1}}}
        //and then set head as [{"session_id":11111}]
        if (!id) {
            req.session = generate();
            id = req.session.id;
            var json = JSON.stringify(req.session);
            redisTools.hsetRedis(id, 'session', json,
                function () {
                    setHeader(req, res, next);
                });
        } else {
            //"session_id" field found in cookie
            //get session data from redis by "11111"(session_id) and key "session"
            //如果在20分钟以内，继续增加废弃时间. redis中取得数据，
            //req.session = {id:11111,expires:time2}.
            //save session to redis as {11111(id set above):{session:{id:11111,expires:time2}}}
            //Set-Cookie=[{"session_id":11111},{"session_id":11111}]

            //else if, expires, req.session={id:22222,expires:time3} ==> save session in redis as {22222:{"session":{id:22222,expires:time3}}} ==> "Set-Cookie":[{"session_id":22222}]
            console.log('session_id found: ' + id);
            redisTools.hgetRedis(id, 'session', function (err, reply) {
                var needChange = true;
                if (reply) {
                    var session = JSON.parse(reply);
                    if (session.expire > (new Date()).getTime()) {
                        session.expire = (new Date()).getTime() + EXPIRES;
                        req.session = session;
                        needChange = false;
                        var json = JSON.stringify(req.session);
                        redisTools.hsetRedis(id, 'session', json,
                            function () {
                                setHeader(req, res, next);
                            });
                    }
                }
                if (needChange) {
                    req.session = generate();
                    id = req.session.id; // id need change
                    var json = JSON.stringify(req.session);
                    redisTools.hsetRedis(id, 'session', json,
                        function (err, reply) {
                            console.log("hsetRedis err: " + err);
                            setHeader(req, res, next);
                        });
                }
            });
        }
    };
};

module.exports.set = function (req, name, val) {
    var id = req.cookies[config.getConfigs().session_key];
    if (id) {
        redisTools.hsetRedis(id, name, val, function (err, reply) {

        });
    }
};
/*
 get session by name
 @req request object
 @name session name
 @callback your callback
 */
module.exports.get = function (req, name, callback) {
    var id = req.cookies[config.getConfigs().session_key];
    if (id) {
        redisTools.hgetRedis(id, name, function (err, reply) {
            callback(err, reply);
        });
    } else {
        callback();
    }
};

module.exports.getById = function (id, name, callback) {
    if (id) {
        redisTools.hgetRedis(id, name, function (err, reply) {
            callback(err, reply);
        });
    } else {
        callback();
    }
};
module.exports.deleteById = function (id, name, callback) {
    if (id) {
        redisTools.hdelRedis(id, name, function (err, reply) {
            callback(err, reply);
        });
    } else {
        callback();
    }
};
var express = require('express');
var router = express.Router();

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/menu_picture')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '_' + Date.now() + '.' + file.originalname.split('.')[1])
    }
})
var upload = multer({
    storage: storage
});

var crypto = require('crypto'),
    User = require('../models/user.js'),
    Retailer = require('../models/retailer.js'),
    Menu = require('../models/food-menu.js'),
    Quiz = require('../models/questionnaire.js'),
    Question = require('../models/question.js'),
    Answer = require('../models/answer.js'),
    Post = require('../models/post.js');

// input from "问卷调查"
var http = require("http"),
    https = require('https');
var async = require('async');
var settings = require('../settings');
var querystring = require('querystring');

var session = require('../tools/sessionUtils');
var config = require("../tools/configUtils");

function sha1(str) {
    var md5sum = crypto.createHash('sha1');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        return res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!');
        return res.redirect('back'); //返回之前的页面
    }
    next();
}



/* 前台 */
router.get('/', function(req, res, next) {
    // req.session
    // {"cookie":{"originalMaxAge":2591999994,"expires":"2016-03-17T12:57:29.867Z","httpOnly":true,"path":"/"},"flash":{},"user":{"_id":"56af0099e45e47b45a39bcbf","name":"test","password":"202cb962ac59075b964b07152d234b70","email":"542206733@qq.com"},"retailer":{"_id":"56af118580c539246f88e989","name":"舞曲","password":"202cb962ac59075b964b07152d234b70","email":"zhang_yanbai@163.com"}}
    Menu.getAll(null, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            var type_lists = [];
            var menu_by_type = {};
            data.forEach(function(item) {
                if (type_lists.indexOf(item['type']) > -1) {
                    menu_by_type[item['type']].push(item);
                } else {
                    type_lists.push(item['type']);
                    menu_by_type[item['type']] = [];
                    menu_by_type[item['type']].push(item);
                }
            })
            res.render('index', {
                title: '首页',
                user: req.session.user,
                data: data,
                type_lists: type_lists,
                menu_by_type: menu_by_type,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }
    })
});

router.get('/get_all_menu', function(req, res, next) {
    Menu.getAll(null, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            res.send(data);
        }
    })
});



/* 用户后台 */

router.get('/user', function(req, res) {
    session.get(req, "user", function(err, reply){
        
        var user = JSON.parse(reply);
        res.render('user/user-admin-dashboard', {
            title: '用户后台首页',
            user: user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

// router.get('/u/:name',function(req,res){
//  User.get(req.params.name,function(err,user){
//      if(!user){
//          req.flash('error','用户不存在');
//          return res.redirect('/');
//      }
//  })
// });


// 商家后台

router.get('/admin/home', function(req, res) {
    res.render('admin/admin-home', {
        title: '商家后台首页',
        user: req.session.retailer,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.get('/admin', function(req, res) {
    Menu.getAll(null, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            res.render('admin/admin-dashboard', {
                title: '商家后台首页',
                user: req.session.retailer,
                data: data,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }
    })
});

router.get('/admin/menu_lists', function(req, res) {
    if (!req.query['action']) {
        Menu.getAll(null, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                res.render('admin/admin-menu-lists', {
                    title: '菜单列表',
                    page_name: 'menu_lists',
                    user: req.session.retailer,
                    data: data,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            }
        })
    } else if (req.query['action']) {
        if (req.query['action'] == 'delete') {
            Menu.delete(req.query['menu-id'], function(err) {
                if (err) {
                    req.flash("error", err);
                    return false;
                }
                req.flash("success", "删除成功");
                return res.redirect('back');
            })
        } else if (req.query['action'] == 'edit') {
            Menu.getById(req.query['menu-id'], function(err, data) {
                if (err) {
                    res.send(err)
                } else {
                    res.render('admin/admin-menu-edit', {
                        title: '菜单编辑',
                        page_name: 'menu_edit',
                        user: req.session.retailer,
                        data: data,
                        success: req.flash('success').toString(),
                        error: req.flash('error').toString()
                    });
                }
            })
        }
    }
});

router.post('/admin/menu_edit', upload.single("menu-picture"), function(req, res, next) {
    if (req.file != undefined) {
        var fileSrc = req.file.destination.split('/')[1] + '/' + req.file.filename;
        ob = {
            name: req.body.name,
            sub_name: req.body['sub-name'],
            type: req.body['food-type'],
            prev_price: req.body['prev-price'],
            now_price: req.body['now-price'],
            img_src: fileSrc
        }
    } else {
        ob = {
            name: req.body.name,
            sub_name: req.body['sub-name'],
            type: req.body['food-type'],
            prev_price: req.body['prev-price'],
            now_price: req.body['now-price']
        }
    }
    Menu.update(req.body._id, ob, function(err) {
        if (err) {
            res.send(err)
        } else {
            res.redirect('/admin/menu_lists');
        }
    })
});

router.get('/admin/add_menu', function(req, res, next) {
    res.render('admin/admin-menu-new', {
        title: '添加菜单',
        page_name: 'menu_new',
        user: req.session.retailer,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/admin/add_menu', upload.single("img"), function(req, res, next) {
    // req.session
    // {"cookie":{"originalMaxAge":2591999999,"expires":"2016-03-12T04:28:59.114Z","httpOnly":true,"path":"/"},"flash":{},"user":{"_id":"56af0099e45e47b45a39bcbf","name":"test","password":"202cb962ac59075b964b07152d234b70","email":"542206733@qq.com"},"retailer":{"_id":"56af118580c539246f88e989","name":"舞曲","password":"202cb962ac59075b964b07152d234b70","email":"zhang_yanbai@163.com"}}

    // req.file
    // {"fieldname":"img","originalname":"arrow.png","encoding":"7bit","mimetype":"image/png","destination":"uploads/","filename":"5af8d4c36bad49ccf270a6bf0402edfa","path":"uploads\\5af8d4c36bad49ccf270a6bf0402edfa","size":2943}

    // req.file after set multer.diskStorage
    // {"fieldname":"img","originalname":"arrow.png","encoding":"7bit","mimetype":"image/png","destination":"uploads/menu_picture","filename":"img-1455183928319.png","path":"uploads\\menu_picture\\img-1455183928319.png","size":2943}

    var currentUser = req.session.retailer;
    var fileSrc = req.file.destination.split('/')[1] + '/' + req.file.filename;
    var menu = new Menu({
        name: req.body.name,
        subName: req.body['sub-name'],
        type: req.body.type,
        saleCount: parseFloat(0),
        prevPrice: parseFloat(req.body['prev-price']),
        nowPrice: parseFloat(req.body['now-price']),
        adminId: currentUser['_id'],
        imgSrc: fileSrc
    });

    menu.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功');
        res.redirect('/admin');
    })
});


// 商家注册登录

router.get('/admin/reg', function(req, res) {
    res.render('reg', {
        title: '商家注册',
        user: req.session.retailer,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.get('/admin/login', function(req, res) {
    res.render('login', {
        title: '商家登录',
        user: req.session.retailer,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/admin/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];

    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!');
        return res.redirect('/reg'); //返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newRetailer = new Retailer({
        name: name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在 
    Retailer.get(newRetailer.name, function(err, user) {
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('/admin/reg'); //返回注册页
        }
        //如果不存在则新增用户
        newRetailer.save(function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg'); //注册失败返回主册页
            }
            req.session.retailer = user; //用户信息存入 session
            req.flash('success', '注册成功!');
            res.redirect('/admin'); //注册成功后返回主页
        });
    });
});

router.post('/admin/login', function(req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    Retailer.get(req.body.userName, function(err, retailer) {
        if (!retailer) {
            req.flash('error', '商家不存在!');
            return res.redirect('/login'); //用户不存在则跳转到登录页
        }
        //检查密码是否一致
        if (retailer.password != password) {
            req.flash('error', '密码错误!');
            return res.redirect('/admin/login'); //密码错误则跳转到登录页
        }
        //用户名密码都匹配后，将用户信息存入 session
        req.session.retailer = retailer;
        req.flash('success', '登陆成功!');
        res.redirect('/admin'); //登陆成功后跳转到主页
    });
});


// 用户注册登录

router.get('/reg', function(req, res) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.get('/login', function(req, res) {
    if(req.session){
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    }else{
        res.render('login', {
            title: '登录',
            user: {},
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    }
    
});



router.get('/logout', function(req, res) {});


router.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];

    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!');
        return res.redirect('/reg'); //返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在 
    User.get(newUser.name, function(err, user) {
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('/reg'); //返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg'); //注册失败返回主册页
            }
            req.session.user = user; //用户信息存入 session
            req.flash('success', '注册成功!');
            res.redirect('/'); //注册成功后返回主页
        });
    });
});

router.post('/login', function(req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.userName, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/login'); //用户不存在则跳转到登录页
        }
        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '密码错误!');
            return res.redirect('/login'); //密码错误则跳转到登录页
        }
        //用户名密码都匹配后，将用户信息存入 session
        // req.session.user = user;
        session.set(req,"user",JSON.stringify(user));
        
        req.flash('success', '登陆成功!');
        res.redirect('/user'); //登陆成功后跳转到主页
    });
});


/*问卷调查*/
router.get('/admin/questionnaire/list', checkLogin);
router.get('/admin/questionnaire/list', function(req, res) {
    Quiz.getAll(function(err, quizes) {
        return res.render('admin/questionnaire/questionnaire_lists', {
            title: '问卷列表',
            quizes: quizes,
            page_name: '',
            user: req.session.retailer,
            appid: settings.appid,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    })
})

router.get('/admin/questionnaire/edit', checkLogin);
router.get('/admin/questionnaire/edit', function(req, res) {
    return res.render('admin/questionnaire/questionnaire_new', {
        title: '新建问卷',
        user: req.session.retailer,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
})
router.post('/admin/questionnaire/edit', checkLogin);
router.post('/admin/questionnaire/edit', function(req, res) {
    var currentUser = req.session.user,
        quiz = new Quiz(currentUser.name, req.body.title, req.body.startTime, req.body.endTime);
    quiz.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功');
        return res.redirect('/admin/questionnaire/list');
    })
})

// router.get('/admin/question/list/:p_id', checkLogin);
router.get('/admin/question/list/:p_id', function(req, res) {
    console.log(req.param("p_id"));
    if (req.param("p_id")) {
        Question.getById(req.param("p_id"), function(err, question) {
            return res.render('admin/questionnaire/question_lists', {
                title: '问题列表',
                question: question,
                parent_id: req.param("p_id"),
                user: req.session.retailer,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        })
    }
})

router.get('/admin/question/edit', function(req, res) {
    if (req.param("parent_id")) {
        if (!req.param("q_id")) {
            return res.render('admin/questionnaire/question_new', {
                title: '新建问题',
                user: req.session.retailer,
                parent_id: req.param("parent_id"),
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        } else {
            // question edit page
            Question.findOne(req.param("q_id"), function(err, data) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                return res.render("admin/questionnaire/question_edit", {
                    title: '编辑问题',
                    user: req.session.retailer,
                    q: data,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                })
            })
        }
    }
})

router.post('/admin/question/edit', function(req, res) {

    var p_id = req.param("parent_id");

    if (p_id) {
        if (!req.param("q_id")) {
            // create a question
            var q = new Question(p_id, req.body.title, req.body.type, req.body.content);
            q.save(function(err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/admin/question/list/' + p_id);
                }
                req.flash('success', '发布成功');
                return res.redirect('/admin/question/list/' + p_id);
            })
        } else {
            // edit a question
            var q = {
                title: req.body.title,
                type: req.body.type,
                content: req.body.content
            }
            Question.update(req.param("q_id"), q, function(err) {
                if (err) {
                    req.flash('error', err);
                    return false;
                }
                req.flash('success', '发布成功');
                return res.redirect('/admin/question/list/' + p_id);
            })
        }
    }

})

// delete questions
router.post('/admin/question/delete', function(req, res) {
    Question.deleteById(req.body.checkedQuestion, function(err) {
        if (err) {
            req.flash("error", err);
            return false;
        }
        req.flash("success", "删除成功");
        return res.redirect('back');
    })
})


router.get('/question/questionList', function(req, res) {
    return res.render("admin/questionnaire/front_question_lists_angular", {});
    // Question.getById(req.param("q_id"),function(err,question_docs){
    // Quiz.getById(req.param("q_id"),function(err,quiz_docs){
    // if(err) {req.flash('error',err); return res.redirect('back');}
    // res.send(question_docs);
    // })
    // })
});

// front_question_lists_preview
router.get("/question/:q_id", function(req, res) {
    if (req.params.q_id) {
        Question.getById(req.params.q_id, function(err, question_docs) {
            Quiz.getById(req.params.q_id, function(err, quiz_docs) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                return res.render("admin/questionnaire/front_question_lists_preview", {
                    title: '问卷调查',
                    user: req.session.retailer,
                    quiz: quiz_docs,
                    question: question_docs,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                })
            })
        })
    }
})



router.get("/admin/question/answer_by_user", function(req, res) {
    if (req.param("questionnaire_id")) {
        Answer.getByQuestionnaireId(req.param("questionnaire_id"), function(err, docs) {
            if (err) {
                return;
            }
            res.render("admin/questionnaire/answer_by_user", {
                title: '报表',
                user: req.session.retailer,
                answer: docs,
                questionnaireId: req.param("questionnaire_id"),
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    }
})


router.get("/admin/question/answer_by_questionnaire", function(req, res) {
    if (req.param("questionnaire_id")) {
        Answer.getByQuestionnaireId(req.param("questionnaire_id"), function(err, docs) {
            if (err) {
                return;
            }

            var results = {}
            docs.forEach(function(item) {

                item.answer.forEach(function(a) {

                    if (a.quizId in results) {

                        if (typeof a.quizAnswer == "string") {
                            if (a.quizAnswer in results[a.quizId]["quizAnswer"]) {
                                results[a.quizId]["quizAnswer"][a.quizAnswer]++
                            } else {
                                results[a.quizId]["quizAnswer"][a.quizAnswer] = 1;
                            }
                            results[a.quizId]["__all__"]++
                        } else if (a.quizAnswer instanceof Array) {
                            // checkbox and check more than 1
                            a.quizAnswer.forEach(function(_i) {
                                if (_i in results[a.quizId]["quizAnswer"]) {
                                    results[a.quizId]["quizAnswer"][_i]++
                                } else {
                                    results[a.quizId]["quizAnswer"][_i] = 1
                                }
                                results[a.quizId]["__all__"]++
                            })
                        }
                    } else {
                        results[a.quizId] = {
                            "quizId": a.quizId,
                            "quizTitle": a.quizTitle,
                            "quizAnswer": {},
                            "__all__": 1
                        }
                        if (a.quizAnswer instanceof Array) {
                            a.quizAnswer.forEach(function(i) {
                                results[a.quizId]["quizAnswer"][i] = 1;
                            })
                        } else {
                            results[a.quizId]["quizAnswer"][a.quizAnswer] = 1;
                        }
                    }

                })
            })

            res.render("admin/questionnaire/answer_by_questionnaire", {
                title: '报表',
                user: req.session.retailer,
                questionnaireId: req.param("questionnaire_id"),
                data: results,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    }
})

// save_the_questionnaire 
router.post("/question/save_the_questionnaire", function(req, res) {

    function parse(ob) {
        var whiteLists = ["wei_user_info", "questionnaire_id"]
        var newOb = {};
        newOb.answer = [];

        for (var i in ob) {
            if (whiteLists.indexOf(i) >= 0) {
                newOb[i] = ob[i];
            } else {
                var o = {};
                var arr = [];
                if (typeof ob[i] == "string") {
                    arr = ob[i].split("$$");
                    if (arr.length > 1) {
                        //单选
                        o["quizAnswer"] = arr[0];
                        o["quizTitle"] = arr[1];
                        o["quizType"] = arr[2];
                    } else {
                        //问答
                        o["quizAnswer"] = arr[0];
                        o["quizTitle"] = arr[1];
                        o["quizType"] = arr[2];
                    }
                } else {
                    //多选
                    o["quizAnswer"] = [];
                    ob[i].forEach(function(item) {
                        arr = item.split("$$");
                        o["quizAnswer"].push(arr[0]);
                        o["quizTitle"] = arr[1];
                        o["quizType"] = arr[2];
                    })
                }
                o["quizId"] = i;
                newOb.answer.push(o);
            }
        }
        return newOb;
    }


    var ob = parse(req.body);

    console.log(req.body);

    /*
    ob:
        # questionnaire_id: '55a51f408af1ae8d3cd78eee' }
        # wei_user_info: '{"openid":"oViSQwxvb1fuEqegnecaacniwSOU","nickname":"岩柏","sex":1,"language":"zh_CN","city":"福州","province":"福建","country":"中国","headimgurl":"http://wx.qlogo.cn/mmopen/mLdBCpeJU6ne5zRZma7SCJHXePcGX62Ic3phNcooADiaW3ZsUwibveDh2Ic5aGriczwxlxC59aESueK3iap5DnnK7w/0","privilege":[]}',
        # quizId: '55a5266fb15db09345332235' } ],
        # quizType: '1',
        # quizTitle: '测试',
        # { quizAnswer: [Object],
        # quizId: '55a51f638af1ae8d3cd78ef0' },
        # quizType: '0',
        # quizTitle: '你住哪里',
        # { quizAnswer: '外国',
        # quizId: '55a51f518af1ae8d3cd78eef' },
        # quizType: '0',
        # quizTitle: '你喜欢吃什么',
        # [ { quizAnswer: '西餐',
        #{ answer:
    */

    /*
        req.body
        # '55b4a5c1dfc6d4eb57c9c0e5': '你好吗你好吗你好吗你好吗你好吗你好吗你好吗你好吗' }
        # '55b47c506d8ce3fa15c9cfe1': [ '大帝$$留下点建议$$1', '从地上$$留下点建议$$1' ],
        # '55a5266fb15db09345332235': [ '一一$$测试$$1', '三$$测试$$1' ],
        # '55a51f638af1ae8d3cd78ef0': '中国$$你住哪里$$0',
        # '55a51f518af1ae8d3cd78eef': '西餐$$你喜欢吃什么$$0',
        # questionnaire_id: '55a51f408af1ae8d3cd78eee',
        #{ wei_user_info: '{"openid":"oViSQwxvb1fuEqegnecaacniwSOU","nickname":"岩柏","sex":1,"language":"zh_CN","city":"福州","province":"福建","country":"中国","headimgurl":"http://wx.qlogo.cn/mmopen/mLdBCpeJU6ne5zRZma7SCJHXePcGX62Ic3phNcooADiaW3ZsUwibveDh2Ic5aGriczwxlxC59aESueK3iap5DnnK7w/0","privilege":[]}',
    */

    var answer_data = new Answer(ob);
    answer_data.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.end(err);
        }
        req.flash('success', '发布成功');
        return res.end('发布成功');
    });
})


module.exports = router;

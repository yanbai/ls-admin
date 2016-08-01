var db = require('./db');

function User(obj){
	this.name = obj.name;
	this.password = obj.password;
	this.email = obj.email;
}

module.exports = User;

User.prototype.save = function(callback){
	var user = {
		name:this.name,
		password:this.password,
		email:this.email
	};
	

		
		db.collection('users',function(err,collection){
			if(err){
				// mongodb.close();
				return callback(err);
			}
			
			collection.insert(user,{safe:true},function(err){	
				// mongodb.close();
				if(err){return callback(err)}
				callback(null, user[0]);
			})
		})

}

User.get = function(name,callback){

		db.collection('users',function(err,collection){
			if(err){
				// mongodb.close();
				return callback(err);
			}
			collection.findOne({name:name},function(err,user){
				// mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user);
			})
		})

}


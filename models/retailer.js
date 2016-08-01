var db = require('./db');

function Retailer(obj){
	this.name = obj.name;
	this.password = obj.password;
	this.email = obj.email;
}

module.exports = Retailer;

Retailer.prototype.save = function(callback){
	var user = {
		name:this.name,
		password:this.password,
		email:this.email
	};
	

		db.collection('retailers',function(err,collection){
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

Retailer.get = function(name,callback){

		db.collection('retailers',function(err,collection){
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


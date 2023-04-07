var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;
var userSchema = new Schema({
  "userName":  String,
  "password": String,
  "email": String,
  "loginHistory": [{
    "dateTime": Date,
    "userAgent": String
  }]
});

let User;


module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://mhakimi7:amYdV6SleLf4iPZv@senecaweb.6ao4hoy.mongodb.net/?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("web322_assign6", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = function(userData){
    return new Promise((resolve,reject)=>{
        // check if passwords match
        if (userData.password  !== userData.password2) {
            reject("Passwords do not match.")
        }
        else {
            bcrypt.hash(userData.password, 10).then(hash=>{ // Hash the password using a Salt that was generated using 10 rounds
                userData.password = hash; // Store the resulting "hash" value in the DB
                let newUser = new User(userData);
                newUser.save()
                .then(function() {
                    resolve(true);
                }).catch(function(err) {
                    if (err.code === 11000) {
                        // duplicate key
                        reject("User Name already taken.");
                    }
                    else {
                        reject(`There was an error create the user: + ${err}`);
                    }
                });
            })
            .catch(err=>{
                reject("There was an error encrypting the password.");
            });

        }
    });
}

module.exports.checkUser = function (userData) {
    return new Promise((resolve,reject)=>{
        User.find({userName: userData.userName}).exec()
            .then((users) => {
                if (users.length == 0) {
                    reject(`Unable to find user ${userData.userName}`);
                }
                else {
                    bcrypt.compare(userData.password, users[0].password).then((result) => {
                        // result === true if it matches and result === false if it does not match
                        if (result === true) {
                            users[0].loginHistory.push({
                                dateTime: (new Date()).toString(), 
                                userAgent: userData.userAgent
                            });
                            User.updateOne(
                                {userName: users[0].userName},
                                { $set: {loginHistory: users[0].loginHistory} }
                            ).exec().then(() => {
                                resolve(users[0]);
                            }).catch((err) => {
                                reject(`There was an error verifying the user: ${err}`);
                            });
                        }
                        else {
                            reject(`Incorrect Password for user: ${userData.userName}`);
                        }
                     });                     
                }
            }).catch((err) => {
                reject(`Unable to find user: ${userData.userName}`);
            })
    });
}
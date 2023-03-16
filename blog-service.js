const Sequelize = require('sequelize');

const {gte} = Sequelize.Op.gte;

// set up sequelize to point to our postgres database
var sequelize = new Sequelize('saqfqqil', 'saqfqqil', 'DXM-Fa4Br2p3y9V4LVyJfQF1exgZynNC', {
    host: 'rogue.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});
sequelize.authenticate()
    .then(function() {
        console.log('Connection has been established successfully.')
    })
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });



// Define a "Post" model
var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

// Define a "Category" model
var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

// belongssTo relationship
Post.belongsTo(Category, {foreignKey: 'category'});


module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(function() {
                resolve(true);
            }).catch(function() {
                reject("Unable to sync the database,");
            });
    });
}

module.exports.getAllPosts = function(){
    return new Promise((resolve,reject)=>{
        Post.findAll()
            .then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.getPostsByCategory = function(category){
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {category: category}
            }).then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.getPostsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {postDate: {[gte]: new Date(minDateStr)}}
            }).then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.getPostById = function(id){
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {id: id}
            }).then(function(data) {
                resolve(data[0]);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.addPost = function(postData){
    return new Promise((resolve,reject)=>{
        // preprocessing properties
        postData.published = (postData.published) ? true : false;
        for (prop in postData) {
            if (prop == "") postData[prop] = null;
        }
        postData.postDate = new Date();
        console.log(postData);
        // invoking the create() method
        Post.create(postData)
            .then(function() {
                resolve(true);
            }).catch(function() {
                reject("Unable to create post.");
            })
    });
}

module.exports.getPublishedPosts = function(){
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {published: true}
            }).then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.getCategories = function(){
    return new Promise((resolve,reject)=>{
        Category.findAll()
            .then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}

module.exports.addCategory = function(categoryData) {
    for (prop in categoryData) {
        if (prop == "") categoryData[prop] = null;
    }
    return new Promise((resolve, reject) => {
        Category.create(categoryData)
            .then(function() {
                resolve(true);
            }).catch(function() {
                reject('Unable to create category.');
            });
    });
}

module.exports.deleteCategoryById = function(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {id: id}
        }).then(function(rowsDeleted) {
            if (rowsDeleted > 0)
                resolve(true); 
            else
            reject('Unable to delete category.');        
        }).catch(function() {
            reject('Unable to delete category.');
        })
    })
}

module.exports.deletePostById = function(id) {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: {id: id}
        }).then(function(rowsDeleted) {
            if (rowsDeleted > 0)
                resolve(true); 
            else
            reject('Unable to delete post.');        
        }).catch(function() {
            reject('Unable to delete post.');
        })
    })
}

module.exports.getPublishedPostsByCategory = function(category){
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {
                published: true,
                category: category
            }
            }).then(function(data) {
                resolve(data);
            }).catch(function() {
                reject("No results returned.");
            });
    });
}
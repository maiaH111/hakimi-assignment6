/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Maia Hakimi  Student ID: 187568217 Date: March 10, 2023
*
*  Online (Cyclic) Link: https://good-red-cobra-coat.cyclic.app
*
********************************************************************************/ 

const express = require('express');
const blogData = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require("path");
const app = express();
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');

const HTTP_PORT = process.env.PORT || 8080;

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
}));
app.set('view engine', 'exphbs');

cloudinary.config({
    cloud_name: 'dwt5ihjs8',
    api_key: '622971299817374',
    api_secret: 'MKb2oGPzIvYY3Y3eHdis-8XtkC4',
    secure: true
});

const upload = multer();

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

var hbs = exphbs.create({});

hbs.handlebars.registerHelper('navLink', function(url, options){
    return '<li' + 
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
})


hbs.handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
})


hbs.handlebars.registerHelper('safeHTML', function (context) {
    return stripJs(context);
})


hbs.handlebars.registerHelper('formatDate', function (dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
})


app.get('/', (req, res) => {
    res.redirect("/blog");
});

app.get('/about', (req, res) => {
    res.render(path.join(__dirname, "/views/about.hbs"))
});

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render(path.join(__dirname, "/views/blog.hbs"), {data: viewData})

});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await blogData.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render(path.join(__dirname, "/views/blog.hbs"), {data: viewData})
});

app.get('/posts', (req,res)=>{

    let queryPromise = null;

    if(req.query.category){
        queryPromise = blogData.getPostsByCategory(req.query.category);
    }else if(req.query.minDate){
        queryPromise = blogData.getPostsByMinDate(req.query.minDate);
    }else{
        queryPromise = blogData.getAllPosts()
    } 

    queryPromise.then(data=>{
        if (data.length > 0)
            res.render(path.join(__dirname, "/views/posts.hbs"), {posts: data});
        else
            res.render(path.join(__dirname, "/views/posts.hbs"), {message: "no results"});
    }).catch(err=>{
        res.render(path.join(__dirname, "/views/posts.hbs"), {message: "no results"});
    })

});

app.post("/posts/add", upload.single("featureImage"), (req,res)=>{

    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }

    function processPost(imageUrl){
        req.body.featureImage = imageUrl;

        blogData.addPost(req.body).then(post=>{
            res.redirect("/posts");
        }).catch(err=>{
            res.status(500).send(err);
        })
    }   
});

app.get('/posts/add', (req,res)=>{
    blogData.getCategories().then(data=>{
        res.render(path.join(__dirname, "/views/addPost.hbs"), {categories: data});
    }).catch(err=>{
        res.render(path.join(__dirname, "/views/addPost.hbs"), {categories: []});
    })
}); 

app.get('/post/:id', (req,res)=>{
    blogData.getPostById(req.params.id).then(data=>{
        res.json(data);
    }).catch(err=>{
        res.json({message: err});
    });
});

app.get('/categories', (req,res)=>{
    blogData.getCategories().then((data=>{
        if (data.length > 0)
            res.render(path.join(__dirname, "/views/categories.hbs"), {categories: data});
        else
        res.render(path.join(__dirname, "/views/categories.hbs"), {message: "no results"});
    })).catch(err=>{
        res.render(path.join(__dirname, "/views/categories.hbs"), {message: "no results"});
    });
});

app.get('/categories/add', (req,res)=>{
    res.render(path.join(__dirname, "/views/addCategory.hbs"));
});

app.post('/categories/add', (req, res) => {
    blogData.addCategory(req.body).then(post=>{
        res.redirect("/categories");
    }).catch(err=>{
        res.status(500).send(err);
    })
});

app.get('/categories/delete/:id', (req,res)=>{
    blogData.deleteCategoryById(req.params.id).then(post=>{
        res.redirect("/categories");
    }).catch(err=>{
        res.status(500).send('Unable to remove category (Category not found).');
    })
});

app.get('/posts/delete/:id', (req,res)=>{
    blogData.deletePostById(req.params.id).then(post=>{
        res.redirect("/posts");
    }).catch(err=>{
        res.status(500).send('Unable to remove post (Post not found).');
    })
});

app.use((req,res)=>{
    res.status(404).render(path.join(__dirname, "/views/404.hbs"))
});

blogData.initialize().then(()=>{
    app.listen(HTTP_PORT, () => { 
        console.log('server listening on: ' + HTTP_PORT); 
    });
}).catch((err)=>{
    console.log(err);
});

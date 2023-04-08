/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Maia Hakimi  Student ID: 187568217 Date: April 7, 2023
*
*  Online (Cyclic) Link: https://fantastic-skirt-bee.cyclic.app/
*
********************************************************************************/ 

const express = require('express');
const blogData = require("./blog-service");
const authData = require("./auth-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require("path");
const app = express();
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
const clientSessions = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;

// Setup client-sessions
app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "hakimi_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  }));
  
// Ensures all templates will have access to the "session" object
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

  // Parse application/x-www-form-urlencoded
//   app.use(express.urlencoded({ extended: false }));

// This is a helper middleware function that checks if a user is logged in
// we can use it in any route that we want to protect against unauthenticated access.
// A more advanced version of this would include checks for authorization as well after
// checking if the user is authenticated
function ensureLogin(req, res, next) {
    console.log(`data: ${req.session.data}`);
    console.log(`ensureLogin session: ${req.session}`);
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
}

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

app.get('/posts', ensureLogin, (req,res)=>{

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

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req,res)=>{

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

app.get('/posts/add', ensureLogin, (req,res)=>{
    blogData.getCategories().then(data=>{
        res.render(path.join(__dirname, "/views/addPost.hbs"), {categories: data});
    }).catch(err=>{
        res.render(path.join(__dirname, "/views/addPost.hbs"), {categories: []});
    })
}); 

app.get('/post/:id', ensureLogin, (req,res)=>{
    blogData.getPostById(req.params.id).then(data=>{
        res.json(data);
    }).catch(err=>{
        res.json({message: err});
    });
});

app.get('/categories', ensureLogin, (req,res)=>{
    blogData.getCategories().then((data=>{
        if (data.length > 0)
            res.render(path.join(__dirname, "/views/categories.hbs"), {categories: data});
        else
        res.render(path.join(__dirname, "/views/categories.hbs"), {message: "no results"});
    })).catch(err=>{
        res.render(path.join(__dirname, "/views/categories.hbs"), {message: "no results"});
    });
});

app.get('/categories/add', ensureLogin, (req,res)=>{
    res.render(path.join(__dirname, "/views/addCategory.hbs"));
});

app.post('/categories/add', ensureLogin, (req, res) => {
    blogData.addCategory(req.body).then(post=>{
        res.redirect("/categories");
    }).catch(err=>{
        res.status(500).send(err);
    })
});

app.get('/categories/delete/:id', ensureLogin, (req,res)=>{
    blogData.deleteCategoryById(req.params.id).then(post=>{
        res.redirect("/categories");
    }).catch(err=>{
        res.status(500).send('Unable to remove category (Category not found).');
    })
});

app.get('/posts/delete/:id', ensureLogin, (req,res)=>{
    blogData.deletePostById(req.params.id).then(post=>{
        res.redirect("/posts");
    }).catch(err=>{
        res.status(500).send('Unable to remove post (Post not found).');
    })
});

app.get('/login', (req, res) => {
    res.render(path.join(__dirname, "/views/login.hbs"));
})


app.get('/register', (req, res) => {
    res.render(path.join(__dirname, "/views/register.hbs"));
})

app.post('/register', (req, res) => {
    authData.registerUser(req.body).then(post=>{
        res.render(path.join(__dirname, "/views/register.hbs"), {successMessage: "User created"});
    }).catch(err=>{
        res.render(path.join(__dirname, "/views/register.hbs"), {errorMessage: err, userName: req.body.userName});
    })
})

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then(user => {
        console.log(`User: ${user.userName}`);
        req.session.data=true;
        // if (!req.session.user) req.session.user = {};
        req.session.user = {
            userName: user.userName, // authenticated user's userName
            email: user.email, // authenticated user's email
            loginHistory: user.loginHistory // authenticated user's loginHistory
        };
        console.log(`Login: ${req.session.user}`);
    
        res.redirect('/posts');
    }).catch((err) => {
        console.log(err);
        res.render(path.join(__dirname, "/views/login.hbs"), {errorMessage: err, userName: req.body.userName});
    });    
})

app.get('/logout', (req, res) => {
    req.session.reset();    // reset the session
    res.redirect('/');
})


app.get('/userHistory', ensureLogin, (req, res) => {
    res.render(path.join(__dirname, "/views/userHistory.hbs"));
})



app.use((req,res)=>{
    res.status(404).render(path.join(__dirname, "/views/404.hbs"))
});

blogData.initialize()
    .then(authData.initialize)
    .then(()=>{
        app.listen(HTTP_PORT, () => { 
            console.log('server listening on: ' + HTTP_PORT); 
    });
}).catch((err)=>{
    console.log(err);
});

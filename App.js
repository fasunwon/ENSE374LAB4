// other requires
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { runInNewContext } = require("vm");
const Mongoose  = require("mongoose");

// new requires for passport
const session = require("express-session")
const passport = require("passport")
// configure passportLocalMongoose
const passportLocalMongoose = require("passport-local-mongoose")
// app.use statements
const app = express();

app.use(express.static("css"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

const registerKey = "123456"; // secure!
// set up session
// app.use(session({
//     secret: process.env.SECRET, 
//     resave: false,              
//     saveUninitialized: false
// }));
app.use(passport.initialize());
app.use(passport.session());

Mongoose.connect('mongodb://localhost:27017/testdb',{useNewUrlParser:true,
                    useUnifiedTopology:true});

const userSchema = new Mongoose.Schema({
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);
const User = Mongoose.model("User", userSchema);

const taskSchema = new Mongoose.Schema({
    _id: Mongoose.Schema.Types.ObjectId,
    name: String,
    owner: [{id: Mongoose.Schema.Types.ObjectId, ref: userSchema}],
    creator:[{id: Mongoose.Schema.Types.ObjectId, ref: userSchema}],
    done: Boolean,
    cleared:Boolean
});

const Task = Mongoose.model("Task",taskSchema);
// more passport-local-mongoose config
// create a strategy for storing users with Passport
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function saveToJson (fileName, obj) {
    fs.writeFileSync(fileName, JSON.stringify(obj), "utf8",  function(err) {
        if (err) return console.log(err);
    });
}

function loadFromJSON (fileName) {
    let fileContents = fs.readFileSync(fileName, "utf8", function(err) {
        if (err) return console.log(err);
    });
    let fileObject = JSON.parse(fileContents);
    return fileObject;
}

let userList = userSchema;
let taskList = taskSchema;

function loadUsers() {
    userList = loadFromJSON (__dirname + "/users.json");
}
function saveUsers() {
    saveToJson (__dirname + "/users.json", userList);
}
function loadTasks() {
    taskList = loadFromJSON (__dirname + "/tasks.json");
}
function saveTasks() {
    saveToJson (__dirname + "/tasks.json", taskList);
}

app.listen(2000, function () {
    console.log("Server started on port 2000");
})

app.get("/", function (req, res) {
    res.render("login", { test: "Prototype" });
});

app.post("/register", function (req, res) {
    saveUsers();
    console.log("Registering a new user");
    // calls a passport-local-mongoose function for registering new users
    // expect an error if the user already exists!
    User.register({username: req.body.username}, req.body.password, registerKey, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/")
        } else {
            // authenticate using passport-local
            passport.authenticate("local")(req, res, function(){
                res.redirect(307, "/todo")
            });
        }
    });
});

app.post("/login", function (req, res) {
    //loadUsers();
    // create a user
    const user = new User ({
        username: req.body.username,
        password: req.body.password
     });
     
     // try to log them in
    req.login (user, function(err) {
        if (err) {
            // failure
            console.log(err);
            res.redirect("/")
        } else {
            // success
            // authenticate using passport-local
            passport.authenticate("local")(req, res, function() {
                res.redirect(307, "/todo"); 
            });
        }
    });
});

app.post("/todo", function (req, res) {
    loadTasks();
    loadUsers();
        res.render("todo", {
            username: req.body.username,
            items: taskList
        });
        
})

app.get("/logout", function (req, res) {
    console.log("A user logged out")
    req.logout();
    res.redirect("/");
});

app.post("/addtask", function (req, res) {
    const user = new User ({
        username: req.body.username,
     });
    for (user of userList){
        if (user === req.body.username) {
            taskList.add(new Task(taskList.length,
                                   req.body.newTask,
                                   undefined,
                                   user,
                                   false,
                                   false));
            saveTasks();
            res.redirect(307, "/todo");
        }
    }
});

app.post("/claim", function (req, res) {
    console.log(req.body);
    for (user of userList){
        if (user.username === req.body.username) {
            for (task of taskList) {
                if(task._id === parseInt(req.body.taskId)) {
                    task.owner = user;
                    saveTasks();
                    res.redirect(307, "/todo");
                }
            }
        }
    }
})

app.post("/abandonorcomplete", function (req, res) {
    if (req.body.checked === "on") {
        for (task of taskList) {
            if(task._id === parseInt(req.body.taskId)) {
                task.done = true;
                saveTasks();
                res.redirect(307, "/todo");
            }
        }
    } else {
        // you are "user"
        for (task of taskList) {
            if(task._id === parseInt(req.body.taskId)) {
                task.owner = undefined;
                saveTasks();
                res.redirect(307, "/todo");
            }
        }
    }
});

app.post("/unfinish", function (req, res) {
    for (task of taskList) {
        if(task._id === parseInt(req.body.taskId)) {
            task.done = false;
            saveTasks();
            res.redirect(307, "/todo");
        }
    }
});

app.post("/purge", function (req, res) {
    for (task of taskList) {
        if(task.done === true) {
            task.cleared = true;
        }
    }
    saveTasks();
    res.redirect(307, "/todo");
});
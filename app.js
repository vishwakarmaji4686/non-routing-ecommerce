const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");


/** 
 * set template engine
 */
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));

/** 
 * START : Create Mysql Connection
 */
const connection = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'shop24'
    }
);
/* check mysql connection */
connection.connect(function (error) {
    if (error) {
        console.log("Unable to connect with Databse", error);
    } else {
        console.log("Databse connected");
    }
});
/** 
 * END : Create Mysql Connection
 */

app.get('/', function (req, res) {
    let pageInfo = {
        title: "Shop Page",
        firstName: "Rock",
        lastName: "Johnson",
        pageName: 'home',
    };
    console.log(pageInfo, pageInfo.title);
    res.render('template', pageInfo);
});

app.get('/about', function (req, res) {
    let pageInfo = {
        title: "About Us",
        pageName: 'about',
    }
    res.render("template", pageInfo);
});

app.get('/register', function (req, res) {
    console.log("GET method Registration url");
    let pageInfo = {
        title: "Registration",
        pageName: 'register',
    };
    res.render("template", pageInfo);
});

app.get('/all-users', async function (req, res) {
    try {
        let pageInfo = {
            title: "All Registered Users",
            pageName: 'all-users',
            users: []
        };
        const allUsers = await getAllUsers();
        pageInfo.users = allUsers;
        res.render("template", pageInfo);
    } catch (error) {
        console.log("All users page Errro :::", error);
    }
});

async function getAllUsers() {
    return new Promise(function (resolve, reject) {
        connection.query("SELECT * FROM users", function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

app.get('/login', function (req, res) {
    let pageInfo = {
        title: "Registration",
        pageName: 'login',
    };
    res.render("template", pageInfo);
});

app.post('/login', function (req, res) {
    console.log("req.body", req.body);
    const username = req.body.username;
    const password = req.body.password;
    console.log("password", password, username);
    const getUser = `SELECT * FROM users WHERE email='${username}'`;
    console.log("getUser", getUser);
    console.log("STEP : 111111111111111111111111111");
    connection.query(getUser, function (error, result) {
        console.log("STEP : 22222222222222222222222222");
        if (error) {
            console.log("Database Query Error::::", error);
        } else {
            console.log("result", result);
        }
    });
    console.log("STEP : 333333333333333333333333");
});

app.post('/register', function (req, res) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const pincode = req.body.pincode;
    const email = req.body.userEmail;
    const contact = req.body.contact;
    const dob = req.body.dob;
    const gender = req.body.gender;
    const hobbies = req.body.hobbies;
    const address = req.body.address;
    const password = req.body.password;
    const insertUser = `INSERT INTO users(first_name, last_name, email, dob, gender, hobbies, pincode, address, contact, password) VALUES ('${firstName}', '${lastName}', '${email}', '${dob}', '${gender}', '${hobbies}', '${pincode}', '${address}', '${contact}', '${password}')`;
    connection.query(insertUser, function (error, result) {
        if (error) {
            console.log("Databse Query Error", error);
        } else {
            console.log("result", result);
            res.redirect('/login');
        }
    });
});

/** 
 * Start : Admin UI
 */

app.get('/admin', function (req, res) {
    let page = {
        title: "",
        pageName: "home"
    }
    res.render('admin/template', page);
});

app.get('/admin/products', function (req, res) {
    let page = {
        title: "",
        pageName: "product"
    }
    res.render('admin/template', page);
});

/** 
 * End : Admin UI
 */

const port = 3001;
app.listen(port, function () {
    console.log(`Server started at ${port}`);
});
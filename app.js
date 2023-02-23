const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const fileupload = require("express-fileupload");

/** 
 * set template engine
 */
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload());




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

app.get('/', async function (req, res) {
    try {
        let pageInfo = {
            title: "Shop Page",
            firstName: "Rock",
            lastName: "Johnson",
            pageName: 'home',
            products: []
        };
        let allproducts = await getAllProducts();
        pageInfo.products = allproducts;
        console.log(pageInfo, pageInfo.title);
        res.render('template', pageInfo);
    } catch (error) {
        console.log("User : home page :: ", error);
    }
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

app.get('/admin/products', async function (req, res) {
    try {
        let page = {
            title: "",
            pageName: "product"
        }
        let products = await getAllProducts();
        page.products = products;
        console.log("page", page);
        res.render('admin/template', page);
    } catch (error) {
        console.log("error", error);
    }
});

app.post("/admin/product", async function (req, res) {
    try {
        let product = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            category: req.body.category,
            featured: (req.body.featured && req.body.featured == 'no') ? 0 : 1,
        };
        console.log("product", product);
        let allImages = [];

        /* for image name change */
        if (req.files && req.files.productImages) {
            if (req.files.productImages.length > 0) {
                for (let i = 0; i < req.files.productImages.length; i++) {
                    let singleImage = req.files.productImages[i];
                    console.log("singleImage :: ", i, singleImage);
                    let imageNewName = await uploadImage(singleImage);
                    console.log("\n\n ************** imageNewName", imageNewName);
                    allImages.push(imageNewName);
                }
            } else {
                let imageNewName = await uploadImage(req.files.productImages);
                allImages.push(imageNewName);
            }
            console.log("\n\n ***** All Images", allImages);
            let uploadImages = allImages.toString(',');
            product.images = uploadImages;
        }
        await insertProduct(product);
        res.redirect('/admin/products');
        console.log("\n\n product", product);
    } catch (error) {
        console.log("Errror", error);
    }
});
/* image name change */
async function uploadImage(singleImage) {
    return new Promise(function (resolve, reject) {
        let imageNameArr = singleImage.name.split('.');
        let imgExtension = imageNameArr.splice(-1).toString();
        console.log("imageNameArr", imgExtension);

        let currentDate = new Date();

        let randomNumber = Math.round(Math.random(99, 99999) * 10000);
        let imgNewName = currentDate.getTime() + "________" + randomNumber + "." + imgExtension;
        console.log("imgNewName", imgNewName);

        let uploadPath = __dirname + "/public/product_images/" + imgNewName;
        singleImage.mv(uploadPath, function (error) {
            if (error) {
                console.log("Unable to upload Image", error);
                reject(error);
            } else {
                resolve(imgNewName);
            }
        });
    });
}
/* send deta */
async function insertProduct(product) {
    return new Promise(function (resolve, reject) {
        let addNewProQry = `INSERT INTO products(title, description, quantity, price, category, images, featured) VALUES('${product.title}', '${product.description}', '${product.quantity}', '${product.price}', '${product.category}', '${product.images}', '${product.featured}')`;
        connection.query(addNewProQry, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}
/* get data */
async function getAllProducts() {
    return new Promise(function (resolve, reject) {
        let addNewProQry = `SELECT * FROM products`;
        connection.query(addNewProQry, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * End : Admin UI
 */

const port = 3001;
app.listen(port, function () {
    console.log(`Server started at ${port}`);
});
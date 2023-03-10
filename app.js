const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const mysql = require("mysql");
const fileupload = require("express-fileupload");
const expressSession = require("express-session");

/** 
 * set template engine
 */
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(fileupload());
app.use(expressSession({
    secret: "shop24",
    saveUninitialized: false,
    resave: false,
}));



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
            products: [],
            isUserLoggedIn: false
        };
        if (req.session.isUserLoggedIn) {
            pageInfo.isUserLoggedIn = true;
        }
        let allproducts = await getAllProducts();
        pageInfo.products = allproducts;
        console.log(pageInfo, pageInfo.title);
        console.log("req.session.cartItems", req.session.cartItems);
        res.render('template', pageInfo);
    } catch (error) {
        console.log("User : home page :: ", error);
    }
});

app.get('/about', function (req, res) {
    let pageInfo = {
        title: "About Us",
        pageName: 'about',
        isUserLoggedIn: false
    }
    if (req.session.isUserLoggedIn) {
        pageInfo.isUserLoggedIn = true;
    }
    res.render("template", pageInfo);
});

app.get('/register', function (req, res) {
    console.log("GET method Registration url");
    let pageInfo = {
        title: "Registration",
        pageName: 'register',
        isUserLoggedIn: false,
    };
    if (req.session.isUserLoggedIn) {
        pageInfo.isUserLoggedIn = true;
    }
    res.render("template", pageInfo);
});

app.get('/all-users', async function (req, res) {
    try {
        let pageInfo = {
            title: "All Registered Users",
            pageName: 'all-users',
            users: [],
            isUserLoggedIn: false,
        };
        if (req.session.isUserLoggedIn) {
            pageInfo.isUserLoggedIn = true;
        }
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
        status: "",
        message: "",
        isUserLoggedIn: false,
    };
    if (req.session.isUserLoggedIn) {
        pageInfo.isUserLoggedIn = true;
    }
    if (req.session.status && req.session.message) {
        pageInfo.status = req.session.status;
        pageInfo.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render("template", pageInfo);
});

app.post('/login', async function (req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;
        let user = await getUserByEmaildId(username);
        if (user && user.length > 0) {
            let userInfo = user[0];
            if (userInfo.password == password) {
                req.session.isUserLoggedIn = userInfo.id;
                res.redirect('/');
            } else {
                req.session.status = "Error";
                req.session.message = "Incorrect Password";
                res.redirect('/login');
            }
        } else {
            req.session.status = "Error";
            req.session.message = "Invalid Email Address";
            res.redirect('/login');
        }
    } catch (error) {
        console.log("Login error :: ", error);
    }
});

app.get('/add-to-cart', function (req, res) {
    console.log("req", req.query);
    const proId = req.query.productId;
    console.log("proId", proId);
    let productIds = [];
    if (req.session.cartItems) {
        productIds = req.session.cartItems;
    }
    productIds.push(proId);
    productIds = [...new Set(productIds)];
    req.session.cartItems = productIds;
    res.redirect('/');
});

app.get('/cart', async function (req, res) {
    try {
        let pageInfo = {
            title: "Cart Items",
            pageName: 'cart',
            users: [],
            isUserLoggedIn: false,
            products: [],
        };
        if (req.session.isUserLoggedIn) {
            pageInfo.isUserLoggedIn = true;
        }
        if (req.session.cartItems) {
            let items = req.session.cartItems;
            let ids = items.toString();
            console.log("items", items);
            console.log("ids", ids);
            let products = await getProductByIds(ids);
            console.log("products", products);
            pageInfo.products = products;
        }
        res.render("template", pageInfo);
    } catch (error) {
        console.log("All users page error :::", error);
    }
});

async function getProductByIds(ids) {
    return new Promise(function (resolve, reject) {
        const getProducts = `SELECT * FROM products WHERE id IN(${ids})`;
        console.log("getProducts", getProducts);
        connection.query(getProducts, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * To get user by email address
 */
async function getUserByEmaildId(emailId) {
    return new Promise(function (resolve, reject) {
        const getUser = `SELECT * FROM users WHERE email='${emailId}'`;
        console.log("getUser", getUser);
        console.log("STEP : 111111111111111111111111111");
        connection.query(getUser, function (error, result) {
            console.log("STEP : 22222222222222222222222222");
            if (error) {
                reject(error);
            } else {
                console.log("result", result);
                resolve(result);
            }
        });
    });
}

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
            pageName: "product",
            status: "",
            message: ""
        }
        if (req.session.status && req.session.message) {
            page.status = req.session.status;
            page.message = req.session.message;
            delete req.session.status, req.session.message;
        }
        let products = await getAllProducts();
        page.products = products;
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

/** 
 * Delete Product by Id
 */
app.get('/admin/delete-product', async function (req, res) {
    try {
        console.log("req.query", req.query);
        const productId = req.query.productId;
        console.log("productId", productId);
        await deleteProductById(productId);
        req.session.status = "Success";
        req.session.message = "Product has been deleted";
        res.redirect('/admin/products');
    } catch (error) {
        console.log("Delete product Error ::", error);
    }
});

app.get('/admin/edit-product', async function (req, res) {
    try {
        console.log("req.query", req.query);
        const productId = req.query.productId;
        console.log("productId", productId);
        let page = {
            title: "",
            pageName: "edit-product",
            product: {}
        }
        let product = await getProductById(productId);
        console.log("product", product);
        page.product = product;
        console.log("page", page);
        res.render('admin/template', page);
    } catch (error) {
        console.log("edit product page error", error);
    }
});

/** 
 * Update Product By Id
 */
app.post("/admin/update-product", async function (req, res) {
    try {
        const productId = req.query.productId;
        let product = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            category: req.body.category,
            featured: (req.body.featured && req.body.featured == 'no') ? 0 : 1,
        };
        console.log("product", product, productId);

        let allImages = [];
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
            let uploadImages = allImages.toString(',');
            product.images = uploadImages;
        }
        await updateSingleProduct(productId, product);
        req.session.status = "Success";
        req.session.message = "Product has been updated";
        res.redirect('/admin/products');
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

/* START:: product data update function */
async function updateSingleProduct(productId, product) {
    return new Promise(function (resolve, reject) {
        let addNewProQry = `UPDATE products SET title='${product.title}', description='${product.description}', price='${product.price}', quantity='${product.quantity}', category='${product.category}', featured='${product.featured}'`;

        /** 
         * Update images if images uploaded by admin
         */
        if (product.images) {
            addNewProQry = addNewProQry + `, images='${product.images}'`;
        }
        addNewProQry = addNewProQry + ` WHERE id='${productId}'`;

        console.log("addNewProQry", addNewProQry);

        connection.query(addNewProQry, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
}

/** 
 * Delete product by product Id
 */
async function deleteProductById(proId) {
    return new Promise(function (resolve, reject) {
        let addNewProQry = `DELETE FROM products WHERE id='${proId}'`;
        connection.query(addNewProQry, function (error, result) {
            if (error) {
                reject(error);
            } else {
                console.log("result", result);
                resolve(true);
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
async function getProductById(id) {
    return new Promise(function (resolve, reject) {
        let addNewProQry = `SELECT * FROM products WHERE id='${id}'`;
        connection.query(addNewProQry, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result[0]);
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
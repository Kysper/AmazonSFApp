//Get the npm packages
const inquirer = require("inquirer");
const mysql = require("mysql");
require("dotenv").config();

// setup mysql connection
var connection = mysql.createConnection({
    host: process.env.DB_HOST,

    port: 3306,

    user: process.env.DB_USER,

    password: process.env.DB_PASS,
    database: "bamazon"
})

connection.connect(function (err) {
    if (err) throw err;
    populateInventory();
});

function start() {
    inquirer.prompt([
        {
            type: "input",
            message: "Please select an item from the list using it's ID.",
            name: "getId",
            validate: function (value) {
                if (isNaN(value) === false) {
                    return true;
                }
                return false;
            }
        },

        {
            type: "input",
            message: "How many units would you like to buy?",
            name: "units",
            validate: function (value) {
                if (isNaN(value) === false) {
                    return true;
                }
                return false;
            }
        }
    ]).then(answer => {
        getProduct(answer);
    });
}

function updateProduct(answer) {
    connection.query("SELECT stock_quantity FROM products WHERE item_id=" + answer.getId, function (err, res) {
        if (err) {
            console.log("Database error");
            throw err;
        }
        if (res.length == 0) {
            console.log("ID not found");
        }

        stockAmount = res[0].stock_quantity;

        if (stockAmount > answer.units) {


            connection.query("UPDATE products SET stock_quantity=stock_quantity - " + answer.units + " WHERE ?", { item_id: answer.getId }, function (err, res) {
                if (err) throw err;

                connection.query(" SELECT product_name, price,stock_quantity FROM products WHERE item_id=" + answer.getId, function (err, res) {
                    if (err) throw err;
                    res.forEach(item => {

                        console.log(`\nTransaction Complete. You bought ${answer.units} ${item.product_name}'s for a total of ${item.price * answer.units} and there's ${item.stock_quantity} left`);
                        inquirer.prompt([{ type: "list", message: "Would you like to view the list of items", choices: ["yes", "no"],name:"getChoice" }]).then(answer => {
                            if (answer.getChoice === "Yes") {
                                populateInventory();
                            } else {
                                process.exit();
                            }
                        });

                    });
                });
            });

        } else { 
            console.log("Not enough stock!");
            process.exit();
     }
    });

}
function getProduct(answer) {
    if (answer.getId) {
        connection.query("SELECT * FROM products WHERE ?", { item_id: answer.getId }, function (err, res) {
            if (err) {
                console.log("Item not found!");
                start();
            }
            console.log("Item Found!");
            res.forEach(item => {
                console.log(`ID: ${item.item_id} | Name: ${item.product_name} | Department: ${item.department_name} | Price: ${item.price} | In Stock: ${item.stock_quantity}`);
            });
        });
        updateProduct(answer);
    }
}
function populateInventory() {
    console.log("Retrieving inventory please hold...");
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        res.forEach(element => {
            console.log(`ID: ${element.item_id} | Name: ${element.product_name} | Department: ${element.department_name} | Price: ${element.price} | In Stock: ${element.stock_quantity}`);
        });
        console.log("\n");
        start();
    });
}

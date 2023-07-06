const express = require("express");
const cors = require("cors");
const client = require("../Database.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(cors());

const accountSid = 'AC71f5995b8a6367cc0d4368e54b39e94f';
const authToken = '06f0b0626eeaaca6c4bf7d8d572c9017';
const clients = twilio(accountSid, authToken);

const port = 5000;

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const data = await client.query(`SELECT * FROM user_details WHERE email= $1;`, [email]); //Checking if user already exists
        const arr = data.rows;

        if (arr.length != 0) {
            return res.status(400).json({
                error: "Email already there, No need to register again.",
            });
        }
        else {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err)
                    res.status(err).json({
                        error: "Server error",
                    });

                const user = {
                    username,
                    email,
                    password: hash,
                };
                var flag = 1; //Declaring a flag

                //Inserting data into the database

                client
                    .query(`INSERT INTO user_details (username, email, password) VALUES ($1,$2,$3);`, [user.username, user.email, user.password], (err) => {

                        if (err) {
                            flag = 0; //If user is not inserted is not inserted to database assigning flag as 0/false.
                            console.error(err);
                            return res.status(500).json({
                                error: "Database error"
                            })
                        }
                        else {
                            flag = 1;
                            res.status(200).json({ message: 'User Register Successfully' });
                        }
                    })
                // if (flag) {
                //   const token = jwt.sign( //Signing a jwt token
                //     {
                //       email: user.email
                //     },
                //     process.env.SECRET_KEY
                //   );
                // };
            });
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Database error while registring user!", //Database connection error
        });
    };
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const data = await client.query(`SELECT * FROM user_details WHERE email= $1;`, [email]) //Verifying if the user exists in the database
        console.log("data", data);
        const user = data.rows;

        //console.log("Row",user[0]);

        console.log("User", user);
        if (user.length === 0) {
            res.status(400).json({
                error: "User is not registered, Sign Up first",
            });
        }
        else {
            bcrypt.compare(password, user[0].password, (err, result) => { //Comparing the hashed password
                if (err) {
                    res.status(500).json({
                        error: "Server error",
                    });
                } else if (result === true) {


                    const token = jwt.sign(
                        { email: email },
                        'Ramdom_Token',
                        { expiresIn: '1h' }
                    );
                    const name = user[0].username; // Retrieve the username from the database

                    console.log("Username", name);
                    console.log("Token", token);


                    res.status(200).json({
                        message: "User signed in!",
                        token: token,
                        username: name
                    });
                }
                else {
                    //Declaring the errors
                    if (result != true)
                        res.status(400).json({
                            error: "Enter correct password!",
                        });
                }
            })
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Database error occurred while signing in!", //Database connection error
        });
    };
})

app.post("/forget", async (req, res) => {
    const s = req.body.conformpassword;
    console.log("S", s);
    const password = req.body.conformpassword;
    const email = req.body.email;

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const query = `UPDATE user_details SET password = $1 WHERE email = $2`;
        await client.query(query, [hashedPassword, email]);

        console.log("Password reset successful");
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
})


app.get("/store", (req, res) => {

    try {
        client.query('SELECT * FROM Shop', (error, result) => {
            if (error) {
                console.error('Error fetching shop names:', error);
                res.status(500).send('Error fetching shop names');
            } else {


                const shopNames = result.rows.map((row) => ({
                    name: row.shop_name, owner: row.shop_owner,
                    phone: row.shop_phone
                }));
                //console.log("Shop", shopNames);
                res.json(shopNames);


            }
        });

    }
    catch (err) {

    }



})

app.post("/todo", async (req, res) => {
    const { Username, Email, Password } = req.body;

    //console.log("Data", Username);


    try {
        await client.query(`INSERT INTO Employee (emp_name, emp_email, emp_password) VALUES ($1,$2,$3);`, [Username, Email, Password], (err) => {
            if (err) {
                console.log("Insert Error");
            }
            else {
                //console.log("ToDo Added suceessfully");
            }
        })

        res.status(200).json({ message: "ToDo Added suceessfully" })

    }
    catch (error) {

        console.log('Data connection error');

    }


})

app.get("/get-todo", async (req, res) => {
    //console.log("Gettodo");
    try {

        const query = 'SELECT * FROM Employee';
        const data = await client.query(query);

        console.log("Data", data);

        const emp = data.rows;
        console.log("Emp", emp);

        res.json({ emp: emp })

    }
    catch (err) {
        console.log("Fetched error");

    }
})




app.delete("/delete/:empName", async (req, res) => {
    const empName = req.params.empName;

    //console.log("Emp", empName);

    try {
        await client.query("DELETE FROM Employee WHERE Emp_name = $1", [empName]);

        console.log("Delete successfully");
        res.json({ message: "Record deleted successfully" });
    } catch (error) {
        console.log("Error in delete:", error);
        res.status(500).json({ error: "An error occurred while deleting the record" });
    }
});

app.post("/send", async (req, res) => {
    console.log("Hiiii");
    const msg = "Hiii";
    const p = '+916380862377';

    try {
        await clients.messages.create({
            body: msg,
            from: '+12179968428',
            to: p
        });

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to send message');
    }
})




app.put("/update/:emp_name", async (req, res) => {
    const empName = req.params.emp_name;
    const { Email, Password } = req.body;

    console.log("Email",Email);
  
    try {
      await client.query(
        "UPDATE employee SET Emp_email = $1, Emp_password = $2 WHERE Emp_name = $3",
        [Email,Password, empName]
      );
  
      console.log("Update successfully");
      res.json({ message: "Todo updated successfully" });
    } catch (error) {
      console.log("Error in update:", error);
      res.status(500).json({ error: "An error occurred while updating the todo" });
    }
  });


app.listen(port, () => {
    console.log(`Server listening port number ${port}`);
})

client.connect();

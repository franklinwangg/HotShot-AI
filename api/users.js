const { Client } = require('pg');
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Send success status
  }
  
  else if (req.method === "POST") {
    const { action } = req.query;

    console.log("in post");
    if (action === "login") {
      console.log("going to handle login")

      await handleLogin(req, res);
    } else {
      console.log("going to handle register")
      await handleRegister(req, res);
    }
  } 
  else {
    // res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// Login handler
async function handleLogin(req, res) {
  console.log("inside handleLogin now");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING_2,
  });

  try {
    await client.connect();

    const result = await client.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    if (isMatch) {
      res.status(200).json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  } finally {
    await client.end();
  }
}

// Register handler
async function handleRegister(req, res) {
  console.log("inside handleRegister now");
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING_2,
  });

  try {
    await client.connect();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await client.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  } finally {
    await client.end();
  }
}

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get("/", (req, res) => {
  res.send("API running");
});

// Save calculation
app.post("/calculate", async (req, res) => {
  const { expression, result } = req.body;

  try {
    const query = `
      INSERT INTO calculations (expression, result)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const saved = await pool.query(query, [expression, result]);
    console.log("Saved calculation:", saved.rows[0]);
    res.json(saved.rows[0]);
  } catch (err) {
    console.error("Database error full details:", err); // <--- full error
    res.status(500).json({ error: "Database error", details: err.message });
  }
});


// Get history
app.get("/calculations", async (req, res) => {
  const data = await pool.query(
    "SELECT * FROM calculations ORDER BY created_at DESC LIMIT 10"
  );
  res.json(data.rows);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

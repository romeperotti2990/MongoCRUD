require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// PostgreSQL connection pool
const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    database: process.env.DB_NAME     || 'postgres',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

// Allowed sort columns (prevents SQL injection)
const ALLOWED_SORT_COLUMNS = {
    id:        'id',
    firstName: 'first_name',
    lastName:  'last_name',
    email:     'email',
    age:       'age',
};

// Create table and seed 10 default users if table is empty
async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name  VARCHAR(100) NOT NULL,
                email      VARCHAR(255) NOT NULL,
                age        INTEGER      NOT NULL
            )
        `);

        const { rows } = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(rows[0].count) === 0) {
            await client.query(`
                INSERT INTO users (first_name, last_name, email, age) VALUES
                ('John',    'Doe',       'john.doe@example.com',       25),
                ('Jane',    'Smith',     'jane.smith@example.com',     30),
                ('Alice',   'Johnson',   'alice.johnson@example.com',  28),
                ('Bob',     'Williams',  'bob.williams@example.com',   35),
                ('Charlie', 'Brown',     'charlie.brown@example.com',  22),
                ('Diana',   'Miller',    'diana.miller@example.com',   27),
                ('Edward',  'Davis',     'edward.davis@example.com',   40),
                ('Fiona',   'Garcia',    'fiona.garcia@example.com',   33),
                ('George',  'Martinez',  'george.martinez@example.com',29),
                ('Hannah',  'Rodriguez', 'hannah.rodriguez@example.com',26)
            `);
            console.log('Database seeded with 10 default users');
        }

        console.log('Connected to PostgreSQL and table ready');
    } finally {
        client.release();
    }
}

// Helper: map DB row to API-friendly object
function toUser(row) {
    return {
        id:        row.id,
        firstName: row.first_name,
        lastName:  row.last_name,
        email:     row.email,
        age:       row.age,
    };
}

// GET all users — supports ?search=&sortBy=&order=
app.get('/api/users', async (req, res) => {
    try {
        const { search, sortBy, order } = req.query;

        let query  = 'SELECT * FROM users';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1`;
        }

        const col = ALLOWED_SORT_COLUMNS[sortBy] || 'id';
        const dir = order === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${col} ${dir}`;

        const { rows } = await pool.query(query, params);
        res.json(rows.map(toUser));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(toUser(rows[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new user
app.post('/api/users', async (req, res) => {
    try {
        const { firstName, lastName, email, age } = req.body;
        if (!firstName || !lastName || !email || age == null) {
            return res.status(400).json({ error: 'firstName, lastName, email, and age are required' });
        }
        const { rows } = await pool.query(
            'INSERT INTO users (first_name, last_name, email, age) VALUES ($1, $2, $3, $4) RETURNING *',
            [firstName, lastName, email, parseInt(age)]
        );
        res.status(201).json(toUser(rows[0]));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update existing user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, age } = req.body;
        if (!firstName || !lastName || !email || age == null) {
            return res.status(400).json({ error: 'firstName, lastName, email, and age are required' });
        }
        const { rows } = await pool.query(
            `UPDATE users
             SET first_name = $1, last_name = $2, email = $3, age = $4
             WHERE id = $5
             RETURNING *`,
            [firstName, lastName, email, parseInt(age), req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(toUser(rows[0]));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

initDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialise database:', err.message);
        process.exit(1);
    });

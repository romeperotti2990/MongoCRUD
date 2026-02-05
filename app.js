const express = require('express');
const mongoose = require('mongoose');
const dbURL = 'mongodb://localhost:27017/mtec';
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(dbURL);
const db = mongoose.connection;
db.on('error', (err) => console.error('Connection error:', err));

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    password: String,
    role: String
});

const User = mongoose.model('User', userSchema);

// Seed database with 10 default users (runs only if no users exist)
async function seedDatabase() {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            const defaultUsers = [
                { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', age: 25, password: 'pass123', role: 'user' },
                { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', age: 30, password: 'pass456', role: 'admin' },
                { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@example.com', age: 28, password: 'pass789', role: 'user' },
                { firstName: 'Bob', lastName: 'Williams', email: 'bob.williams@example.com', age: 35, password: 'pass012', role: 'user' },
                { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@example.com', age: 22, password: 'pass345', role: 'user' },
                { firstName: 'Diana', lastName: 'Miller', email: 'diana.miller@example.com', age: 27, password: 'pass678', role: 'moderator' },
                { firstName: 'Edward', lastName: 'Davis', email: 'edward.davis@example.com', age: 40, password: 'pass901', role: 'user' },
                { firstName: 'Fiona', lastName: 'Garcia', email: 'fiona.garcia@example.com', age: 33, password: 'pass234', role: 'user' },
                { firstName: 'George', lastName: 'Martinez', email: 'george.martinez@example.com', age: 29, password: 'pass567', role: 'admin' },
                { firstName: 'Hannah', lastName: 'Rodriguez', email: 'hannah.rodriguez@example.com', age: 26, password: 'pass890', role: 'user' }
            ];
            await User.insertMany(defaultUsers);
            console.log('Database seeded with 10 default users');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

db.once('open', async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
});

// API Routes

// GET all users with optional search and sort
app.get('/api/users', async (req, res) => {
    try {
        const { search, sortBy, order } = req.query;
        let query = {};

        // Search functionality - search by firstName and/or lastName
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        let sortObj = {};
        if (sortBy) {
            sortObj[sortBy] = order === 'desc' ? -1 : 1;
        }

        const users = await User.find(query).sort(sortObj);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new user
app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update existing user
app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
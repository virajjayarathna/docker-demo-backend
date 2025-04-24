const express = require('express');
const cors = require('cors');
const redis = require('redis');
const { promisify } = require('util');

const app = express();
app.use(cors());
app.use(express.json());

// Redis client setup - connects to the redis container
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'redis', // Use the service name from docker-compose
  port: 6379
});

// Convert redis callback-based methods to promise-based
const hgetall = promisify(redisClient.hgetall).bind(redisClient);
const hset = promisify(redisClient.hset).bind(redisClient);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// API endpoints
app.get('/api/items', async (req, res) => {
  try {
    const items = await hgetall('items') || {};
    res.json(Object.entries(items).map(([id, value]) => ({ id, value })));
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const id = Date.now().toString();
    await hset('items', id, value);
    
    res.status(201).json({ id, value });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
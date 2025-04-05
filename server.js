// server.js - Express server for handling Notion API requests
const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views', 'index.html'));
});

// API endpoint for Notion search
app.post('/api/notion/search', async (req, res) => {
  try {
    const { query = '', pageSize = 10 } = req.body;
    
    // Create request payload
    // If query is empty, we'll still search but will get all accessible content
    const payload = {
      page_size: pageSize
    };
    
    // Only add query parameter if it's not empty
    if (query.trim() !== '') {
      payload.query = query;
    }
    
    // Make request to Notion API
    const response = await axios.post(
      'https://api.notion.com/v1/search', 
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return the search results
    res.json(response.data);
    
  } catch (error) {
    console.error('Error searching Notion:', error.response?.data || error.message);
    
    // Send appropriate error response
    res.status(error.response?.status || 500).json({
      error: 'Failed to search Notion',
      details: error.response?.data?.message || error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});


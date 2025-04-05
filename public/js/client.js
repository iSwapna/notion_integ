/// public/js/notion-client.js - Client-side code for Notion search interface

document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners when the DOM is fully loaded
  document.getElementById('search-button').addEventListener('click', searchNotionAndDisplayResults);
  
  // Allow searching by pressing Enter in the search input
  document.getElementById('search-input').addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          searchNotionAndDisplayResults();
      }
  });
  
  // Automatically load search results when page loads
  loadInitialResults();
});

/**
* Load initial search results when the page loads
*/
async function loadInitialResults() {
  try {
      // Show loading indicator
      document.getElementById('results-container').innerHTML = 
          '<p class="loading">Loading Notion content...</p>';
      
      // Search with empty query to load all accessible content
      const searchResponse = await searchNotion('');
      
      // Convert results to HTML table
      const htmlTable = convertNotionSearchToHTML(searchResponse);
      
      // Display results
      document.getElementById('results-container').innerHTML = htmlTable;
  } catch (error) {
      document.getElementById('results-container').innerHTML = 
          `<p class="error">Error loading initial results: ${error.message}</p>`;
  }
}

/**
* Send search request to our server API
* @param {string} query - Search query
* @param {number} pageSize - Number of results to return
* @returns {Promise<Object>} - Notion search response
*/
async function searchNotion(query, pageSize = 10) {
  try {
      const response = await fetch('/api/notion/search', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              query: query,
              pageSize: pageSize
          })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || `Server error: ${response.status}`);
      }

      return await response.json();
  } catch (error) {
      console.error('Error searching Notion:', error);
      throw error;
  }
}

/**
* Converts Notion search API response to HTML table
* @param {Object} notionSearchResponse - Response from notion.search API
* @returns {string} HTML table representation of search results
*/
function convertNotionSearchToHTML(notionSearchResponse) {
  // Extract results from the response
  const results = notionSearchResponse.results || [];
  
  if (results.length === 0) {
      return '<p>No results found.</p>';
  }
  
  // Start building the HTML table
  let html = `
  <table>
      <thead>
          <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Created</th>
              <th>Last Edited</th>
              <th>URL</th>
          </tr>
      </thead>
      <tbody>
  `;
  
  // Process each result
  results.forEach(result => {
      // Extract object type
      const objectType = result.object || 'unknown';
      
      // Extract title based on object type
      let title = 'Untitled';
      
      if (objectType === 'page') {
          // Handle different page title properties based on the page structure
          if (result.properties && result.properties.title) {
              const titleArray = result.properties.title?.title || [];
              title = titleArray.map(t => t.plain_text).join('') || 'Untitled';
          } else if (result.properties && result.properties.Name) {
              // Some pages use "Name" as the title property
              const titleArray = result.properties.Name?.title || [];
              title = titleArray.map(t => t.plain_text).join('') || 'Untitled';
          } else if (result.title) {
              // Handle older API format
              title = Array.isArray(result.title) ? 
                  result.title.map(t => t.plain_text).join('') : 
                  'Untitled';
          }
      } else if (objectType === 'database') {
          title = result.title?.[0]?.plain_text || 'Untitled Database';
      }
      
      // Format dates
      const created = new Date(result.created_time).toLocaleString();
      const lastEdited = new Date(result.last_edited_time).toLocaleString();
      
      // Generate URL
      const url = result.url || '#';
      
      // Add row to table
      html += `
      <tr>
          <td>${escapeHTML(title)}</td>
          <td>${capitalizeFirstLetter(objectType)}</td>
          <td>${created}</td>
          <td>${lastEdited}</td>
          <td><a href="${url}" target="_blank">Open in Notion</a></td>
      </tr>
      `;
  });
  
  // Close the table
  html += `
      </tbody>
  </table>
  `;
  
  return html;
}

/**
* Helper function to escape HTML special characters
*/
function escapeHTML(str) {
  return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

/**
* Helper function to capitalize the first letter of a string
*/
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
* Main function to search Notion and display results
*/
async function searchNotionAndDisplayResults() {
  try {
      // Get search query from input field
      const searchQuery = document.getElementById('search-input').value;
      
      // Show loading indicator
      document.getElementById('results-container').innerHTML = 
          '<p class="loading">Searching Notion...</p>';
      
      // Perform search through our server API
      const searchResponse = await searchNotion(searchQuery);
      
      // Convert results to HTML table
      const htmlTable = convertNotionSearchToHTML(searchResponse);
      
      // Display results
      document.getElementById('results-container').innerHTML = htmlTable;
  } catch (error) {
      document.getElementById('results-container').innerHTML = 
          `<p class="error">Error: ${error.message}</p>`;
  }
}
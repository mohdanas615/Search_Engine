import React, { useEffect, useState } from 'react';
import './App.css'; // Import the CSS file

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [originalResults, setOriginalResults] = useState([]); // Store original results for filtering
  const [contentType, setContentType] = useState(''); // State for content type
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term: searchTerm }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setOriginalResults(data);
    } catch (error) {
      console.error('Error fetching search results', error);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300); // 300ms delay

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch();
    } else {
      setResults(originalResults); // Reset results if search term is empty
    }
  }, [searchTerm]); // Search when searchTerm changes

  const handleFilter = (event) => {
    const selectedType = event.target.value;
    setContentType(selectedType); // Update the state with the selected content type

    // Filter results based on the selected content type
    const filteredResults = originalResults.filter((item) => {
      if (selectedType === 'YouTube Videos') {
        return item.type === 'youtube';
      } else if (selectedType === 'Articles') {
        return item.type === 'article';
      }
      return true; // Return all results if no filter is selected
    });

    setResults(filteredResults);
  };

  return (
    <div className="app-container">
      <div className='nav'>
        <div className="search_box">
          <h1>Search the Web</h1>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term"
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        <div className="col-md-3 mb-3 selectContainer">
          <select className="form-select" onChange={handleFilter} value={contentType}>
            <option value="">Content Type</option>
            <option value="YouTube Videos">YouTube Videos</option>
            <option value="Articles">Articles</option>
          </select>
        </div>
      </div>
      
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="results-container my-4">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt="thumbnail"
                className="thumbnail"
              />
            )}
            <div className="resultContent">
              <h3>{result.title}</h3>
              <a href={result.link} target="_blank" rel="noopener noreferrer">
                {result.link}
              </a>
              {result.type === 'youtube' && (
                <p>{result.views} views | {result.likes} likes</p>
              )}
              {result.type === 'article' && (
                <p>{result.snippet}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

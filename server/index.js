const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Import CORS
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Search API handler
app.post('/search', async (req, res) => {
  const searchTerm = req.body.term;
console.log(searchTerm);
  try {
    const youtubeResults = await fetchYouTubeResults(searchTerm);
    const articleResults = await fetchGoogleResults(searchTerm);

    // Combine results and rank them
    const combinedResults = [...youtubeResults, ...articleResults];
    const rankedResults = rankResults(combinedResults);
    res.json(rankedResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch YouTube results
async function fetchYouTubeResults(searchTerm) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${searchTerm}&type=video&key=${YOUTUBE_API_KEY}`;
  
  const { data } = await axios.get(url);
 
  const videoDetails = await Promise.all(data.items.map(async (item) => {
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${item.id.videoId}&key=${YOUTUBE_API_KEY}`;
    const statsResponse = await axios.get(statsUrl);
    const stats = statsResponse.data.items[0].statistics;
    
    return {
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      views: parseInt(stats.viewCount),
      likes: parseInt(stats.likeCount),
      thumbnail: item.snippet.thumbnails.medium.url, // Fetch thumbnail
      type: 'youtube'
    };
  }));

  return videoDetails;
}

// Fetch article and blog results using Google Custom Search API
async function fetchGoogleResults(searchTerm) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const CUSTOM_SEARCH_ENGINE_ID = process.env.CUSTOM_SEARCH_ENGINE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchTerm}&cx=${CUSTOM_SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}`;
  
  const { data } = await axios.get(url);
return data.items.map((item) => {
  // Check if a thumbnail image is available in the response
  let thumbnail = null;
  if (item.pagemap && item.pagemap.cse_image && item.pagemap.cse_image.length > 0) {
    thumbnail = item.pagemap.cse_image[0].src; // Fetch thumbnail if available
  }

  return {
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    thumbnail: thumbnail,  // Include thumbnail if found
    type: 'article'
  };
});
}

// Simple ranking algorithm (can be customized based on specific factors)
function rankResults(results) {
  return results.sort((a, b) => {
    // Ranking based on views and likes for YouTube videos
    if (a.type === 'youtube' && b.type === 'youtube') {
      // First ranked them on basis if views then likes
      return b.views - a.views || b.likes - a.likes;
    }
    return 0;
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




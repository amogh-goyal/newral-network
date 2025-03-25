const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
mongoose.connect('mongodb+srv://amoghistheonewiththemaggi:amogh1212@practisecluster.va4v2.mongodb.net/users')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Define schemas (matching the ones in index.js)
const TopicSchema = new mongoose.Schema({
  step_number: {
    type: Number,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews_count: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const RoadmapOptionSchema = new mongoose.Schema({
  option_id: {
    type: String,
    required: true
  },
  option_name: {
    type: String,
    required: true
  },
  topics: [TopicSchema]
});

const RoadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    required: true
  },
  options: [RoadmapOptionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const UserRoadmaps = mongoose.model('UserRoadmaps', new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  maps: [RoadmapSchema]
}));

// Function to initialize empty roadmap structure for a user
async function initializeUserRoadmaps(username) {
  try {
    // Check if user already has roadmaps
    let userRoadmaps = await UserRoadmaps.findOne({ username });
    
    if (userRoadmaps) {
      // Clear existing roadmaps
      userRoadmaps.maps = [];
      console.log(`Cleared existing roadmaps for user: ${username}`);
    } else {
      // Create new user roadmaps with empty maps array
      userRoadmaps = new UserRoadmaps({
        username,
        maps: []
      });
      console.log(`Created new roadmaps structure for user: ${username}`);
    }
    
    // Save to database
    await userRoadmaps.save();
    
    console.log(`User roadmaps structure initialized for: ${username}`);
    console.log('Database initialization completed!');
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error initializing user roadmaps:', error);
    mongoose.connection.close();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error('Please provide a username as a command line argument');
  process.exit(1);
}

// Run the initialization function
initializeUserRoadmaps(username);

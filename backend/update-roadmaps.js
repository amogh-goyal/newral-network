const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// MongoDB connection string
const mongoURI = process.env.MONGODB_URL;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas
const RoadmapOptionSchema = new mongoose.Schema({
  option_id: String,
  option_name: String,
  topics: [{
    step_number: Number,
    topic: String,
    url: String,
    thumbnail: String,
    rating: Number,
    reviews_count: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }]
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
  selected_option: {
    type: String,
    default: "1"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// User Roadmaps Schema
const UserRoadmaps = mongoose.model('UserRoadmaps', new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  maps: [RoadmapSchema]
}));

async function updateRoadmaps() {
  try {
    // Get all user roadmaps
    const userRoadmaps = await UserRoadmaps.find({});
    
    console.log(`Found ${userRoadmaps.length} user roadmap documents`);
    
    // Update each user's roadmaps
    for (const userRoadmap of userRoadmaps) {
      let updated = false;
      
      // Check each roadmap
      for (const roadmap of userRoadmap.maps) {
        if (!roadmap.selected_option && roadmap.options && roadmap.options.length > 0) {
          // Set selected_option to the first option's ID if it exists
          roadmap.selected_option = roadmap.options[0].option_id;
          updated = true;
          console.log(`Updated roadmap "${roadmap.title}" for user "${userRoadmap.username}"`);
        }
      }
      
      // Save if updates were made
      if (updated) {
        await userRoadmap.save();
        console.log(`Saved updates for user "${userRoadmap.username}"`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error updating roadmaps:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
updateRoadmaps();

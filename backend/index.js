//region imports
const express = require('express')
const zod = require('zod')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');

const jwt_pass = "amogh1234"

const app = express()
app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true // Allow credentials
}))
app.use(cookieParser());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

//endregion

process.env.MONGODB_URL = 'mongodb+srv://amoghistheonewiththemaggi:amogh1212@practisecluster.va4v2.mongodb.net/users'
mongoose.connect(process.env.MONGODB_URL,{newUrlParser: true, useUnifiedTopology: true})

// Mongoose User Schema
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// Topic Schema (for each step in a roadmap)
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

// Roadmap Option Schema
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

// Roadmap Schema
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

// Sample Roadmap Schema - Simplified structure for sample roadmaps
const SampleRoadmapSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    enrolled: {
        type: Number,
        default: 0
    },
    main_thumbnail: {
        type: String,
        required: true
    },
    roadmap: {
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

// Sample Roadmap Model
const SampleRoadmap = mongoose.model('SampleRoadmap', SampleRoadmapSchema);

// Zod Schemas for Input Validation
const signupSchema = zod.object({
    username: zod.string().min(3, "Username must be at least 3 characters"),
    email: zod.string().email("Invalid email format"),
    password: zod.string().min(6, "Password must be at least 6 characters")
});

const createRoadmapSchema = zod.object({
    degree: zod.string().min(2, "Degree/specialization must be at least 2 characters"),
    country: zod.string().min(2, "Country must be at least 2 characters"),
    language: zod.string().min(2, "Language must be at least 2 characters"),
    isPaidCourse: zod.string().refine(val => val === "yes" || val === "no", {
        message: "isPaidCourse must be 'yes' or 'no'"
    }),
    preferredLanguage: zod.string().optional()
});

const topicSchema = zod.object({
    step_number: zod.number(),
    topic: zod.string(),
    thumbnail: zod.string(),
    url: zod.string(),
    rating: zod.number().optional(),
    reviews_count: zod.number().optional(),
    completed: zod.boolean().optional()
});

const roadmapOptionSchema = zod.object({
    option_id: zod.string(),
    option_name: zod.string(),
    topics: zod.array(topicSchema)
});

const roadmapSchema = zod.object({
    title: zod.string().min(3, "Title must be at least 3 characters"),
    description: zod.string().optional(),
    topic: zod.string().min(2, "Topic must be at least 2 characters"),
    options: zod.array(roadmapOptionSchema).optional(),
    selected_option: zod.string().default("1").optional()
});

// Test endpoint to verify server functionality
app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working correctly' });
});

// Debug endpoint to list all users
app.get('/debug/users', async (req, res) => {
    console.log('Debug users endpoint called');
    try {
        const users = await User.find({}, { username: 1, email: 1, _id: 0 });
        console.log('Found users:', users.length);
        
        const userRoadmaps = await UserRoadmaps.find({});
        console.log('Found user roadmaps:', userRoadmaps.length);
        
        const userRoadmapsList = userRoadmaps.map(ur => ({
            username: ur.username,
            mapCount: ur.maps.length,
            mapTitles: ur.maps.map(map => map.title)
        }));
        
        res.json({ 
            users, 
            userRoadmaps: userRoadmapsList 
        });
    } catch (err) {
        console.error('Error in debug users endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Simplified progress endpoint for testing (no authentication)
app.get('/roadmaps/progress-test', async (req, res) => {
    console.log('Progress test endpoint called');
    try {
        res.json({ 
            message: 'Progress test endpoint working',
            progress: [
                {
                    id: 'test-id-1',
                    title: 'Test Roadmap 1',
                    topic: 'Testing',
                    selected_option: '1',
                    option_name: 'Test Option',
                    completed: 5,
                    total: 10,
                    percentage: 50
                }
            ] 
        });
    } catch (err) {
        console.error('Error in progress test endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Progress endpoint without authentication (for debugging)
app.get('/roadmaps/progress-debug', async (req, res) => {
    console.log('Progress debug endpoint called');
    try {
        // Use a test username for debugging
        const username = 'Amogh Goyal';  // Use an actual username from the database
        console.log('Looking up roadmaps for test user:', username);
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        console.log('Found user roadmaps:', userRoadmaps ? 'Yes' : 'No');
        
        if (!userRoadmaps || !userRoadmaps.maps.length) {
            console.log('No roadmaps found or empty maps array');
            return res.json({ 
                message: 'No roadmaps found for test user',
                progress: [] 
            });
        }
        
        console.log('Number of roadmaps:', userRoadmaps.maps.length);
        
        // Calculate progress for each roadmap
        const progress = userRoadmaps.maps.map(roadmap => {
            const selectedOption = roadmap.selected_option || "1";
            console.log('Roadmap:', roadmap.title, 'Selected option:', selectedOption);
            const option = roadmap.options.find(opt => opt.option_id === selectedOption);
            
            if (!option) {
                console.log('Option not found for roadmap:', roadmap.title);
                return {
                    id: roadmap._id,
                    title: roadmap.title,
                    topic: roadmap.topic,
                    selected_option: selectedOption,
                    option_name: "Unknown",
                    completed: 0,
                    total: 0,
                    percentage: 0
                };
            }
            
            const totalTopics = option.topics.length;
            const completedTopics = option.topics.filter(topic => topic.completed).length;
            const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            
            console.log('Progress for roadmap:', roadmap.title, 'Completed:', completedTopics, 'Total:', totalTopics);
            
            return {
                id: roadmap._id,
                title: roadmap.title,
                topic: roadmap.topic,
                selected_option: selectedOption,
                option_name: option.option_name,
                completed: completedTopics,
                total: totalTopics,
                percentage
            };
        });
        
        console.log('Sending progress response');
        res.json({ progress });
    } catch (err) {
        console.error('Error getting progress information:', err);
        res.status(500).json({ error: err.message });
    }
});

// Authentication Middleware
function authenticateUser(req, res, next) {
    console.log('Authentication middleware called');
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        console.log('No authorization header provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        console.log('Authorization header does not start with Bearer');
        return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    try {
        const decoded = jwt.verify(token, jwt_pass);
        console.log('Token verified successfully for user:', decoded.username);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ message: 'Invalid token: ' + err.message });
    }
};

// Signup Route
app.post('/signup', async (req, res) => {
    try {
        // Validate Input with Zod
        const parsedData = signupSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }
        const { username, email, password } = parsedData.data;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: "Username or Email already exists" });
        }

        // Save new user to database
        const newUser = new User({ username, email, password });
        await newUser.save();

        // Generate JWT Token
        const token = jwt.sign({ username, email }, jwt_pass);

        // Return token
        res.json({ message: "Signup successful", token });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Signin Route
app.post('/signin', async (req, res) => {
    try {
        // Validate Input with Zod
        const signinSchema = zod.object({
            email: zod.string().email("Invalid email format"),
            password: zod.string().min(6, "Password must be at least 6 characters")
        });

        const parsedData = signinSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }

        const { email, password } = parsedData.data;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ username: user.username, email: user.email }, jwt_pass);

        // Return token
        res.json({ message: "Signin successful", token, username: user.username });

    } catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET Signin Route (for checking authentication status)
app.get('/signin', authenticateUser, async (req, res) => {
    try {
        // Return authenticated user info
        res.json({ 
            authenticated: true, 
            username: req.user.username,
            email: req.user.email 
        });
    } catch (error) {
        console.error("Auth Check Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update username
app.put('/user/username', authenticateUser, async (req, res) => {
    try {
        // Validate input
        const updateUsernameSchema = zod.object({
            newUsername: zod.string().min(3, "Username must be at least 3 characters")
        });
        
        const parsedData = updateUsernameSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }
        
        const { newUsername } = parsedData.data;
        const currentUsername = req.user.username;
        
        // Check if new username already exists
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }
        
        // Update username in User collection
        const user = await User.findOneAndUpdate(
            { username: currentUsername },
            { username: newUsername },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Update username in UserRoadmaps collection
        await UserRoadmaps.findOneAndUpdate(
            { username: currentUsername },
            { username: newUsername }
        );
        
        // Generate new token with updated username
        const token = jwt.sign({ username: newUsername, email: user.email }, jwt_pass);
        
        res.json({ 
            message: "Username updated successfully", 
            token,
            username: newUsername
        });
    } catch (error) {
        console.error("Update Username Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update password
app.put('/user/password', authenticateUser, async (req, res) => {
    try {
        // Validate input
        const updatePasswordSchema = zod.object({
            currentPassword: zod.string(),
            newPassword: zod.string().min(6, "New password must be at least 6 characters")
        });
        
        const parsedData = updatePasswordSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }
        
        const { currentPassword, newPassword } = parsedData.data;
        const username = req.user.username;
        
        // Verify current password
        const user = await User.findOne({ username });
        if (!user || user.password !== currentPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Update Password Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete user account
app.delete('/user', authenticateUser, async (req, res) => {
    try {
        // Validate input
        const deleteUserSchema = zod.object({
            password: zod.string()
        });
        
        const parsedData = deleteUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }
        
        const { password } = parsedData.data;
        const username = req.user.username;
        
        // Verify password
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Password is incorrect" });
        }
        
        // Delete user from User collection
        await User.deleteOne({ username });
        
        // Delete user's roadmaps
        await UserRoadmaps.deleteOne({ username });
        
        res.json({ message: "User account deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ROADMAP ROUTES

// Get progress information for all roadmaps
app.get('/roadmaps/progress', authenticateUser, async (req, res) => {
    console.log('Progress endpoint called');
    try {
        const username = req.user.username;
        console.log('User requesting progress:', username);
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        console.log('Found user roadmaps:', userRoadmaps ? 'Yes' : 'No');
        
        if (!userRoadmaps || !userRoadmaps.maps.length) {
            console.log('No roadmaps found or empty maps array');
            return res.json({ progress: [] });
        }
        
        console.log('Number of roadmaps:', userRoadmaps.maps.length);
        
        // Calculate progress for each roadmap
        const progress = userRoadmaps.maps.map(roadmap => {
            const selectedOption = roadmap.selected_option;
            console.log('Roadmap:', roadmap.title, 'Selected option:', selectedOption);
            const option = roadmap.options.find(opt => opt.option_id === selectedOption);
            
            if (!option) {
                console.log('Option not found for roadmap:', roadmap.title);
                return {
                    id: roadmap._id,
                    title: roadmap.title,
                    topic: roadmap.topic,
                    selected_option: selectedOption,
                    option_name: "Unknown",
                    completed: 0,
                    total: 0,
                    percentage: 0
                };
            }
            
            const totalTopics = option.topics.length;
            const completedTopics = option.topics.filter(topic => topic.completed).length;
            const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            
            console.log('Progress for roadmap:', roadmap.title, 'Completed:', completedTopics, 'Total:', totalTopics);
            
            return {
                id: roadmap._id,
                title: roadmap.title,
                topic: roadmap.topic,
                selected_option: selectedOption,
                option_name: option.option_name,
                completed: completedTopics,
                total: totalTopics,
                percentage
            };
        });
        
        console.log('Sending progress response');
        res.json({ progress });
    } catch (err) {
        console.error('Error getting progress information:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all roadmaps for a user
app.get('/roadmaps', authenticateUser, async (req, res) => {
    try {
        const username = req.user.username;
        
        let userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.json({ maps: [] }); // Return empty array if no roadmaps found
        }
        
        // Format the roadmaps for the frontend
        const formattedMaps = userRoadmaps.maps.map(map => ({
            id: map._id,
            title: map.title,
            description: map.description,
            topic: map.topic,
            options: map.options
        }));
        
        res.json({ maps: formattedMaps });
    } catch (err) {
        console.error('Error fetching roadmaps:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a specific roadmap by ID
app.get('/roadmaps/:id', authenticateUser, async (req, res) => {
    try {
        const username = req.user.username;
        const roadmapId = req.params.id;
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.status(404).json({ error: 'No roadmaps found for this user' });
        }
        
        const roadmap = userRoadmaps.maps.find(map => map._id.toString() === roadmapId);
        
        if (!roadmap) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }
        
        res.json({ roadmap });
    } catch (err) {
        console.error('Error fetching roadmap:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new roadmap for a user
app.post('/roadmaps', authenticateUser, async (req, res) => {
    try {
        const { title, description, topic, options } = req.body;
        
        // Validate input
        const result = roadmapSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.errors });
        }
        
        // Find user's roadmaps
        let userRoadmaps = await UserRoadmaps.findOne({ username: req.user.username });
        
        if (!userRoadmaps) {
            // Create new user roadmaps if not exists
            userRoadmaps = new UserRoadmaps({
                username: req.user.username,
                maps: []
            });
        }
        
        // Create new roadmap
        const newRoadmap = {
            title,
            description,
            topic,
            options: options.map(option => ({
                option_id: option.option_id || uuidv4(),
                option_name: option.option_name,
                topics: option.topics.map(topic => ({
                    step_number: topic.step_number,
                    topic: topic.topic,
                    thumbnail: topic.thumbnail,
                    url: topic.url,
                    rating: topic.rating || 0,
                    reviews_count: topic.reviews_count || 0,
                    completed: topic.completed || false
                }))
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Add new roadmap to user's maps
        userRoadmaps.maps.push(newRoadmap);
        
        // Save to database
        await userRoadmaps.save();
        
        res.status(201).json({ 
            message: 'Roadmap created successfully',
            roadmap: newRoadmap
        });
    } catch (err) {
        console.error('Error creating roadmap:', err);
        res.status(500).json({ error: 'Failed to create roadmap' });
    }
});

// Update a roadmap
app.put('/roadmaps/:id', authenticateUser, async (req, res) => {
    try {
        const username = req.user.username;
        const roadmapId = req.params.id;
        const updates = req.body;
        
        // Validate with Zod
        const parsedData = roadmapSchema.partial().safeParse(updates);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error.errors });
        }
        
        const validatedUpdates = parsedData.data;
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.status(404).json({ error: 'No roadmaps found for this user' });
        }
        
        const roadmapIndex = userRoadmaps.maps.findIndex(map => map._id.toString() === roadmapId);
        
        if (roadmapIndex === -1) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }
        
        // Update the roadmap fields
        Object.keys(validatedUpdates).forEach(key => {
            if (key !== '_id' && key !== 'createdAt') {
                userRoadmaps.maps[roadmapIndex][key] = validatedUpdates[key];
            }
        });
        
        // Update the updatedAt timestamp
        userRoadmaps.maps[roadmapIndex].updatedAt = Date.now();
        
        await userRoadmaps.save();
        
        res.json({ 
            message: 'Roadmap updated successfully',
            roadmap: userRoadmaps.maps[roadmapIndex]
        });
    } catch (err) {
        console.error('Error updating roadmap:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a roadmap
app.delete('/roadmaps/:id', authenticateUser, async (req, res) => {
    try {
        const username = req.user.username;
        const roadmapId = req.params.id;
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.status(404).json({ error: 'No roadmaps found for this user' });
        }
        
        const initialLength = userRoadmaps.maps.length;
        userRoadmaps.maps = userRoadmaps.maps.filter(map => map._id.toString() !== roadmapId);
        
        if (userRoadmaps.maps.length === initialLength) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }
        
        await userRoadmaps.save();
        
        res.json({ message: 'Roadmap deleted successfully' });
    } catch (err) {
        console.error('Error deleting roadmap:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark a topic as completed in a roadmap
app.patch('/roadmaps/:id/option/:optionId/topic/:topicId/complete', authenticateUser, async (req, res) => {
    try {
        const { id: roadmapId, optionId, topicId } = req.params;
        const { completed } = req.body;
        const username = req.user.username;
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.status(404).json({ error: 'No roadmaps found for this user' });
        }
        
        const roadmapIndex = userRoadmaps.maps.findIndex(map => map._id.toString() === roadmapId);
        
        if (roadmapIndex === -1) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }
        
        const option = userRoadmaps.maps[roadmapIndex].options.find(opt => opt.option_id === optionId);
        
        if (!option) {
            return res.status(404).json({ error: 'Option not found in roadmap' });
        }
        
        if (!option.topics.find(topic => topic.step_number === parseInt(topicId))) {
            return res.status(404).json({ error: 'Topic not found in roadmap option' });
        }
        
        // Update the completed status
        const topicIndex = option.topics.findIndex(topic => topic.step_number === parseInt(topicId));
        option.topics[topicIndex].completed = completed !== undefined ? completed : !option.topics[topicIndex].completed;
        
        // Save the updated roadmap
        await userRoadmaps.save();
        
        res.json({ 
            message: 'Topic completion status updated',
            completed: option.topics[topicIndex].completed
        });
    } catch (err) {
        console.error('Error updating topic completion status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update selected option for a roadmap
app.patch('/roadmaps/:id/selected-option', authenticateUser, async (req, res) => {
    try {
        const { id: roadmapId } = req.params;
        const { optionId } = req.body;
        const username = req.user.username;
        
        // Validate input
        if (!optionId) {
            return res.status(400).json({ error: 'Option ID is required' });
        }
        
        const userRoadmaps = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmaps) {
            return res.status(404).json({ error: 'No roadmaps found for this user' });
        }
        
        const roadmapIndex = userRoadmaps.maps.findIndex(map => map._id.toString() === roadmapId);
        
        if (roadmapIndex === -1) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }
        
        // Check if the option exists in the roadmap
        const optionExists = userRoadmaps.maps[roadmapIndex].options.some(opt => opt.option_id === optionId);
        
        if (!optionExists) {
            return res.status(404).json({ error: 'Option not found in roadmap' });
        }
        
        // Update the selected option
        userRoadmaps.maps[roadmapIndex].selected_option = optionId;
        
        // Save the updated roadmap
        await userRoadmaps.save();
        
        res.json({ 
            message: 'Selected option updated successfully',
            selected_option: optionId
        });
    } catch (err) {
        console.error('Error updating selected option:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create Roadmap Request Route
app.post('/create-roadmap', authenticateUser, async (req, res) => {
    try {
        console.log('Create roadmap request received:', req.body);
        
        // Validate input
        const validationResult = createRoadmapSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error);
            return res.status(400).json({ 
                message: 'Invalid input', 
                errors: validationResult.error.errors 
            });
        }
        
        const { degree, country, language, isPaidCourse, preferredLanguage } = validationResult.data;
        const username = req.user.username;
        
        // In a real application, this would trigger a background job or AI process
        // For now, we'll just create a placeholder roadmap that will be "filled in later"
        
        // Create a placeholder roadmap entry
        const placeholderRoadmap = {
            title: `${degree} Roadmap`,
            description: `A learning roadmap for ${degree} in ${country}. Language: ${language}. ${isPaidCourse === 'yes' ? 'Includes paid courses.' : 'Free courses only.'}${preferredLanguage ? ` Preferred coding language: ${preferredLanguage}.` : ''}`,
            topic: degree,
            options: [
                {
                    option_id: "1",
                    option_name: "Standard Path",
                    topics: [
                        {
                            step_number: 1,
                            topic: "Introduction to " + degree,
                            thumbnail: "/api/placeholder/400/250",
                            url: "#",
                            rating: 4.5,
                            reviews_count: 100,
                            completed: false
                        }
                    ]
                }
            ],
            selected_option: "1",
            status: "pending",
            requestDetails: {
                degree,
                country,
                language,
                isPaidCourse,
                preferredLanguage: preferredLanguage || "N/A",
                requestedAt: new Date()
            }
        };
        
        // Find user's roadmaps document or create if it doesn't exist
        let userRoadmapsDoc = await UserRoadmaps.findOne({ username });
        
        if (!userRoadmapsDoc) {
            userRoadmapsDoc = new UserRoadmaps({
                username,
                maps: [placeholderRoadmap]
            });
            await userRoadmapsDoc.save();
        } else {
            userRoadmapsDoc.maps.push(placeholderRoadmap);
            await userRoadmapsDoc.save();
        }
        
        console.log(`Roadmap request for ${degree} created for user ${username}`);
        
        res.status(201).json({ 
            message: 'Roadmap generation started. Check back in 10-12 minutes to see your roadmap.',
            roadmapId: userRoadmapsDoc.maps[userRoadmapsDoc.maps.length - 1]._id
        });
        
    } catch (error) {
        console.error('Error creating roadmap:', error);
        res.status(500).json({ message: 'Failed to create roadmap', error: error.message });
    }
});

const port = process.env.PORT ||3001 
app.listen(port, () => {
    console.log(`app listening on port : ${port}`)
})

// Sample Roadmap API Endpoints

// GET /samples - Retrieve all sample roadmaps
app.get('/samples', async (req, res) => {
  try {
    const samples = await SampleRoadmap.find({}).sort({ enrolled: -1 }).limit(3);
    res.json({ samples });
  } catch (err) {
    console.error('Error fetching sample roadmaps:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /samples/:id - Retrieve a specific sample roadmap by ID
app.get('/samples/:id', async (req, res) => {
  try {
    const sample = await SampleRoadmap.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample roadmap not found' });
    }
    res.json({ roadmap: sample });
  } catch (err) {
    console.error('Error fetching sample roadmap:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /samples - Create a new sample roadmap
app.post('/samples', authenticateUser, async (req, res) => {
  try {
    const { id, main_thumbnail, roadmap } = req.body;
    
    // Validate input
    if (!id || !main_thumbnail || !roadmap || !roadmap.title || !roadmap.topic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newSample = new SampleRoadmap({
      id,
      main_thumbnail,
      roadmap
    });
    
    await newSample.save();
    res.status(201).json({
      message: 'Sample roadmap created successfully',
      sampleId: newSample._id
    });
  } catch (err) {
    console.error('Error creating sample roadmap:', err);
    res.status(500).json({ error: 'Failed to create sample roadmap' });
  }
});

// POST /samples/:id/add - Add a sample roadmap to the user's collection
app.post('/samples/:id/add', authenticateUser, async (req, res) => {
  try {
    const sample = await SampleRoadmap.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample roadmap not found' });
    }

    const username = req.user.username;
    let userRoadmaps = await UserRoadmaps.findOne({ username });

    if (!userRoadmaps) {
      userRoadmaps = new UserRoadmaps({
        username,
        maps: [],
      });
    }

    // Create a new roadmap based on the sample
    const newRoadmap = {
      title: sample.roadmap.title,
      description: sample.roadmap.description,
      topic: sample.roadmap.topic,
      options: sample.roadmap.options,
      selected_option: sample.roadmap.selected_option || "1",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userRoadmaps.maps.push(newRoadmap);
    await userRoadmaps.save();

    // Update the enrolled count for the sample
    sample.enrolled += 1;
    await sample.save();

    res.status(201).json({
      message: 'Roadmap added to your collection',
      roadmapId: userRoadmaps.maps[userRoadmaps.maps.length - 1]._id
    });
  } catch (err) {
    console.error('Error adding sample roadmap to user collection:', err);
    res.status(500).json({ error: 'Failed to add roadmap' });
  }
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Set up middleware
app.use(express.json({ limit: '10mb' })); // For parsing application/json, with limit 10MB
app.use(express.static('uploads')); // Serve static files from the 'uploads' directory

app.use(express.static(__dirname))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/getAllImages', (req, res) => {
    const configFilePath = path.join(__dirname, 'postConfig.json');

    // Read the postConfig.json file
    fs.readFile(configFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading post configuration' });
        }

        try {
            const postConfig = JSON.parse(data);
            res.status(200).json(postConfig); // Return the configuration data
        } catch (parseErr) {
            return res.status(500).json({ error: 'Error parsing post configuration' });
        }
    });
});

// Handle POST request to upload image
app.post('/upload', (req, res) => {
    const { image, text, front, expressions } = req.body;

    if (!image) {
        return res.status(400).json({ error: 'No image data received' });
    }

    // Decode base64 string to binary buffer
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(__dirname, 'uploads', `image_${Date.now()}.png`);

    // Ensure 'uploads' folder exists
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }

    // Write the base64 data to the file
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error saving image to server' });
        }

        // Save the additional information (text and front) to postConfig.json
        const postConfig = {
            imagePath: filePath,
            text: text,
            front: front,
            expressions: expressions,
            timestamp: Date.now()
        };

        const configFilePath = path.join(__dirname, 'postConfig.json');

        // Check if the postConfig file exists
        fs.readFile(configFilePath, 'utf8', (err, data) => {
            let currentConfig = [];

            if (err) {
                // If file doesn't exist, start with an empty array
                currentConfig = [];
            } else {
                currentConfig = JSON.parse(data);
            }

            // Append the new post config to the array
            currentConfig.push(postConfig);

            // Save the updated configuration to the file
            fs.writeFile(configFilePath, JSON.stringify(currentConfig, null, 2), 'utf8', (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error saving post configuration' });
                }

                res.status(200).json({ message: 'Image uploaded successfully', filePath, postConfig });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

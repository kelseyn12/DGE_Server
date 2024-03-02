require('dotenv').config();
const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();


const corsOptions = {
    origin: 'https://www.duluthgearexchange.com',
    methods: ['GET', 'POST'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
};

app.use(cors(corsOptions));

let fetch;
(async () => {
    const { default: fetchDefault } = await import('node-fetch');
    fetch = fetchDefault;
})();
const cron = require('node-cron');




// Function to refresh Instagram access token
async function refreshInstagramAccessToken() {
    try {
        const response = await fetch('https://api.instagram.com/oauth/refresh_access_token', {
            method: 'POST',
            body: new URLSearchParams({
                'grant_type': 'ig_refresh_token',
                'access_token': process.env.INSTAGRAM_ACCESS_TOKEN,
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            process.env.INSTAGRAM_ACCESS_TOKEN = data.access_token;
            console.log('Instagram access token refreshed successfully.');
        } else {
            console.error('Failed to refresh Instagram access token.');
        }
    } catch (error) {
        console.error('Error refreshing Instagram access token:', error);
    }
}

// Function to update environment variable on Netlify
async function updateNetlifyEnvironmentVariable(newAccessToken) {
    try {
        const siteId = process.env.NETLIFY_SITE_ID;
        const accessToken = process.env.NETLIFY_ACCESS_TOKEN;

        const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                build_settings: {
                    env: {
                        INSTAGRAM_ACCESS_TOKEN: newAccessToken,
                    },
                },
            }),
        });

        if (response.ok) {
            console.log('Netlify environment variable updated successfully.');
        } else {
            console.error('Failed to update Netlify environment variable.');
        }
    } catch (error) {
        console.error('Error updating Netlify environment variable:', error);
    }
}

// Function to calculate the next run date based on the current date and interval
function getNextRunDate(currentDate, intervalInDays) {
    const nextRunDate = new Date(currentDate);
    nextRunDate.setDate(nextRunDate.getDate() + intervalInDays);
    return nextRunDate;
}

// Calculate the next run date for the cron job
const nextRunDate = getNextRunDate(new Date(), 59);

// Format the next run date into cron syntax
const cronExpression = `${nextRunDate.getMinutes()} ${nextRunDate.getHours()} ${nextRunDate.getDate()} ${nextRunDate.getMonth() + 1} *`;

// Cron job to refresh Instagram access token and update Netlify environment variable
cron.schedule(cronExpression, async () => {
    try {
        // Refresh Instagram access token
        await refreshInstagramAccessToken();

        // Update environment variable on Netlify
        await updateNetlifyEnvironmentVariable(process.env.INSTAGRAM_ACCESS_TOKEN);

        console.log('Instagram access token refreshed and Netlify environment variable updated successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


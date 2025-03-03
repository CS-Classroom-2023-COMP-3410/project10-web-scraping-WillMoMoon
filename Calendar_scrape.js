const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.du.edu/calendar';
const BASE_URL = 'https://www.du.edu';

// Fetch page HTML
async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

// Save events to a JSON file
function saveToJSON(events) {
    const dir = path.join(__dirname, 'results');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const filePath = path.join(dir, 'calendar_events.json');
    fs.writeFileSync(filePath, JSON.stringify({ events }, null, 2));
    console.log(`Saved to ${filePath}`);
}

// Scrape description from individual event page
async function scrapeEventDescription(eventUrl) {
    try {
        const html = await fetchHTML(eventUrl);
        const $ = cheerio.load(html);
        const description = $('.paragraph--type--text-block').text().trim();
        return description || undefined;
    } catch (error) {
        console.error(`Failed to fetch description from ${eventUrl}:`, error.message);
        return undefined;
    }
}

// Main scrape function
async function scrapeCalendar() {
    const html = await fetchHTML(URL);
    const $ = cheerio.load(html);

    const events = [];

    const eventCards = $('a.event-card');

    for (const element of eventCards) {
        const $event = $(element);

        const title = $event.find('h3').text().trim();
        const date = $event.find('p').first().text().trim();
        const time = $event.find('p:has(.icon-du-clock)').text().replace(/.*icon-du-clock\s*/i, '').trim();

        // Properly handle the URL, ensuring no duplication
        const rawHref = $event.attr('href');
        const link = rawHref.startsWith('http') ? rawHref : BASE_URL + rawHref;

        const description = await scrapeEventDescription(link);

        const eventData = { title, date };

        if (time) {
            eventData.time = time;
        }

        if (description) {
            eventData.description = description;
        }

        events.push(eventData);
    }

    saveToJSON(events);
}

// Run the scraper
scrapeCalendar()
    .then(() => console.log('Scraping complete.'))
    .catch(err => console.error('Scraping failed:', err));

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const url = "https://denverpioneers.com/index.aspx";

async function scrapeHTML(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;
        
        // Save to a file or print to console
        fs.writeFileSync('output.html', html);
        console.log("HTML saved to output.html");
        
        return html;
    } catch (error) {
        console.error("Error fetching the page:", error);
        return null;
    }
}

let siteHTML = scrapeHTML(url).then(html => {
    if (html) {
        // load in all the HTML into cheerio
            console.log("HTML length:", html.length);
            const $ = cheerio.load(html);

            // grab the script and run the script locally
            let myScript = $('h2#h2_scoreboard').siblings('script').text();
            // needed to run script and supress errors
            let window = [];
            let document = {
                addEventListener: function(a1, a2){

                }
            }
            eval(myScript);
            // GAME DATA!!! 
            let games = obj['data'];
            console.log(games);

           // Convert to the desired format
        const events = games.map(game => ({
            duTeam: "Denver Pioneers",
            opponent: game.opponent?.name || "TBD",
            date: game.date || "TBD"
        }));

        // Final object
        const outputData = { events };

        // Ensure `results` directory exists
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }

        // Write to `results/athletic_events.json`
        const outputPath = path.join(resultsDir, 'athletic_events.json');
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), 'utf-8');

        console.log(`Saved ${events.length} events to ${outputPath}`);
    }
});
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DU_BULLETIN_URL = 'https://bulletin.du.edu/undergraduate/coursedescriptions/comp/';

async function scrapeCourses() {
    try {
        const { data } = await axios.get(DU_BULLETIN_URL);
        const $ = cheerio.load(data);
        let courses = [];

        $('.courseblock').each((index, element) => {
            const courseText = $(element).find('strong').first().text().trim(); // Course title & number
            const courseDescription = $(element).find('.courseblockdesc').text().trim(); // Course description

            console.log("Extracted Course Text:", courseText);  // Debugging

            // Adjusted regex pattern to be more flexible with formatting
            const match = courseText.match(/(COMP[-\s]?\d{4}):?\s(.+?)\s*\(?\d*\s*Credits?\)?/i);
            if (match) {
                const courseCode = match[1].replace(/\s/, '-'); // Normalize to COMP-XXXX format
                const courseTitle = match[2]; // This will include Credit Counts for Certain Courses which have different credit hours

                // Ensure it's a COMP course and 3000-level or higher
                if (/^COMP-3\d{3}/.test(courseCode) || /^COMP-4\d{3}/.test(courseCode)) {
                    // Check if the course description mentions prerequisites
                    if (!courseDescription.toLowerCase().includes('prerequisite')) {
                        courses.push({
                            course: courseCode,
                            title: courseTitle
                        });
                    }
                }
            } else {
                console.log("No match for:", courseText); // Debugging unrecognized formats
            }
        });

        // Debugging: Log extracted courses
        console.log("Extracted Courses:", courses);

        // Ensure results directory exists
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }

        // Save to JSON file
        const outputPath = path.join(resultsDir, 'bulletin.json');
        fs.writeFileSync(outputPath, JSON.stringify({ courses }, null, 4));
        console.log(`Data saved to ${outputPath}`);
    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

scrapeCourses();

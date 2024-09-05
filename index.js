



const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ical = require('ical-generator');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAIApi(new Configuration({
}));

app.post('/extract-dates', async (req, res) => {
    try {
        const { courseOutline } = req.body;
        if (!courseOutline) {
            return res.status(400).json({ success: false, message: 'No course outline provided' });
        }

        // Make the API request
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-1106",
            messages: [
                { role: "system", content: "Extract important dates from the following course outline." },
                { role: "user", content: courseOutline }
            ]
        });

        // Log the response to see the actual content
        const responseContent = completion.data.choices[0].message.content.trim();
        console.log("OpenAI response content:", responseContent);

        // Assuming the response is a JSON array of dates
        let extractedDates;
        try {
            extractedDates = JSON.parse(responseContent);
        } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            return res.status(500).json({ success: false, message: 'Error parsing the response from OpenAI' });
        }

        // Generate the calendar
        const calendar = ical({ name: 'Course Calendar' });

        extractedDates.forEach(event => {
            calendar.createEvent({
                start: new Date(event.date),
                end: new Date(new Date(event.date).getTime() + 60 * 60 * 1000), // 1 hour duration
                summary: event.title,
            });
        });

        // Save the calendar file
        const filePath = 'public/calendar.ics';
        calendar.saveSync(filePath);

        res.json({ success: true });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

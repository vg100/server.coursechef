const Showdown = require("showdown");
const getEnvironmentVariables = require("../Environment/env");
const User = require("../modals/User");
const GenerativeAI = require("../Utils/GenerativeAI");
const gis = require("g-i-s");
const youtubesearchapi = require("youtube-search-api");
const { YoutubeTranscript } = require("youtube-transcript");
const { createApi } = require("unsplash-js");
const Course = require("../modals/Course");
const unsplash = createApi({ accessKey: getEnvironmentVariables().UNSPLASH_ACCESS_KEY });

class CourseController {
    static async prompt(req, res, next) {
        const { selectedValue, mainTopic, subtopics } = req.body;
        if (!selectedValue || !mainTopic) {
            return res.status(400).json({ error: "Selected value and main topic are required." });
        }

        try {
            const prompt = `
            Generate a list of strict ${selectedValue} topics with subtopics for the main title "${mainTopic.toLowerCase()}", formatted in JSON.
            ${subtopics && subtopics.length > 0
                    ? `The ${selectedValue} topics should strictly include these topics: ${subtopics}.`
                    : 'Generate advanced and relevant subtopics for each topic.'
                }
            Strictly keep the "theory", "youtube", and "image" fields empty. Format the response as JSON in this structure:
    
            {
                "${mainTopic.toLowerCase()}": [
                    {
                        "title": "Topic Title",
                        "subtopics": [
                            { "title": "Sub Topic Title", "theory": "", "youtube": "", "image": "", "done": false },
                            { "title": "Sub Topic Title", "theory": "", "youtube": "", "image": "", "done": false }
                        ]
                    },
                    {
                        "title": "Topic Title",
                        "subtopics": [
                            { "title": "Sub Topic Title", "theory": "", "youtube": "", "image": "", "done": false },
                            { "title": "Sub Topic Title", "theory": "", "youtube": "", "image": "", "done": false }
                        ]
                    }
                ]
            }`;

            var generatedJson = await GenerativeAI.generateText(prompt);
            generatedJson = generatedJson.replace(/```json/g, '').replace(/```/g, '');

            let parsedJson;
            try {
                parsedJson = JSON.parse(generatedJson);
            } catch (error) {
                console.warn("Initial parsing failed, attempting to parse again...");
                try {
                    generatedJson = generatedJson
                        .replace(/\\n/g, '')
                        .replace(/\s+/g, ' ')
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']');
                    parsedJson = JSON.parse(generatedJson);
                } catch (retryError) {
                    return res.status(500).json({ error: "Failed to parse the generated response as JSON after retrying.", details: retryError.message });
                }
            }
            res.status(200).json({ generatedJson: parsedJson });
        } catch (error) {
            next(error);
        }
    }


    static async generate(req, res, next) {
        const { prompt, user, courseId } = req.body;

        try {

            const foundUser = await User.findById(user);
            if (!foundUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const courseLimit = getEnvironmentVariables().COURSE_LIMIT;
            if (!courseId && foundUser.courseCount >= courseLimit && foundUser.type === "free") {
                return res.status(403).json({
                    success: false,
                    message: "Course limit reached. Please subscribe to our plan to create more courses.",
                });
            }
            const responseText = await GenerativeAI.generateText(prompt)
            res.status(200).json({ text: responseText });

        } catch (error) {
            next(error)
        }
    }

    static async image(req, res, next) {
        const receivedData = req.body;
        const promptString = receivedData.prompt;
        gis(promptString, logResults);
        function logResults(error, results) {
            if (error) { }
            else {
                res.status(200).json({ url: results[0].url });
            }
        }
    }

    static async yt(req, res, next) {
        try {

            const receivedData = req.body;
            const promptString = receivedData.prompt;
            const video = await youtubesearchapi.GetListByKeyword(promptString, [false], [1], [{ type: 'video' }])
            const videoId = await video.items[0].id;
            res.status(200).json({ url: videoId });

        } catch (error) {
            next(error)
        }
    }

    static async transcript(req, res, next) {
        const receivedData = req.body;
        const promptString = receivedData.prompt;
        YoutubeTranscript.fetchTranscript(promptString).then(video => {
            res.status(200).json({ url: video });
        }).catch(error => {
            res.status(500).json({ success: false, message: 'Internal server error' });
        })
    }

    static async course(req, res, next) {
        const { user, content, type, mainTopic } = req.body;

        try {
            // Search for photos on Unsplash based on the main topic
            const result = await unsplash.search.getPhotos({
                query: mainTopic,
                page: 1,
                perPage: 1,
                orientation: 'landscape',
            });

            const photos = result.response.results;
            const photo = photos[0]?.urls?.regular || ''; // Use fallback in case no photo is found

            // Create a new course
            const newCourse = new Course({ user, content, type, mainTopic, photo });
            await newCourse.save();

            // Update the user's course count
            await User.findByIdAndUpdate(
                user,
                { $inc: { courseCount: 1 } },
                { new: true }
            );

            // Respond with success message
            res.json({
                success: true,
                message: "Course created successfully",
                courseId: newCourse._id,
            });
        } catch (error) {
            next(error)
        }
    }

    static async update(req, res, next) {
        const { content, courseId } = req.body;
        try {

            await Course.findOneAndUpdate(
                { _id: courseId },
                [{ $set: { content: content } }]
            ).then(result => {
                res.json({ success: true, message: 'Course updated successfully' });
            }).catch(error => {
                res.status(500).json({ success: false, message: 'Internal server error' });
            })

        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    static async importCourse(req, res, next) {

        const { courseId, userId } = req.body;

        try {
            const courseToImport = await Course.findById(courseId);
            if (!courseToImport) {
                throw new Error("Course not found");
            }

            const existingCourse = await Course.findOne({ user: userId, content: courseToImport.content });
            if (existingCourse) {
                throw new Error("Course already imported");
            }

            const importedCourse = new Course({
                user: userId,
                content: courseToImport.content,
                type: courseToImport.type,
                mainTopic: courseToImport.mainTopic,
                courseCreateTye:'imported',
                photo: courseToImport.photo,
                completed: false 

            });

            await importedCourse.save();
            await User.findByIdAndUpdate(userId, { $inc: { courseCount: 1 } });

            res.status(201).json({
                message: "Course imported successfully",
                course: importedCourse
            });
        } catch (error) {
            next(error)
        }


    }
    static async getCourse(req, res, next) {
        try {
            const courses = await Course.find({});
            res.json(courses);
        } catch (error) {
            next(error)
        }
    }
    static async getCoursesByUserId(req, res, next){

            try {
              const { userId } = req.query;
              await Course.find({ user: userId }).then((result) => {
                res.json(result);
              });
            } catch (error) {
                next(error)
            }
          
    }
}


module.exports = CourseController;
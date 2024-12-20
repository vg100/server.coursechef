const { GoogleGenerativeAI } = require("@google/generative-ai");

const getEnvironmentVariables = require("../Environment/env");
const genAI = new GoogleGenerativeAI(getEnvironmentVariables().GEMINI_API_KEY);


const cache = {};
const generateCacheKey = (query) => query.toLowerCase().trim();

class SearchController {
   static async generate_autocompletions(req, res, next) {
    const { query, type, mainTopic } = req.query; // mainTopic is optional; provided for subtopic queries
    const cacheKey = generateCacheKey(`${type}-${mainTopic || ''}-${query}`);
    
    if (cache[cacheKey]) {
        return res.status(200).json({ completions: cache[cacheKey] });
    }

    const prompt =
        type === "main"
            ? `Generate a JSON array of suggested main topics relevant to the context of the provided topic: "${query}". Ensure that the suggestions are diverse, specific, and cover various subdomains or related fields. Prioritize high-quality, relevant topics that are frequently searched or trending. Format your response as: {"completions": ["suggested topic 1", "suggested topic 2", ...]}. Avoid any duplicate or overly generic suggestions.`
            : `Generate a JSON array of suggested subtopics relevant to the main topic: "${mainTopic}". The user has provided a query: "${query}". Generate subtopics that are specific, diverse, and closely related to the main topic. Format your response as: {"completions": ["suggested subtopic 1", "suggested subtopic 2", ...]}.`;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const { response } = await model.generateContent(prompt)
            const parsedResponse = response.text()
        cache[cacheKey] = parsedResponse;

            res.status(200).json({ completions: parsedResponse });

    } catch (error) {
            next(error)
        }
    }
}


module.exports = SearchController;



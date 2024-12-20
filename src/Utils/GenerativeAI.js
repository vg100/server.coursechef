const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const getEnvironmentVariables = require("../Environment/env");

class GenerativeAI {
    constructor() {
        this.client = new GoogleGenerativeAI(getEnvironmentVariables().GEMINI_API_KEY);
        this.safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];
    }

    async generateText(prompt) {
        try {
            const model = this.client.getGenerativeModel({ model: "gemini-pro", safetySettings: this.safetySettings });
            const { response } = await model.generateContent(prompt)
            return response.text()
        } catch (error) {
            console.error('Error generating text:', error);
            throw error;
        }
    }
}

module.exports = new GenerativeAI();
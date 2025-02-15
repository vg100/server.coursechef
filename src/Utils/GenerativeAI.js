const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const getEnvironmentVariables = require("../Environment/env");



const pp=(USER_QUERY)=>{
    return `
Act as an advanced job search API parameter generator. Convert natural language queries into structured parameters using these rules:

1. **Core Parameters:**
- query: Extract job title/role + location (e.g., "software engineer in chicago")
- page: Always default to 1 unless specified
- num_pages: Default 1, allow 1-20 if user says "show more results"
- country: Convert country names to ISO 3166-1 alpha-2 codes (e.g., "USA" → "us")
- language: Keep empty unless specified
- date_posted: Map to:
  - "last 24 hours" → "today"
  - "recent postings" → "3days"
  - "this week" → "week" 
  - "this month" → "month"
  - Default: "all"

- work_from_home: true if query contains "remote", "wfh", or "work from home"
- employment_types: Convert to comma-separated values:
  - "full-time" → "FULLTIME"
  - "part-time" → "PARTTIME" 
  - "contract" → "CONTRACTOR"
  - "internship" → "INTERN"
  - Default: "FULLTIME,CONTRACTOR,PARTTIME,INTERN"

- job_requirements: Convert experience mentions to:
  - "entry level"/"0-2 years" → "under_3_years_experience"
  - "mid-level"/"3-5 years" → "more_than_3_years_experience"
  - "senior"/"5+ years" → "more_than_3_years_experience"
  - "no degree needed" → "no_degree"

- radius: Extract km/miles and convert to km (e.g., "20 mile radius" → 32)
- exclude_job_publishers: Always set to "BeeBe,Dice"
- fields: Always keep "employer_name,job_publisher,job_title,job_country"

2. **Conversion Examples:**
Query: "Find me react developer jobs in Texas with 3+ years experience"
Output:
{
  "query": "react developer in texas",
  "page": 1,
  "num_pages": 1,
  "country": "us",
  "language": "",
  "date_posted": "all",
  "work_from_home": false,
  "employment_types": "FULLTIME,CONTRACTOR,PARTTIME,INTERN",
  "job_requirements": "more_than_3_years_experience",
  "radius": 50,
  "exclude_job_publishers": "BeeBe,Dice",
  "fields": "employer_name,job_publisher,job_title,job_country"
}

Query: "Remote entry-level python jobs posted this week within 20km of London"
Output:
{
  "query": "python jobs in london",
  "page": 1,
  "num_pages": 1,
  "country": "gb",
  "language": "",
  "date_posted": "week",
  "work_from_home": true,
  "employment_types": "FULLTIME,CONTRACTOR,PARTTIME,INTERN",
  "job_requirements": "under_3_years_experience",
  "radius": 20,
  "exclude_job_publishers": "BeeBe,Dice",
  "fields": "employer_name,job_publisher,job_title,job_country"
}

3. **Special Rules:**
- Prioritize explicit location mentions over IP-based location
- Convert state names to country codes when necessary
- Handle mixed units ("5 mile radius" → 8km)
- Combine multiple experience requirements
- Maintain all default values unless explicitly changed

Return only valid JSON without comments. Now process this query:
"${USER_QUERY}"
  `
}


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

    async getSomecourseRecommandation(prompt) {
        try {
            const model = this.client.getGenerativeModel({ model: "gemini-pro", safetySettings: this.safetySettings });
            const { response } = await model.generateContent(prompt)
            return response.text()
        } catch {

        }
    }



    async parseJobQuery(userQuery) {
        try {
            const generationConfig = {
                temperature: 0.7,
                topP: 1,
                topK: 32,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
              };
              
          const model = this.client.getGenerativeModel({ 
            model: "gemini-1.5-pro-latest",
            generationConfig
          });
      
          const fullPrompt = pp(userQuery);
      
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const text = response.text();
      
          // Clean JSON response
          const jsonString = text.replace(/```json|```/g, '').trim();
          return JSON.parse(jsonString);
      
        } catch (error) {
          console.error("Error parsing job query:", error);
          return null;
        }
    }
}

module.exports = new GenerativeAI();
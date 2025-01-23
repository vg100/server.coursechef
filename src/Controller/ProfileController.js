const Profile = require("../modals/Profile");
const GenerativeAI = require("../Utils/GenerativeAI");



function generateUnifiedPrompt(areasOfInterest) {
    console.log(areasOfInterest)
    const selectedAreas = areasOfInterest?.map(area => area?.name).join(', ');

    return `Generate a JSON object containing an array of recommended courses related to the provided topics: "${selectedAreas}". Ensure that the recommendations are diverse, specific, and cover various subdomains or related fields. Focus on high-quality, trending, and frequently searched topics. 

    Format your response strictly as follows: 
    {
      "recommendcourses": [
        "Course 1",
        "Course 2",
        "Course 3",
        ...
      ]
    }
    
    Ensure there are no duplicate or overly generic suggestions, and all recommendations align closely with the given topics.`;
}

class ProfileController {
    static async updateProfile(req, res, next) {
        try {
            console.log(req.body,'req.body')
            const { id } = req.params;
            await Profile.findOneAndUpdate({ userId: id }, req.body, { new: true });
            res.status(200).json({});
        } catch (error) {
            next(error);
        }


    }

    static async getProfile(req, res, next) {
        try {
            const { id } = req.params;
            const getProfile = await Profile.findOne({ userId: id }).populate("subscription")
            if (!getProfile) {
                return res.status(404).json({ message: 'Profile not found' });
            }
            res.status(200).json(getProfile);
        } catch (error) {
            next(error)
        }
    }


    static async getRecommended(req, res, next) {
        try {
            if(!req.body.selectedInterests?.length) return
            const prompt = generateUnifiedPrompt(req.body.selectedInterests);
            const data = await GenerativeAI.getSomecourseRecommandation(prompt)

            let retries = 3;
            let parsedJson;
    
            while (retries > 0) {
                try {
                    const cleanedJsonString = data.replace(/```json/g, "").replace(/```/g, "");
                    parsedJson = JSON.parse(cleanedJsonString);
                    break;
                } catch (parseError) {
                    retries--;
                    if (retries === 0) throw new Error("Failed to parse JSON after multiple attempts.");
                }
            }
            res.status(200).json(parsedJson);
        } catch (error) {
            next(error)
        }
    }


}


module.exports = ProfileController;



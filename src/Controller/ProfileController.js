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
            const { id } = req.params;
            let response = await Profile.findById(id);
            if (!response) {
                const newProfile = new Profile({
                    _id: id,
                    fullName: '',
                    email: '',
                    subscription: {},
                    learningPreferences: {},
                    courses: [],
                    achievements: {},
                    leaderboard: {},
                    activityLog: [],
                    socialLinks: {},
                    settings: {},
                    auth: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                response = await newProfile.save();
            }

            response = await Profile.findByIdAndUpdate(id, req.body, { new: true });

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }


    }

    static async getProfile(req, res, next) {
        try {
            const { id } = req.params;
            const getProfile = await Profile.findById(id);
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

            const prompt = generateUnifiedPrompt(req.body.selectedInterests);
            const data = await GenerativeAI.getSomecourseRecommandation(prompt)
            const cleanedJsonString = data.replace(/```json/g, "").replace(/```/g, "");
            const parsedJson = JSON.parse(cleanedJsonString);
            res.status(200).json(parsedJson);
        } catch (error) {
            next(error)
        }
    }


}


module.exports = ProfileController;



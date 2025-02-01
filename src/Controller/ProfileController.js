
const GenerativeAI = require("../Utils/GenerativeAI");
const User = require("../modals/userr");
const SocketController = require("./socketController");



function generateUnifiedPrompt(areasOfInterest) {
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
            await User.findOneAndUpdate({ _id: id }, req.body, { new: true });
            res.status(200).json({});
        } catch (error) {
            next(error);
        }


    }

    static async getProfile(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await User.findOne({ _id: id  })
            .select('-password -resetPasswordToken -resetPasswordExpires -activityLog -__v')  // Exclude sensitive fields
            .populate('subscription')
            .populate('courses.courseId')
            .populate('achievements.badges')
            .populate('achievements.certificates.courseId');
          
          if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
          }
          
          res.status(200).json({ success: true, profile });
        } catch (error) {
            next(error)
        }
    }


    static async getRecommended(req, res, next) {
        try {
            if (!req.body.selectedInterests?.length) return
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
            SocketController.emitEvent('courseRecommendations', parsedJson)

            // res.status(200).json(parsedJson);
        } catch (error) {
            next(error)
        }
    }
    static async sendNotification(req, res, next) {
        try {
            const { userId } = req.params;
            if (userId) {
                SocketController.to(userId, 'notification', req.body);
                res.status(200).json({ message: 'Notification sent successfully.' });
                return
            }
            SocketController.emitEvent('notification', req.body)
            res.status(200).json({ message: 'Notification sent successfully.' });
        } catch (error) {
            next(error)
        }
    }

}


module.exports = ProfileController;



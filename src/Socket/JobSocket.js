
const GenerativeAI = require("../Utils/GenerativeAI");
const axios = require("axios")

const API_HOST = "jsearch.p.rapidapi.com";
const API_KEY = "a1d4b77c24msh7577e1d5d9211ecp13317ejsnc74afd5c0341";

const axiosInstance = axios.create({
    baseURL: `https://${API_HOST}`,
    headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": API_HOST,
    },
    timeout: 10000, // Add timeout
});


class JobSocket {
    static async query(socket, data) {
        try {

            if (!data || typeof data !== "string") {
                throw new Error("Invalid query format");
            }

            console.log("[Job Query]", data);

            // Parse query with error handling
            // const params = await GenerativeAI.parseJobQuery(data);
            // if (!params || typeof params !== "object") {
            //     throw new Error("Failed to generate search parameters");
            // }
            // console.log(params,'hhh')
            // API request with error handling
            const response = await axiosInstance.get("/search", {
                params: {
                    query: data,
                    page: "1",
                    num_pages: "1",
                    country: "us",
                    date_posted: "all",
                },
                validateStatus: (status) => status < 500 // Handle 4xx errors
            });

            if (!response.data || !Array.isArray(response.data.data)) {
                throw new Error("Invalid API response format");
            }

            // Send clean response data
            socket.emit("Response[jobQuery]", {
                success: true,
                data: response.data.data
            });

        } catch (error) {
            console.error("[Job Query Error]", error);

            // Send structured error response
            socket.emit("Response[jobQuery]", {
                success: false,
                error: error.response?.data?.message || error.message
            });
        }
    }
}
module.exports = JobSocket
const {DevEnvironment}=require("./dev.env")
const {ProdEnvironment} =require("./prod.env")


 function getEnvironmentVariables() {
    if (process.env.NODE_ENV === 'production') {
        return ProdEnvironment;
    } else {
        return DevEnvironment;
    }
}

module.exports = getEnvironmentVariables;
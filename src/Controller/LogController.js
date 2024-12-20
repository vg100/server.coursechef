const fs = require('fs');
const path = require('path');

class LogController {
    static async log(req, res){
        const logFilePath = path.join(__dirname, '../../server.log');

        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).send('Error reading log file');
            }
            const logLines = data.trim().split('\n').map(line => {
                const [timestamp, ...message] = line.split(' - ');
                return { timestamp, message: message.join(' - ') };
            });
      
            res.json(logLines);
        });
    }
}


module.exports=LogController
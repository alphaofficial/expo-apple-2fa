// Some old school imports to support Node 12
// in the Github Actions runner
const ngrok = require('ngrok');
const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const cp = require('child_process');

let expoCli = undefined;

function out(buffer) {
    process.stdout.write(buffer);
}

// First, start our web server...
const api = express();
api.use(bodyParser.json());

// Handle our routes...
api.get('/', (req, res) => {
    res.send('Hello world!');
});

api.post('/', (req, res) => {
    try {
        const { code } = req.body;
        if (code) {
            res.status(204).send();
            expoCli.stdout.write(code + '\n');
        }
        else {
            res.status(400).send({'error': 'No code provided.'});
        }
    }
    catch (exc) {
        console.error(exc);
        res.status(500).send(exc);
    }
});

// Start our API server and ngrok.
// Once we do that, we need to start the publishing process
api.listen(9090, async () => {
    const url = await ngrok.connect(9090);
    
    log(chalk.blue( '===> When you receive your two factor auth code, visit:'));
    log(chalk.white(`     ${url}`));
    log('');

    // Start work on our Expo project.
    expoCli = cp.spawn('expo', ['publish:ios']);

    expoCli.stdout.on('data', function(data) {
        out(chalk.greenBright('>>> ') +  data.toString());
    });

    expoCli.stderr.on('data', function(data) {
        out(chalk.red('>>> ') + data.toString()); 
    });

    expoCli.on('exit', (code) => {
        process.exit(code);
    });
});

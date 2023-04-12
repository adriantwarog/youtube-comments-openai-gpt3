import mysql from 'mysql2/promise';

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    organization: "org-i16GdI3biVetsydNnhzCYRLs",
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);

// Modify the connection details to match the details specified while deploying
// the SingleStore workspace:
const HOST = 'svc-71fb4568-983a-46f1-b1f7-782c75822474-dml.aws-oregon-4.svc.singlestore.com';
const USER = 'admin';
const PASSWORD = 'VnuUdaDiECRU5SjKZbIBlrjJTJEAmbhH';
const DATABASE = 'singlestore';

async function create({singleStoreConnection, comment}) {
    const [results] = await singleStoreConnection.execute(
        'INSERT INTO comments (commentid, commenter, comment, gpt, flag, respond) VALUES (?, ?, ?, ?, ?, ?)',
        [comment.commentid, comment.commenter, comment.comment, comment.gpt, comment.flag, comment.respond]
    );
 	return results.insertId;
};

// main is run at the end
async function main() {
    let singleStoreConnection;
    try {
        singleStoreConnection = await mysql.createConnection({host: HOST, user: USER, password: PASSWORD, database: DATABASE});
        console.log("You have successfully connected to SingleStore.");

        // call the create() function inside the main() function as:
        const id = await create({singleStoreConnection, comment: {
            commentid: 1,
            commenter: 'Adrian Twarog',
            comment: 'Why did the database go on a diet? It had too many tables!',
            gpt: "",
            flag: 0,
            respond: 0
        }});
        console.log(`Inserted row id is: ${id}`);

    } catch (err) {
        console.error('ERROR', err);
        process.exit(1);
    } finally {
        if (singleStoreConnection) {
            await singleStoreConnection.end();
        }
    }
}

// main();

async function readN({ singleStoreConnection }) {
    const [rows] = await singleStoreConnection.execute(
        'SELECT * FROM comments'
    );
    return rows;
};

// main is run at the end
async function updateDatabaseUsingGPT() {
    let singleStoreConnection;
    try {
        singleStoreConnection = await mysql.createConnection({host: HOST, user: USER, password: PASSWORD, database: DATABASE});
        console.log("You have successfully connected to SingleStore.");

        const comments = await readN({ singleStoreConnection });

        console.log(comments)

        for(var i = 0; i < comments.length; i++) {

            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `The following AI tool helps youtubers identify if a comment can should be replied to or not. Questions and or asking for advice are good examples of when a reply is needed.\n\n` +

                // Context Example 1
                `User: John Smith\n` +
                `Comment: That was a great video, thanks!\n` +
                `Should Reply: No\n\n` +

                // Context Example 2
                `User: Sue Mary\n` +
                `Comment: I'm stuck on step four, how do I do it?` +
                `Should Reply: Yes\n\n` +

                // Actual use case
                `User: ${comments[0].commenter}\n` +
                `Comment: ${comments[i].comment}\n` +
                `Should Reply:`,
                stop: ["\n", "User:", "Comment:", "Should Reply:"],
                max_tokens: 7,
                temperature: 0,
            });
            
            console.log(response.data.choices[0].text);

            if(response.data.choices[0].text.trim() == "Yes") {
                await singleStoreConnection.execute(`UPDATE comments SET respond = 1 WHERE id = ${comments[i].id}`);
                console.log('database updated')
            }

        }

    } catch (err) {
        console.error('ERROR', err);
        process.exit(1);
    } finally {
        if (singleStoreConnection) {
            await singleStoreConnection.end();
        }
    }
}

// updateDatabaseUsingGPT();

// main is run at the end
async function readDatabase() {
    let singleStoreConnection;
    try {
        singleStoreConnection = await mysql.createConnection({host: HOST, user: USER, password: PASSWORD, database: DATABASE});
        console.log("You have successfully connected to SingleStore.");

        const comments = await readN({ singleStoreConnection });

        console.log(comments)

       
    } catch (err) {
        console.error('ERROR', err);
        process.exit(1);
    } finally {
        if (singleStoreConnection) {
            await singleStoreConnection.end();
        }
    }
}

readDatabase();


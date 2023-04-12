import {google} from 'googleapis';
import mysql from 'mysql2/promise';
import fs from 'fs'

const HOST = 'svc-71fb4568-983a-46f1-b1f7-782c75822474-dml.aws-oregon-4.svc.singlestore.com';
const USER = 'admin';
const PASSWORD = 'VnuUdaDiECRU5SjKZbIBlrjJTJEAmbhH';
const DATABASE = 'singlestore';

const youtube = google.youtube({
	version: 'v3',
	auth: 'AIzaSyCDwGf2F2odpZUlSkGyuFPxPKxXAPZsrps'
});

async function create({singleStoreConnection, comment}) {
    const [results] = await singleStoreConnection.execute(
        'INSERT INTO comments (commentid, commenter, comment, gpt, flag, respond) VALUES (?, ?, ?, ?, ?, ?)',
        [comment.commentid, comment.commenter, comment.comment, comment.gpt, comment.flag, comment.respond]
    );
 	return results.insertId;
};

async function getYoutubeComments(){
	return new Promise((resolve, reject) => {
		youtube.commentThreads.list({
			part: 'snippet',
			videoId: 'JTxsNm9IdYU',
			maxResults: 100
		}, (err, res) => {
			if(err) reject(err);
			resolve(res.data.items);
		});
	});
}

// main is run at the end
async function main() {
    let singleStoreConnection;
    try {
        singleStoreConnection = await mysql.createConnection({host: HOST, user: USER, password: PASSWORD, database: DATABASE});
        console.log("You have successfully connected to SingleStore.");

		let comments = await getYoutubeComments();

		for(let i = 0; i < comments.length; i++){

			// call the create() function inside the main() function as:
			const id = await create({singleStoreConnection, comment: {
				commentid: comments[i].id,
				commenter: comments[i].snippet.topLevelComment.snippet.authorDisplayName,
				comment: comments[i].snippet.topLevelComment.snippet.textOriginal,
				gpt: "",
				flag: 0,
				respond: 0
			}});
			console.log(`Inserted row id is: ${id}`);

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

main();
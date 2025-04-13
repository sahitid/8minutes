import {getRedisClient}  from "../../lib/initRedisClient"  
import type { NextApiRequest, NextApiResponse } from "next";
type answer = {
	answer: string | string[], 
	id?: string
}
export default  async (req, res) => {

	if(req.method ==="POST")
	{
	const requestBody: {submission: answer[], username: string} = JSON.parse(req.body)
	const client = await getRedisClient();	
	console.log(JSON.parse(req.body));
	const information: answer[] = requestBody.submission; 
	const username: string = requestBody.username;
	let addInfo = {};
	for(let i=0; i< information.length; i++){
		const temp = information[i].answer;
		addInfo[i] = Array.isArray(temp) ? JSON.stringify( temp ): temp
	}
	await client.hSet(`${username}:Survey`, addInfo); 
	await client.expire(`${username}:Survey`, 10 * 60); //honestly could change the ttl to a shorter time 
	res.status(200).json({msg: "working"})
	}
	else{
		res.status(404).json({msg: "not "})
	}
} 

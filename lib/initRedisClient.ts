import {createClient} from "redis"; 
let client: ReturnType<typeof createClient> | null = null;  
export const getRedisClient = async () => {
	if(!client)
		{
		client = createClient({
		url:"" 
		})
		await client.connect().catch(console.error)
		}

	return client;

}

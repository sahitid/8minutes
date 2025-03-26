'use client'
import Nav from "../../components/nav";
import {useEffect, useState} from "react"
import {useRouter} from  "next/router"; 
import {useUser } from "@clerk/nextjs"
export default function Survey() {
  const {isLoaded, isSignedIn, user} = useUser(); 
  const router = useRouter();
const [typeOfConverstationVal, typeOfConversationChange] = useState('');
  useEffect( ()=> {

	if( isLoaded && !isSignedIn ){
	  console.log(`isSigned = ${isSignedIn} \n isLoaded = ${isLoaded}`)
		router.push("/sign-in")
	}


  }, [isLoaded, isSignedIn]);
if (!isLoaded || !isSignedIn) return null

  return (
    <div className="font-radley dark:text-white dark:bg-black">
      <Nav />

      <main className="flex w-full items-start justify-center h-screen mt-8 ">
	  	<div className="flex-col w-full">
			<h2 className="text-xl text-center my-5">
				Hello {user.username}, Please Fill out this Quick Survey! 
	  		</h2>
	  	<div className="flex-col w-full">
		<div className="w-full min-h-[60vh] my-auto mx-auto max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
	  		<h3 className="text-lg">1. Type of Conversation? </h3>
	  		<div className="flex flex-col space-y-4 mx-8 my-2 self-center" onChange={(e) => typeOfConversationChange(e.target.value)} >
	  		<label>
			<input type='radio' value="Laugh" name="convtype"/> A Good Laugh
	  		</label>
	  		<label>
			<input type='radio' value="Heard" name="convtype"/> To Feel Heard 
	  		</label>
	  		<label>
			<input type='radio' value="Friend" name="convtype"/> Make A New Friend 
	  		</label>
	  		</div>
	  			
	  	</div>
		<div className="w-full mx-auto max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
	  		<h3 className="text-lg">1. Type of Conversation</h3>
	  	</div>
		</div>

	  	</div>
      </main>

      <footer className="mt-12">
        <p className="text-1xl items-center justify-center text-center mb-3">
          made with 🖤
        </p>
      </footer>
    </div>
  );
}

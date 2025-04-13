'use client'
import Nav from "../../components/nav";
import {useRouter} from  "next/router"; 
import {useState, useEffect} from "react";
import { ReactLenis, useLenis } from "lenis/dist/lenis-react";
import {useUser } from "@clerk/nextjs"

function check_box(e, valChange)
{
	const {value , checked} = e.target;
	valChange((prev) => {
	if (checked){
		if (prev.length == 2) return prev; 
		return [...prev, value] 
	}else{
		return prev.filter((v) => v !== value)
	}
	})	
}
const checkbox_vals = [
	{value: "Creativity", title: "Creativity & Arts"},
	{value: "Games", title: "Games & Entertainment"},
	{value: "Life", title: "Life & World Talk"},
	{value: "Deep", title: "Deep Conversations"},
	{value: "Fun", title: "Just For Fun"}
]
export default function Survey() {
const lenis = useLenis(); 
const {isLoaded, isSignedIn, user} = useUser(); 
const router = useRouter();
const [typeOfConversationVal, typeOfConversationChange] = useState("");
const [moodVal, moodChange] = useState('');
const [interestsVal, interestsChange] = useState([]);
const input_form=[
	{answer: typeOfConversationVal, id: "#first"},
	{answer: moodVal, id: "#second"},
	{answer: interestsVal, id: "#third"},
] 
function change_func(val, func, next)
{
	lenis?.scrollTo(next); 
	func(val);
}
async function submit_form(questions)
{
	for( const {answer, id } of questions){
		if(!answer || (Array.isArray(answer) && answer.length != 2) ){
			console.log(  !answer ||Array.isArray(answer) && answer.length !== 2 )
			lenis?.scrollTo(id);
			return; 
		}
	}
		const ret = await fetch("/api/survey",{
		method: "POST",
		body: JSON.stringify({submission: questions, username: user.username})
		}) 
	router.push("chat")
	}			
  useEffect( ()=> {
	if( isLoaded && !isSignedIn ){
	  console.log(`isSigned = ${isSignedIn} \n isLoaded = ${isLoaded}`)
		router.push("/sign-in")
	}

  }, [isLoaded, isSignedIn]);
if (!isLoaded || !isSignedIn) return null
  return (
    <ReactLenis root>
    <div className="font-radley dark:text-white dark:bg-black">
      <Nav />

      <main className="flex w-full items-start justify-center mt-8 ">
	  	<div className="flex flex-col w-full min-h-[240vh]">
			<h2 className="text-xl text-center my-5">
				Hello {user.username}, Please Fill out this Quick Survey! 
	  		</h2>
	  	<div className="flex flex-col w-full flex-grow justify-around">
		<div className="flex flex-col min-h-[60vh] w-full  my-auto mx-auto max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
	  		<h3 className="text-lg">1. Type of Conversation? </h3>
	  		<div className="flex flex-col space-y-4 mx-8 my-2 flex-grow justify-around" id="first" onChange={(e) => change_func(e.target.value, typeOfConversationChange, '#second')} >
	  		<label>
			<input type='radio' value="Laugh" name="convtype"/> A Good Laugh
	  		</label>
	  		<label>
			<input type='radio' value="Heard" name="convtype"/> To Feel Heard 
	  		</label>
	  		<label>
			<input type='radio' value="Friend" name="convtype"/> Make A New Friend 
	  		</label>
	  		<label>
			<input type='radio' value="Talk" name="convtype"/> A Deep Talk 
	  		</label>
	  		</div>
	  	</div>
		<div id="second" className="flex flex-col min-h-[60vh] w-full my-auto mx-auto max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
	  		<h3 className="text-lg">2. How are you feeling today? </h3>
	  		<div className="flex flex-col space-y-4 mx-8 my-2 flex-grow justify-around" onChange={(e) => change_func(e.target.value, moodChange, '#third')} >
	  		<label>
			<input type='radio' value="Good" name="feeling"/> Feeling Pretty Good 
	  		</label>
	  		<label>
			<input type='radio' value="Down" name="feeling"/> Kinda Down 
	  		</label>
	  		<label>
			<input type='radio' value="Neutral" name="feeling"/> Just Passing Time 
	  		</label>
	  		<label>
			<input type='radio' value="Anxious" name="feeling"/> Anxious or Overwhelmed
	  		</label>
	  		</div>
	  	</div>
		<div id="third" className="flex flex-col min-h-[60vh] w-full my-auto mx-auto max-w-2xl bg-white dark:bg-black border-2 border-black dark:border-white p-8 rounded-md shadow">
	  		<h3 className="text-lg">3. Interests ? (pick two) </h3>
	  		<div className="flex flex-col space-y-4 mx-8 my-2 flex-grow justify-around"  >
	  			{checkbox_vals.map(({value, title}) => 
				<label key={title}>
				<input type='checkbox' value={value} name="feeling" onChange={(e)=>check_box(e,interestsChange)} checked={interestsVal.includes(value)} disabled={ interestsVal.length == 2 && !interestsVal.includes(value)}/>
					{title}
				</label>
				)}
	  		</div>
	  	</div>
		</div>
	  	<button class="bg-white text-black self-center p-4" onClick={async (e ) => await submit_form(input_form) }>continue</button>
	  	</div>
	  
      </main>

      <footer className="mt-12">
        <p className="text-1xl items-center justify-center text-center mb-3">
          made with 🖤
        </p>
      </footer>
    </div>
	  </ReactLenis>
  );
}

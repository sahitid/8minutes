import HeadObject from '../components/head'
import Nav from '../components/nav';

export default function Home() {
  return (
    <div className="dark:text-white dark:bg-black">
      <HeadObject>
        {/* Can put extra tags in here, or leave it blank */}
      </HeadObject>
      <Nav />
      It only takes 8 minutes with a friend to feel less alone. Our platform pairs strangers together for short, impactful conversations. Connect with someone new, share experiences, and foster a sense of belonging—all in just eight minutes.
    </div>
  )
}

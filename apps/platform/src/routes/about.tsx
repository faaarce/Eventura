import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className='px-4 py-12'>
        <h1>About Page</h1>
    </div>
  )
}

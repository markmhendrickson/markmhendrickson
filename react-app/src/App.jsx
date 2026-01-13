import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Posts from './pages/Posts'
import Post from './pages/Post'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/posts" element={<Layout><Posts /></Layout>} />
        <Route path="/posts/:slug" element={<Layout><Post /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

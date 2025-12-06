import { Routes, Route } from 'react-router'

import Layout from './components/Layout'

import SignIn from './pages/SignIn'
import FavouriteMarkets from './pages/FavouriteMarkets'
import UserSettings from './pages/UserSettings'

import Home from './pages/Home'

import Markets from './pages/Markets'
import CityMarkets from './pages/CityMarkets'
import ForeignMarkets from './pages/ForeignMarkets'
import ItemDetails from './pages/ItemDetails'
import Resale from './pages/Resale'
import Time from './pages/Time'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/favourites" element={<FavouriteMarkets />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/city-markets" element={<CityMarkets />} />
        <Route path="/foreign-markets" element={<ForeignMarkets />} />
        <Route path="/item/:itemId" element={<ItemDetails />} />
        <Route path="/resale" element={<Resale />} />
        <Route path="/time" element={<Time />} />

        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  )
}

export default App

import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Markets from "./pages/Markets";
import ForeignMarkets from "./pages/ForeignMarkets";
import LocalMarkets from "./pages/LocalMarkets";
import ItemDetails from "./pages/ItemDetails";
import Resale from "./pages/Resale";
import Time from "./pages/Time";
import FavouriteMarkets from "./pages/FavouriteMarkets";
import UserSettings from "./pages/UserSettings";
// import Trading from "./pages/Trading";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/foreign-markets" element={<ForeignMarkets />} />
        <Route path="/local-markets" element={<LocalMarkets />} />
        <Route path="/item/:itemId" element={<ItemDetails />} />
        <Route path="/resale" element={<Resale />} />
        <Route path="/time" element={<Time />} />
        <Route path="/favourites" element={<FavouriteMarkets />} />
        <Route path="/settings" element={<UserSettings />} />

        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;

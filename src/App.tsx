import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom";
import StartPage from "../pages/startPage";
import GamePage from "../pages/gamePage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<StartPage/>}/>
        <Route path={"/game"} element={<GamePage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App

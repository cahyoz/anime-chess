import "./App.css";
import ChessBoard from "./components/ChessBoard";

function App() {
  return (
    <div className="flex flex-row ">
      {/* <Prototype /> */}
      <div className="w-full max-w-[70%] aspect-square">
        <ChessBoard />
      </div>
      <div className="p-4 bg-blue-500 text-white rounded">
        Tailwind is working!
      </div>
    </div>
  );
}

export default App;

import { useEffect, useRef, useState } from "react";
import "./App.css";
import ChessBoard from "./components/ChessBoard";
import Character from "./character";
import { Chess } from "chess.js";

function App() {
  const [gameState, setGameState] = useState(null);
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [engineMove, setEngineMove] = useState(null);
  const [evaluationLog, setEvaluationLog] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [inputValue, setInputValue] = useState("");
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("key"));

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  // console.log(
  //   "enginemove : ",
  //   engineMove,
  //   "eval : ",
  //   positionEvaluation,
  //   "gamestate : ",
  //   gameState
  // );

  useEffect(() => {
    setEvaluationLog((prevArray) => [...prevArray, positionEvaluation]);
  }, [positionEvaluation]);

  const handleSubmit = () => {
    setApiKey(inputValue);
    sessionStorage.setItem("key", inputValue);
  };

  return (
    <div className="flex flex-row ">
      {/* <Prototype /> */}
      <div className="w-full max-w-[70%] aspect-square">
        <ChessBoard
          onEngineMove={setEngineMove}
          onPositionEvaluation={setPositionEvaluation}
          onGameState={setGameState}
          isGenerating={isGenerating}
          chessPosition={chessPosition}
          setChessPosition={setChessPosition}
          chessGame={chessGame}
        />
      </div>
      <div className="p-4 bg-[#EFBF6A] h-fit w-[30%] text-white rounded">
        {!apiKey ? (
          <div className="flex flex-col gap-4">
            <div className="w-full relative h-80 overflow-hidden text-black">
              <img
                src="/hikarin/tired.png"
                alt=""
                className="absolute left-10 top-30 scale-150"
              />
            </div>
            <div className="flex flex-col gap-2 bg-[#43558D]">
              <p>
                hikarin is poor ╥﹏╥, please provide your own gemini api key to
                play, thank you!
              </p>
              <p>
                get your own api key{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                >
                  here
                </a>
              </p>
              <input
                className="bg-amber-50 text-black"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button onClick={handleSubmit}>submit</button>
            </div>
          </div>
        ) : (
          <Character
            engineMove={engineMove}
            positionEvaluation={positionEvaluation}
            chessGame={gameState}
            isGenerating={isGenerating}
            onGenerating={setIsGenerating}
            setChessPosition={setChessPosition}
          />
        )}
      </div>
      {/* <div>
        <ul>
          {evaluationLog.map((element, index) => (
            <li key={index}>{element}</li>
          ))}
        </ul>
      </div> */}
    </div>
  );
}

export default App;

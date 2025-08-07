import { useEffect, useState } from "react";
import "./App.css";
import ChessBoard from "./components/ChessBoard";
import Character from "./character";

function App() {
  const [gameState, setGameState] = useState(null);
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [engineMove, setEngineMove] = useState(null);
  const [evaluationLog, setEvaluationLog] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <div className="flex flex-row ">
      {/* <Prototype /> */}
      <div className="w-full max-w-[70%] aspect-square">
        <ChessBoard
          onEngineMove={setEngineMove}
          onPositionEvaluation={setPositionEvaluation}
          onGameState={setGameState}
          isGenerating={isGenerating}
        />
      </div>
      <div className="p-4 bg-blue-500 w-full max-w-[30%] text-white rounded">
        <Character
          engineMove={engineMove}
          positionEvaluation={positionEvaluation}
          chessGame={gameState}
          isGenerating={isGenerating}
          onGenerating={setIsGenerating}
        />
      </div>
      <div>
        <ul>
          {evaluationLog.map((element, index) => (
            <li key={index}>{element}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

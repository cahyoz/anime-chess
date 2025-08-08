import { useEffect, useMemo, useRef, useState } from "react";
import Engine from "../../public/stockfish/engine";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

// Add the props to the function signature
export default function ChessBoard({
  onEngineMove,
  onPositionEvaluation,
  onGameState,
  isGenerating,
  chessPosition,
  setChessPosition,
  chessGame,
}) {
  const engine = useMemo(() => new Engine(), []);

  const [depth, setDepth] = useState(3);
  const [bestLine, setBestLine] = useState("");
  const [possibleMate, setPossibleMate] = useState("");
  // Remove the state for engineMove, userMove, and positionEvaluation
  // const [positionEvaluation, setPositionEvaluation] = useState(0);
  // const [engineMove, setEngineMove] = useState("");
  // const [userMove, setUserMove] = useState("");

  useEffect(() => {
    const runFindBestMove = async () => {
      if (!chessGame.isGameOver() || chessGame.isDraw()) {
        if (chessGame.turn() === "b") {
          const bestMove = await findBestMove();
          moveAi(bestMove);
        }
      }
    };
    runFindBestMove();
  }, [chessPosition]);

  function findBestMove() {
    return new Promise((resolve) => {
      engine.evaluatePosition(chessGame.fen(), depth);
      let latestEval = {
        rawEval: null,
        depth: null,
        possibleMate: null,
        pv: null,
        bestMove: null,
      };

      engine.onMessage(
        ({
          uciMessage,
          positionEvaluation,
          possibleMate,
          pv,
          depth,
          bestMove,
        }) => {
          // Update local temp values as Stockfish keeps calculating
          if (positionEvaluation) {
            latestEval.rawEval =
              ((chessGame.turn() === "w" ? 1 : -1) *
                Number(positionEvaluation)) /
              100;
          }
          if (possibleMate) latestEval.possibleMate = possibleMate;
          if (depth) latestEval.depth = depth;
          if (pv) latestEval.pv = pv;
          if (bestMove) latestEval.bestMove = bestMove;

          // When we receive the final signal
          if (uciMessage.startsWith("bestmove")) {
            onPositionEvaluation(latestEval.rawEval);
            onGameState(chessGame);
            onEngineMove(bestMove);
            resolve(latestEval.bestMove);
            // setPossibleMate(latestEval.possibleMate);
            // setDepth(latestEval.depth);
            // setBestLine(latestEval.pv);
            // if (chessGame.turn() === "b") {
            //   setTimeout(moveAi(latestEval.bestMove), 1000);
            // }
          }
        }
      );
    });
  }

  function moveAi(bestMove) {
    if (chessGame.turn() === "b") {
      const move = bestMove.split(" ")[0]; // e.g. "e2e4"
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      try {
        // Call the function passed from the parent instead of the local state setter
        chessGame.move({ from, to, promotion: "q" });
      } catch (err) {
        console.warn("Failed to make engine move:", err);
      }
    }
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) {
      return false;
    }

    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
      setPossibleMate("");

      // update the game state
      setChessPosition(chessGame.fen());

      // stop the engine (it will be restarted by the useEffect running findBestMove)
      engine.stop();

      // if the game is over, return false
      if (chessGame.isGameOver() || chessGame.isDraw()) {
        return false;
      }

      // return true as the move was successful
      return true;
    } catch {
      // return false as the move was not successful
      return false;
    }
  }

  // Remove the console.logs for the removed local state
  // console.log("enginemove", engineMove);
  // console.log("usermove", userMove);

  const chessboardOptions = {
    animationDurationInMs: 500,
    position: chessPosition,
    onPieceDrop,
  };

  return <Chessboard options={chessboardOptions} />;
}

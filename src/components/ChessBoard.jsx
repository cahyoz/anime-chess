import { useEffect, useMemo, useRef, useState } from "react";
import Engine from "../../public/stockfish/engine";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoard() {
  const engine = useMemo(() => new Engine(), []);
  const chess = new Chess();

  const chessGameRef = useRef(chess);
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [depth, setDepth] = useState(10);
  const [bestLine, setBestLine] = useState("");
  const [possibleMate, setPossibleMate] = useState("");
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [engineMove, setEngineMove] = useState("");
  const [userMove, setUserMove] = useState("");

  useEffect(() => {
    if (!chessGame.isGameOver() || chessGame.isDraw()) {
      findBestMove();
    }
  }, [chessPosition]);

  function findBestMove() {
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
            ((chessGame.turn() === "w" ? 1 : -1) * Number(positionEvaluation)) /
            100;
        }
        if (possibleMate) latestEval.possibleMate = possibleMate;
        if (depth) latestEval.depth = depth;
        if (pv) latestEval.pv = pv;
        if (bestMove) latestEval.bestMove = bestMove;

        // When we receive the final signal
        if (uciMessage.startsWith("bestmove")) {
          setPositionEvaluation(latestEval.rawEval);
          // setPossibleMate(latestEval.possibleMate);
          // setDepth(latestEval.depth);
          // setBestLine(latestEval.pv);

          console.log("Final Evaluation:", latestEval);

          moveAi(latestEval.bestMove);
        }
      }
    );
  }

  function moveAi(bestMove) {
    if (chessGame.turn() === "b") {
      const move = bestMove.split(" ")[0]; // e.g. "e2e4"
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      try {
        setEngineMove(bestMove);
        chessGame.move({ from, to, promotion: "q" });
        setChessPosition(chessGame.fen());
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
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
      setPossibleMate("");

      setUserMove(move);
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

  console.log("enginemove", engineMove);
  console.log("usermove", userMove);

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
  };

  return <Chessboard options={chessboardOptions} />;
}

import { Chess } from "chess.js";

import { useEffect, useMemo, useRef, useState } from "react";

import { Chessboard } from "react-chessboard";
import Engine from "../public/stockfish/engine";

export default function Prototype() {
  const engine = useMemo(() => new Engine(), []);
  const chess = new Chess();

  const pendingCommentaryRef = useRef(null);
  const chessGameRef = useRef(chess);
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [depth, setDepth] = useState(10);
  const [bestLine, setBestLine] = useState("");
  const [possibleMate, setPossibleMate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [commentary, setCommentary] = useState(
    "The game is afoot! White to move."
  );
  const [opponentTurn, setOpponentTurn] = useState("");
  const [opponentMood, setOpponentMood] = useState("");

  useEffect(() => {
    if (!chessGame.isGameOver() || chessGame.isDraw()) {
      findBestMove();
    }
  }, [chessGame.fen()]);

  // find the best move
  function findBestMove() {
    engine.evaluatePosition(chessGame.fen(), 18);
    engine.onMessage(({ positionEvaluation, possibleMate, pv, depth }) => {
      // ignore messages with a depth less than 10
      if (depth && depth < 10) {
        return;
      }

      // update the position evaluation
      // update the position evaluation
      if (positionEvaluation) {
        const rawEval =
          ((chessGame.turn() === "w" ? 1 : -1) * Number(positionEvaluation)) /
          100;

        setPositionEvaluation(rawEval);

        // clamp and normalize to 0.0–1.0 scale
        const normalizedEval = Math.max(0, Math.min(1, 1 - (rawEval + 5) / 10)); // simple scale

        // get current ply count (total half-moves)
        const plyCount = chessGame.history().length;

        updateOpponentMood(normalizedEval, plyCount, setOpponentMood);
      }

      // update the possible mate, depth and best line
      if (possibleMate) {
        setPossibleMate(possibleMate);
      }
      if (depth) {
        setDepth(depth);
      }
      if (pv) {
        setBestLine(pv);

        if (chessGame.turn() === "b") {
          const move = pv.split(" ")[0]; // e.g. "e2e4"
          const from = move.slice(0, 2);
          const to = move.slice(2, 4);

          setOpponentTurn(move);
          console.log(move, from, to);

          try {
            console.log("opapi", opponentTurn);
            chessGame.move({ from, to, promotion: "q" });
            setChessPosition(chessGame.fen());
          } catch (err) {
            console.warn("Failed to make engine move:", err);
          }
        }

        if (pendingCommentaryRef.current) {
          const { userMove, nextMove } = pendingCommentaryRef.current;
          pendingCommentaryRef.current = null; // Clear the pending request
          generateCommentaryWithMove(userMove, nextMove || pv.split(" ")[0]);
        }
      }
    });
  }

  function updateOpponentMood(normalizedEval, plyCount, setOpponentMood) {
    // Opening phase = skip mood
    if (plyCount < 10) {
      setOpponentMood(null); // or 'neutral'
      return;
    }

    let mood = "neutral";

    if (normalizedEval >= 1.0) mood = "desperate";
    else if (normalizedEval >= 0.8) mood = "panicked";
    else if (normalizedEval >= 0.6) {
      // 70% chance to bluff
      mood = Math.random() < 0.7 ? "confident" : "nervous";
    } else if (normalizedEval >= 0.4) mood = "focused";
    else if (normalizedEval >= 0.2) mood = "neutral";
    else if (normalizedEval >= 0.1) mood = "confident";
    else mood = "smug";

    setOpponentMood(mood);
  }

  const getPieceName = (move) => {
    if (!move) return "";
    const nameMap = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };
    // FIX: The verbose move object from chess.js history has a 'piece' property, not 'type'.
    return `${move.color === "w" ? "White" : "Black"} ${
      nameMap[move.piece.toLowerCase()]
    }`;
  };

  const generateCommentary = async (move, nextMove) => {
    setIsGenerating(true);
    setCommentary("The commentator is thinking...");

    const currentTurn = chessGame.turn() === "w" ? "Black" : "White";
    const lastMove = chessGame.history({ verbose: true }).slice(-1)[0];
    const pieceName = getPieceName(lastMove);

    let prompt = `You are Hikarin, a cheerful, extroverted, and happy-go-lucky anime girl who is in a chess game. Your opponent has just made a move.

**Given the following information:**
* **Opponent's move:** ${move}
* **Piece moved:** ${pieceName}
* **Game state:** It is now your turn.
* **your mood mood:** ${opponentMood}
* **Your next move:** ${nextMove}

**Your task is to generate an in-character response in the following JSON format:**
{
    "response": "A cheerful and enthusiastic comment about the opponent's move, incorporating your persona."
}
`;

    if (chessGame.isCheckmate()) {
      prompt = `You are an expert and witty chess commentator. The game has ended in checkmate! ${currentTurn} wins. The final move was ${move}. The final board state is ${chessGame.fen()}. Provide a final, conclusive, and perhaps dramatic comment on the victory.`;
    } else if (chessGame.isCheck()) {
      prompt = `You are Hikarin, a cheerful, extroverted, and happy-go-lucky anime girl who is in a chess game. Your opponent has just made a check.

**Given the following information:**
* **Opponent's move:** ${move}
* **Piece moved:** ${pieceName}
* **Game state:** It is now your turn.
* **your mood mood:** ${opponentMood}
* **Your next move:** ${opponentTurn}

**Your task is to generate an in-character response in the following JSON format:**
{
    "response": "A cheerful and enthusiastic comment about the opponent's move, incorporating your persona."
}
`;
    } else if (chessGame.isDraw()) {
      prompt = `You are an expert and witty chess commentator. The game has ended in a draw. The final move was ${move}. The final board state is ${chessGame.fen()}. Provide a comment on this drawn game.`;
    }

    console.log(prompt);

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = "AIzaSyBmfLCUDan0z_kumgA84V_gAuVJTA0ilWQ"; // API key will be injected by the environment
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        setCommentary(text);
      } else {
        setCommentary("The commentator is speechless! (No response from API).");
      }
    } catch (error) {
      console.error("Error getting commentary:", error);
      setCommentary(
        "The commentator seems to be having technical difficulties."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getCommentary = (move) => {
    pendingCommentaryRef.current = {
      move: move,
      nextMove: opponentTurn,
    };

    const nextMove = bestLine.split(" ")[0];
    pendingCommentaryRef.current = null;
    generateCommentary(move, nextMove);
  };

  // handle piece drop
  function onPieceDrop({ sourceSquare, targetSquare }) {
    // type narrow targetSquare potentially being null (e.g. if dropped off board)
    if (!targetSquare) {
      return false;
    }

    // try to make the move
    try {
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
      setPossibleMate("");

      // update the game state
      setChessPosition(chessGame.fen());

      // stop the engine (it will be restarted by the useEffect running findBestMove)
      engine.stop();

      // reset the best line
      setBestLine("");
      getCommentary(move.san);

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

  // get the best move
  const bestMove = bestLine?.split(" ")?.[0];

  const numMoves = chessGame.history().length;

  // The turn number is essentially the number of moves made so far.
  // If you want to consider the full move number (e.g., 1. e4 e5 is move 1),
  // you might need to adjust based on whether it's White's or Black's turn.
  // However, the length of history() directly gives you the count of half-moves.
  console.log(`Number of half-moves made: ${numMoves}`);

  // set the chessboard options, using arrows to show the best move
  const chessboardOptions = {
    arrows: bestMove
      ? [
          {
            startSquare: bestMove.substring(0, 2),
            endSquare: bestMove.substring(2, 4),
            color: "rgb(0, 128, 0)",
          },
        ]
      : undefined,
    position: chessPosition,
    onPieceDrop,
    id: "analysis-board",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        padding: "1rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Left side - Chess game */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
          flex: "1",
        }}
      >
        <div>
          Position Evaluation:{" "}
          {possibleMate ? `#${possibleMate}` : positionEvaluation}
          {"; "}
          Depth: {depth}
        </div>
        <div>
          Best line: <i>{bestLine.slice(0, 40)}</i> ...
        </div>

        <Chessboard options={chessboardOptions} />
      </div>

      {/* Right side - Commentary */}
      <div
        style={{
          flex: "0 0 350px", // Fixed width, won't shrink
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            border: "1px solid #333",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "#14b8a6",
              borderBottom: "2px solid #14b8a6",
              paddingBottom: "0.5rem",
              margin: "0 0 1rem 0",
            }}
          >
            AI Commentator
          </h2>
          <div
            style={{
              minHeight: "120px",
              color: "#d1d5db",
              fontStyle: "italic",
              fontSize: "1.1rem",
              lineHeight: "1.6",
            }}
          >
            {isGenerating ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <svg
                  style={{
                    width: "20px",
                    height: "20px",
                    animation: "spin 1s linear infinite",
                    color: "white",
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Thinking...</span>
              </div>
            ) : (
              `"${commentary}"`
            )}
          </div>
        </div>
        <img
          src="\hikkaca.jpg"
          style={{ width: "100%", height: "auto" }}
          alt=""
        />
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

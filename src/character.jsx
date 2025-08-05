import { useEffect } from "react";

export default function character(
  userMove,
  engineMove,
  positionEvaluation,
  chessGame
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [commentary, setCommentary] = useState("");

  useEffect(() => {
    if ((userMove || engineMove) && chessGame) {
      const lastMove = chessGame.history({ verbose: true }).slice(-1)[0];
      if (lastMove) {
        getCommentary(lastMove);
      }
    }
  }, [userMove, engineMove, chessGame]);

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

  const getCommentary = async (move) => {
    setIsGenerating(true);
    setCommentary("The commentator is thinking...");

    const currentTurn = chessGame.turn() === "w" ? "Black" : "White";
    const lastMove = chessGame.history({ verbose: true }).slice(-1)[0];
    const pieceName = getPieceName(lastMove);

    let prompt = `“you are hikarin A cherful extroverted, and happy go lucky anime girl, and is currently in a chess game. Current opponent move is ${move} the piece moved was ${pieceName} The current board state in FEN is: ${chessGame.fen()} And your opponent evaluation is ${positionEvaluation}. Generate an appropriate in character response in this json format only
{
response :
}”`;

    if (chessGame.isCheckmate()) {
      prompt = `You are an expert and witty chess commentator. The game has ended in checkmate! ${currentTurn} wins. The final move was ${move}. The final board state is ${chessGame.fen()}. Provide a final, conclusive, and perhaps dramatic comment on the victory.`;
    } else if (chessGame.isCheck()) {
      prompt = `You are an expert and witty chess commentator. The move ${move} has put the opponent in check! The piece moved was the ${pieceName}. The current board state is ${chessGame.fen()}. Provide an exciting comment about this check.`;
    } else if (chessGame.isDraw()) {
      prompt = `You are an expert and witty chess commentator. The game has ended in a draw. The final move was ${move}. The final board state is ${chessGame.fen()}. Provide a comment on this drawn game.`;
    }

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

  return (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-2xl shadow-lg mt-8 text-center w-full">
      <h2 className="text-xl font-bold text-blue-600 dark:text-blue-300">
        Hikarin's Commentary
      </h2>
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {isGenerating ? (
          <span className="text-gray-500 dark:text-gray-400 animate-pulse">
            Loading...
          </span>
        ) : (
          <p className="italic text-gray-700 dark:text-gray-300">
            "{commentary}"
          </p>
        )}
      </div>
    </div>
  );
}

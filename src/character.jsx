import { useEffect, useState } from "react";

export default function Character({
  engineMove,
  positionEvaluation,
  chessGame,
  isGenerating,
  onGenerating,
  setChessPosition,
}) {
  const [commentary, setCommentary] = useState("");
  useEffect(() => {
    if (!chessGame) return;
    // keep this for debug
    // logValues();
    const runMood = async () => {
      CharacterMood(positionEvaluation, getCommentary);
    };
    runMood();
  }, [engineMove]);

  const getPieceName = (pieceObject) => {
    if (!pieceObject) {
      return "";
    }
    const nameMap = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };

    let pieceType = null;

    if (pieceObject.type) {
      pieceType = pieceObject.type;
    } else if (pieceObject.piece) {
      pieceType = pieceObject.piece;
    }

    if (pieceType) {
      return `${pieceObject.color === "w" ? "White" : "Black"} ${
        nameMap[pieceType.toLowerCase()]
      }`;
    }

    return "";
  };

  const getAttackedPieces = (attackingColor) => {
    const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const attackedPieces = [];

    const defendingColor = attackingColor === "w" ? "b" : "w";

    for (const file of files) {
      for (const rank of ranks) {
        const square = file + rank;

        if (chessGame.isAttacked(square, attackingColor)) {
          const pieceOnSquare = chessGame.get(square);

          if (pieceOnSquare && pieceOnSquare.color === defendingColor) {
            attackedPieces.push(pieceOnSquare);
          }
        }
      }
    }

    return attackedPieces;
  };

  const logFakePrompt = (mood) => {
    const currentTurn = chessGame.turn() === "w" ? "Black" : "White";
    const userAttackPiece = getAttackedPieces("w");
    const AIAttackPiece = getAttackedPieces("b");

    const userAttackPieceNames = userAttackPiece
      .map((piece) => {
        return getPieceName(piece);
      })
      .join(", ");

    const AIAttackPieceNames = AIAttackPiece.map((piece) => {
      return getPieceName(piece);
    }).join(", ");

    console.log(userAttackPieceNames);

    const userMove = chessGame
      .history({ verbose: true })
      .filter((m) => m.color === "w")
      .at(-1);

    const AImove = chessGame
      .history({ verbose: true })
      .filter((m) => m.color === "b")
      .at(-1);

    console.log("usermove : ", userMove, typeof userMove);

    const userMoveText = userMove?.lan ?? "an unknown move";
    const AImoveText = AImove?.lan ?? "an unknown move";
    const userPiece = getPieceName(userMove);
    const AIpiece = getPieceName(AImove);
    const prompt = `
You are Hikarin, a cheerful, extroverted, happy-go-lucky anime girl currently playing a chess game.

- The opponent (White) just played **${userMoveText}** using their ${userPiece} attacking your ${
      userAttackPieceNames.length > 0 ? userAttackPieceNames : "nothing"
    }.
- It is now your turn (${currentTurn}).
- Your move is **${AImoveText}** using your ${AIpiece} to attack ${
      AIAttackPieceNames.length > 0 ? AIAttackPieceNames : "nothing"
    }.
- Due to the position evaluation on the board your mood is ${mood}.

respond as Hikarin while staying in character!

Respond only in this JSON format:

{
  "response": "<your commentary here>"
}
`;
    console.log("prompt: ", prompt);
  };

  const getCommentary = async (mood) => {
    onGenerating(true);
    setCommentary();
    const userAttackPiece = getAttackedPieces("w");
    const AIAttackPiece = getAttackedPieces("b");

    const currentTurn = chessGame.turn() === "w" ? "Black" : "White";

    const userMove = chessGame
      .history({ verbose: true })
      .filter((m) => m.color === "w")
      .at(-1);
    const AImove = chessGame
      .history({ verbose: true })
      .filter((m) => m.color === "b")
      .at(-1);

    const userMoveText = userMove?.san ?? "an unknown move";
    const AImoveText = AImove?.san ?? "an unknown move";
    const userPiece = getPieceName(userMove);
    const AIpiece = getPieceName(AImove);

    const userAttackPieceNames = userAttackPiece
      .map((piece) => {
        return getPieceName(piece);
      })
      .join(", ");

    const AIAttackPieceNames = AIAttackPiece.map((piece) => {
      return getPieceName(piece);
    }).join(", ");

    console.log(userAttackPieceNames);
    let prompt = `
You are Hikarin, a cheerful, extroverted, happy-go-lucky girl currently playing a chess game.

- The opponent (White) just played **${userMoveText}** using their ${userPiece} attacking your ${
      userAttackPieceNames.length > 0 ? userAttackPieceNames : "nothing"
    }.
- It is now your turn black.
- Your move is **${AImoveText}** using your ${AIpiece} to attack ${
      AIAttackPieceNames.length > 0 ? AIAttackPieceNames : "nothing"
    }.
- Due to the position evaluation on the board your mood is ${mood}.

respond as Hikarin while staying in character!

Respond only in this JSON format:

{
  "response": "<your commentary here>"
}
`;
    console.log("prompt: ", prompt);

    if (chessGame.isCheckmate()) {
      prompt = `
You are Hikarin, a cheerful, extroverted, happy-go-lucky anime girl currently playing a chess game and is already checkmate.

- The opponent (White) just played **${userMoveText}** using their ${userPiece} attacking your ${
        userAttackPieceNames.length > 0 ? userAttackPieceNames : "nothing"
      }.
- It is now your turn (${currentTurn}).
- Your move is **${AImoveText}** using your ${AIpiece} to attack ${
        AIAttackPieceNames.length > 0 ? AIAttackPieceNames : "nothing"
      }.
- Due to the position evaluation on the board your mood is ${mood}.

respond as Hikarin while staying in character!

Respond only in this JSON format:

{
  "response": "<your commentary here>"
}
`;
    } else if (chessGame.isCheck()) {
      prompt = `
You are Hikarin, a cheerful, extroverted, happy-go-lucky anime girl currently playing a chess game and is currently check.

- The opponent (White) just played **${userMoveText}** using their ${userPiece} attacking your ${
        userAttackPieceNames.length > 0 ? userAttackPieceNames : "nothing"
      }.
- It is now your turn (${currentTurn}).
- Your move is **${AImoveText}** using your ${AIpiece} to attack ${
        AIAttackPieceNames.length > 0 ? AIAttackPieceNames : "nothing"
      }.
- Due to the position evaluation on the board your mood is ${mood}.

respond as Hikarin while staying in character!

Respond only in this JSON format:

{
  "response": "<your commentary here>"
}
`;
    }

    console.log(prompt);

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = sessionStorage.getItem("key"); // API key will be injected by the environment
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
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setCommentary(parsed.response);
      } else {
        setCommentary("The commentator is speechless! (No response from API).");
      }
    } catch (error) {
      console.error("Error getting commentary:", error);
      setCommentary(
        "The commentator seems to be having technical difficulties."
      );
    } finally {
      onGenerating(false);
      setChessPosition(chessGame.fen());
      console.log("finnaly", isGenerating);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-2xl shadow-lg mt-8 text-center w-full">
      <div className="w-full relative h-80 overflow-hidden">
        {isGenerating ? (
          <img
            src="\hikarin\default.png"
            className="absolute left-10 top-30 scale-150"
            alt=""
          />
        ) : (
          <img
            src="\hikarin\yap1.png"
            className="absolute left-10 top-30 scale-150"
            alt=""
          />
        )}
      </div>
      <h2 className="text-xl font-bold text-blue-600 dark:text-blue-300">
        Hikarin
      </h2>
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {isGenerating ? (
          <span className="text-gray-500 dark:text-gray-400 animate-pulse">
            hmm...
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

export const CharacterMood = async (positionEvaluation, getCommentary) => {
  const flipEval = -positionEvaluation;
  const normalizeEval = flipEval / 10;

  console.log("normalize eval : ", normalizeEval);
  let mood = "neutral";

  if (normalizeEval >= 8) mood = "smug";
  else if (normalizeEval >= 5) mood = "confident";
  else if (normalizeEval >= 2) mood = "pleased";
  else if (normalizeEval >= 0.5) mood = "calm";
  else if (normalizeEval > -0.5) mood = "neutral";
  else if (normalizeEval > -2) mood = "uneasy";
  else if (normalizeEval > -4) mood = "nervous";
  else if (normalizeEval > -6) mood = "panicking";
  else mood = "desperate";

  // logFakePrompt(mood);
  await getCommentary(mood);
  console.log("current mood", mood);
};

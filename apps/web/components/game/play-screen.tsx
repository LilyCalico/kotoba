"use client";

import type { GameStart } from "@kotoba/shared";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";

import { AnswerFeedback } from "@/components/game/answer-feedback";
import { ErrorMessage } from "@/components/game/error-message";
import { GiveUpDialog } from "@/components/game/give-up-dialog";
import { Header } from "@/components/game/header";
import { HintButton } from "@/components/game/hint-button";
import { HintCard } from "@/components/game/hint-card";
import { InputForm } from "@/components/game/input-form";
import { LeafScatter } from "@/components/game/leaf-scatter";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { HINT_REQUEST_TEXT, PlayerMessage } from "@/components/game/player-message";
import { ResultCard } from "@/components/game/result-card";
import { TeaserCard } from "@/components/game/teaser-card";
import { VerdictMessage } from "@/components/game/verdict-message";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { type GameClient, GameClientError } from "@/lib/game/client";
import { createMockGameClient } from "@/lib/game/mock-client";
import {
  type ChatEntry,
  type GameAction,
  type GameState,
  createGameState,
  gameReducer,
  remainingHints,
} from "@/lib/game/state";

/** 設問の提示からチャットへ自動で移るまでの時間。 */
export const TEASER_DURATION_MS = 3000;

export const START_FAILED_TEXT = "Couldn't start a game.";
export const GIVE_UP_FAILED_TEXT = "Couldn't give up. Please try again.";

type PlayAction = GameAction | { type: "started"; start: GameStart };

/** `startGame` の応答を待つ間は `null`。応答が届いたら `gameReducer` に委ねる。 */
function playReducer(state: GameState | null, action: PlayAction): GameState | null {
  if (action.type === "started") return state ?? createGameState(action.start);
  return state && gameReducer(state, action);
}

/**
 * `/play` の画面。モックの `GameClient` を初回の描画で 1 回だけ作り、`GameScreen` に渡す。
 * `wordId` は `createMockGameClient` にそのまま渡し、出題単語を固定する。
 */
export function PlayScreen({ wordId }: { wordId?: string }) {
  const [client] = useState(() => createMockGameClient({ wordId }));
  return <GameScreen client={client} />;
}

/**
 * ゲーム 1 周の画面。描画した時点で新しいゲームを始め、画面を離れるとゲームは破棄される。
 * 設問の提示とチャットの 2 状態をとり、設問の提示は 3 秒で、またはクリックかキー入力で即座にチャットへ移る。
 */
export function GameScreen({ client }: { client: GameClient }) {
  const [game, dispatch] = useReducer(playReducer, null);
  const [attempt, setAttempt] = useState(0);
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => {
    // 開発時の Strict Mode ではエフェクトが 2 回走る。先に始めたゲームの応答は捨てる。
    let cancelled = false;
    client.startGame("sv").then(
      (start) => {
        if (!cancelled) dispatch({ type: "started", start });
      },
      (error: unknown) => {
        if (cancelled) return;
        if (!(error instanceof GameClientError)) throw error;
        setStartFailed(true);
        toast({
          title: START_FAILED_TEXT,
          action: {
            label: "Retry",
            onAction: () => {
              setStartFailed(false);
              setAttempt((count) => count + 1);
            },
          },
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, attempt]);

  const phase = game?.phase;
  useEffect(() => {
    if (phase !== "teaser") return;

    // 自動で移るときもクリックやキー入力で移るときも、フォーカスは動かさない。
    const enterChat = () => dispatch({ type: "chat-entered" });
    const timer = setTimeout(enterChat, TEASER_DURATION_MS);
    // pointerdown で移ると、続く click がチャットの同じ位置にある操作に当たるため、click を待つ。
    document.addEventListener("click", enterChat);
    document.addEventListener("keydown", enterChat);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", enterChat);
      document.removeEventListener("keydown", enterChat);
    };
  }, [phase]);

  return (
    <main className="flex h-dvh justify-center overflow-hidden">
      <div className="relative flex w-full max-w-[42rem] flex-col">
        {phase !== "chat" && <LeafScatter variant="teaser" />}
        {game?.phase === "chat" ? (
          <Chat client={client} dispatch={dispatch} state={game} />
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center px-5">
            {game ? (
              <TeaserCard teaser={game.teaser} variant="floating" />
            ) : (
              !startFailed && (
                <div>
                  <PendingIndicator />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * チャット。上からヘッダー、設問、ログ、ヒントボタンと入力欄を積み、ログだけをスクロールさせる。
 * 送信中は入力欄とヒントボタンを押せなくし、終了後は両方を畳む。
 */
function Chat({
  state,
  dispatch,
  client,
}: {
  state: GameState;
  dispatch: (action: GameAction) => void;
  client: GameClient;
}) {
  const [text, setText] = useState("");
  const [giveUpOpen, setGiveUpOpen] = useState(false);
  const [givingUp, setGivingUp] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const { gameId, status, entries, hintsUsed } = state;
  const sending = status === "sending";
  const finished = status === "finished";

  // 要素が増えたら末尾へ追従する。応答待ちのインジケーターの出入りでも高さが変わるため、`status` も見る。
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries.length, status]);

  async function send(input: string) {
    dispatch({ type: "input-sent", text: input });
    setText("");
    try {
      const result = await client.sendInput({ gameId, text: input });
      dispatch({ type: "input-resolved", result });
    } catch (error) {
      if (!(error instanceof GameClientError)) throw error;
      dispatch({ type: "failed" });
      setText(input);
    }
  }

  async function requestHint() {
    dispatch({ type: "hint-requested" });
    try {
      const hint = await client.revealHint(gameId, hintsUsed + 1);
      dispatch({ type: "hint-revealed", hint });
    } catch (error) {
      if (!(error instanceof GameClientError)) throw error;
      dispatch({ type: "failed" });
    }
  }

  async function giveUp() {
    setGivingUp(true);
    try {
      const result = await client.giveUp(gameId);
      dispatch({ type: "gave-up", result });
      setGiveUpOpen(false);
    } catch (error) {
      if (!(error instanceof GameClientError)) throw error;
      // ダイアログは開いたままにし、もう一度 Give up を押せば再試行になる。
      toast({ title: GIVE_UP_FAILED_TEXT });
    } finally {
      setGivingUp(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-col gap-4 pt-[env(safe-area-inset-top)]">
        <Header onGiveUp={finished ? undefined : () => setGiveUpOpen(true)} />
        <TeaserCard teaser={state.teaser} variant="pinned" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-4 pt-10 pb-6" ref={logRef}>
        {entries.map((entry) => (
          <Entry entry={entry} key={entry.id} />
        ))}
        {sending && <PendingIndicator />}
        {finished && (
          <Link className={buttonVariants({ className: "h-11 self-center px-6" })} href="/">
            Play again
          </Link>
        )}
      </div>
      {!finished && (
        <div className="flex shrink-0 flex-col gap-3 px-4 pb-3">
          <HintButton
            disabled={sending}
            onPress={requestHint}
            remaining={remainingHints(hintsUsed)}
          />
          <InputForm disabled={sending} onSubmit={send} onValueChange={setText} value={text} />
        </div>
      )}
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
      <GiveUpDialog
        isOpen={giveUpOpen}
        isPending={givingUp}
        onConfirm={giveUp}
        onOpenChange={setGiveUpOpen}
      />
    </>
  );
}

function Entry({ entry }: { entry: ChatEntry }) {
  switch (entry.kind) {
    case "player":
      return (
        <PlayerMessage
          text={entry.message.type === "text" ? entry.message.text : HINT_REQUEST_TEXT}
        />
      );
    case "verdict":
      return <VerdictMessage verdict={entry.verdict} />;
    case "answer-feedback":
      return <AnswerFeedback correct={entry.correct} />;
    case "hint":
      return <HintCard index={entry.hint.index} text={entry.hint.text} />;
    case "result":
      return (
        <ResultCard
          definition={entry.result.definition}
          outcome={entry.result.outcome}
          word={entry.result.word}
        />
      );
    case "error":
      return <ErrorMessage />;
  }
}

"use client";

import type { GameMode, GameStart, StartGameRequest } from "@kotoba/shared";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";

import { AnswerFeedback } from "@/components/game/answer-feedback";
import { ErrorMessage, ExpiredMessage, errorText } from "@/components/game/error-message";
import { GiveUpDialog } from "@/components/game/give-up-dialog";
import { Header } from "@/components/game/header";
import { HintButton } from "@/components/game/hint-button";
import { HintCard } from "@/components/game/hint-card";
import { InputForm } from "@/components/game/input-form";
import { chatItemAppear, chromeAppear } from "@/components/game/motion";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { PlayerMessage } from "@/components/game/player-message";
import { ResultCard } from "@/components/game/result-card";
import { TeaserCard } from "@/components/game/teaser-card";
import { UnsupportedLanguageMessage, VerdictMessage } from "@/components/game/verdict-message";
import { WordCard } from "@/components/game/word-card";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createApiGameClient } from "@/lib/game/api-client";
import { type GameClient, GameClientError } from "@/lib/game/client";
import {
  type PlayedWordsStorage,
  excludedWordIds,
  getBrowserStorage,
  recordPlayedWord,
} from "@/lib/game/played-words";
import {
  type AnnouncedEntry,
  type ChatEntry,
  type GameAction,
  type GameOpening,
  type GameState,
  createGameState,
  failureKind,
  finishedResult,
  gameReducer,
  latestAnnouncement,
  remainingHints,
} from "@/lib/game/state";
import { localizedPath } from "@/lib/i18n/locale";
import { GameModeProvider, useGameMode } from "@/lib/game/mode-context";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/messages";

/** 最初に見せるカード（設問か単語）の提示から、チャットへ自動で移るまでの時間。 */
export const TEASER_DURATION_MS = 3000;

/** 入力欄の置き場所。skip link の飛び先になる。 */
const PLAYER_INPUT_ID = "player-input";

/** 最初に見せるカード（設問か単語）の提示と、チャットのそのカードをつなぐ共有レイアウトの名前。 */
const OPENING_LAYOUT_ID = "opening";

type PlayAction = GameAction | { type: "started"; start: GameStart };

/** 出題済み単語の記録先。省略時はブラウザの `localStorage`、`null` なら記録しない。 */
function resolveStorage(storage: PlayedWordsStorage | null | undefined): PlayedWordsStorage | null {
  return storage === undefined ? getBrowserStorage() : storage;
}

/** 最初に見せるカード。単語当ては設問カード、意味当ては単語カード。 */
function OpeningCard({ opening, variant }: { opening: GameOpening; variant: "floating" | "pinned" }) {
  return opening.mode === "guess_meaning" ? (
    <WordCard
      layoutId={OPENING_LAYOUT_ID}
      reading={opening.reading}
      variant={variant}
      word={opening.word}
    />
  ) : (
    <TeaserCard layoutId={OPENING_LAYOUT_ID} teaser={opening.teaser} variant={variant} />
  );
}

/** `startGame` の応答を待つ間は `null`。応答が届いたら `gameReducer` に委ねる。 */
function playReducer(state: GameState | null, action: PlayAction): GameState | null {
  if (action.type === "started") return state ?? createGameState(action.start);
  return state && gameReducer(state, action);
}

/** `/[lang]/play` の画面。`apps/api` を叩く `GameClient` を初回の描画で 1 回だけ作り、`GameScreen` に渡す。 */
export function PlayScreen() {
  const [client] = useState(() => createApiGameClient());
  return <GameScreen client={client} />;
}

/**
 * ゲーム 1 周の画面。描画した時点で新しいゲームを始め、画面を離れるとゲームは破棄される。
 * 始まったゲームの遊び方を `GameModeProvider` で配り、画面の文言をその遊び方で引く。
 * 最初に見せるカード（単語当ては設問、意味当ては単語）の提示とチャットの 2 状態をとり、
 * 提示は 3 秒で、または Enter / Space / クリックで即座にチャットへ移る。
 *
 * 答えを見た単語（クリアかギブアップで届いた `wordId`）を `storage` に記録し、次のゲームの開始で
 * `excludeWordIds` として送る。`storage` を省略するとブラウザの `localStorage` を使い、`null` なら記録しない。
 * 記録は応答ではなく状態から 1 ゲームにつき 1 回だけ行う。正解の送信中にギブアップすると、どちらの応答も
 * 同じ単語を返すため、応答ごとに記録すると 2 回目で記録済みと判定され、記録が 1 件に戻ってしまう。
 */
export function GameScreen({
  client,
  storage,
}: {
  client: GameClient;
  storage?: PlayedWordsStorage | null;
}) {
  const locale = useLocale();
  const mode = useGameMode();
  const t = useMessages().play;
  const [game, dispatch] = useReducer(playReducer, null);
  const [attempt, setAttempt] = useState(0);
  const [startFailed, setStartFailed] = useState(false);
  const recordedGameId = useRef<string | null>(null);

  useEffect(() => {
    // 開発時の Strict Mode ではエフェクトが 2 回走る。先に始めたゲームの応答は捨てる。
    let cancelled = false;
    const request: StartGameRequest = {
      language: "sv",
      locale,
      mode,
      excludeWordIds: excludedWordIds(resolveStorage(storage)),
    };
    client.startGame(request).then(
      (start) => {
        if (!cancelled) dispatch({ type: "started", start });
      },
      (error: unknown) => {
        if (cancelled) return;
        if (!(error instanceof GameClientError)) throw error;
        // ゲームを始められなかったときは、失敗の種類によらず始め直しを促す。
        // レートリミットのときだけ、数え直されるまでの時間を添える。
        setStartFailed(true);
        toast({
          title: error.code === "rate_limited" ? t.startLimit(error.retryAfterSeconds) : t.startFailed,
          action: {
            label: t.retry,
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
  }, [client, storage, locale, mode, t, attempt]);

  const gameId = game?.gameId;
  const finishedWordId = game && finishedResult(game)?.wordId;
  useEffect(() => {
    if (!gameId || !finishedWordId || recordedGameId.current === gameId) return;
    recordedGameId.current = gameId;
    recordPlayedWord(resolveStorage(storage), finishedWordId);
  }, [gameId, finishedWordId, storage]);

  const phase = game?.phase;
  useEffect(() => {
    if (phase !== "teaser") return;

    // 自動で移るときも操作で移るときも、フォーカスは動かさない。
    const enterChat = () => dispatch({ type: "chat-entered" });
    // Tab やスクリーンリーダーの操作キーで、カードを読む前に進まないよう Enter と Space に絞る。
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      enterChat();
    };
    const timer = setTimeout(enterChat, TEASER_DURATION_MS);
    // pointerdown で移ると、続く click がチャットの同じ位置にある操作に当たるため、click を待つ。
    document.addEventListener("click", enterChat);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", enterChat);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [phase]);

  return (
    <GameModeProvider mode={game?.opening.mode ?? mode}>
      <div className="flex h-dvh justify-center overflow-hidden">
        <div className="relative flex w-full max-w-[42rem] flex-col">
          {game?.phase === "chat" ? (
            <Chat client={client} dispatch={dispatch} state={game} />
          ) : (
            <main className="flex flex-1 flex-col items-center justify-center px-5">
              <h1 className="sr-only">kotoba</h1>
              {game ? (
                <>
                  <OpeningCard opening={game.opening} variant="floating" />
                  <p className="sr-only">{t.teaserInstruction}</p>
                </>
              ) : (
                !startFailed && (
                  <div>
                    <PendingIndicator />
                  </div>
                )
              )}
            </main>
          )}
        </div>
      </div>
    </GameModeProvider>
  );
}

/**
 * チャット。上からヘッダー、最初に見せたカード（設問か単語）、ログ、ヒントボタンと入力欄を積み、ログだけをスクロールさせる。
 * 送信中は入力欄とヒントボタンを押せなくし、終了後は両方を畳む。
 *
 * 新しく確定した回答・正誤フィードバック・失敗はライブリージョンで読み上げる。
 * フォーカスは、回答と誤答ではその要素へ、ヒントの開示ではヒントカードへ、終了時は結果カードの見出しへ移す。
 * 失敗したときは、送信なら入力欄へ、ヒントならヒントボタンへ戻し、そのまま再試行できるようにする。
 * ゲームが見つからないときは案内を積んでゲームを終え、案内へフォーカスを移す。
 * ギブアップの確認中にゲームが終わったら、確認を閉じる。
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
  const locale = useLocale();
  const messages = useMessages();
  const mode = useGameMode();
  const t = messages.play;
  const [text, setText] = useState("");
  const [giveUpOpen, setGiveUpOpen] = useState(false);
  const [givingUp, setGivingUp] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const entryRef = useRef<HTMLElement | null>(null);

  const { gameId, status, entries, hintsUsed } = state;
  const sending = status === "sending";
  const finished = status === "finished";
  const announcement = latestAnnouncement(state);

  const last = entries.at(-1);
  const lastId = last?.id;
  const errorFocus = last?.kind === "error" ? last.request : null;

  // 要素が増えたら末尾へ追従する。応答待ちのインジケーターの出入りでも高さが変わるため、`status` も見る。
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries.length, status]);

  // 末尾に積まれた要素に応じてフォーカスを移す。プレイヤーの発言が積まれたときは `entryRef` が空で、動かさない。
  useEffect(() => {
    if (lastId === undefined) return;
    const target =
      errorFocus === "hint"
        ? hintRef.current
        : errorFocus === "input"
          ? inputRef.current
          : entryRef.current;
    target?.focus();
  }, [lastId, errorFocus]);

  async function send(input: string) {
    dispatch({ type: "input-sent", text: input });
    setText("");
    try {
      const result = await client.sendInput(gameId, { text: input });
      dispatch({ type: "input-resolved", result });
    } catch (error) {
      if (!(error instanceof GameClientError)) throw error;
      dispatch({ type: "failed", code: error.code, retryAfterSeconds: error.retryAfterSeconds });
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
      dispatch({ type: "failed", code: error.code, retryAfterSeconds: error.retryAfterSeconds });
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
      if (failureKind(error.code) === "expired") {
        dispatch({ type: "failed", code: error.code, retryAfterSeconds: error.retryAfterSeconds });
        setGiveUpOpen(false);
        return;
      }
      // ダイアログは開いたままにし、もう一度 Give up を押せば再試行になる。
      toast({ title: t.giveUpFailed });
    } finally {
      setGivingUp(false);
    }
  }

  return (
    <>
      {!finished && (
        <a
          className="sr-only border-[1.5px] border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground focus-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-20"
          href={`#${PLAYER_INPUT_ID}`}
          onClick={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {t.skipToInput}
        </a>
      )}
      <motion.div {...chromeAppear} className="shrink-0 pt-[env(safe-area-inset-top)]">
        <Header onGiveUp={finished ? undefined : () => setGiveUpOpen(true)} />
      </motion.div>
      <main className="flex min-h-0 flex-1 flex-col pt-1">
        <div className="shrink-0 px-5">
          <OpeningCard opening={state.opening} variant="pinned" />
        </div>
        <div
          // 上端をぼかし、スクロールした要素が上のカードの下へ消えていくように見せる。
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-6 pb-6 [mask-image:linear-gradient(to_bottom,transparent,black_1.5rem)]"
          ref={logRef}
        >
          {entries.map((entry) => (
            <ChatItem key={entry.id}>
              <Entry
                entry={entry}
                ref={
                  entry.id === lastId
                    ? (element) => {
                        entryRef.current = element;
                      }
                    : undefined
                }
              />
            </ChatItem>
          ))}
          {sending && (
            <ChatItem>
              <PendingIndicator slowNotice />
            </ChatItem>
          )}
          {finished && (
            <ChatItem>
              <Link
                className={buttonVariants({ size: "lg", className: "mt-4 mr-1" })}
                href={localizedPath(locale, "/")}
              >
                {t.playAgain}
              </Link>
            </ChatItem>
          )}
        </div>
        {!finished && (
          <motion.div
            {...chromeAppear}
            className="shrink-0 px-5 pt-2 pb-4"
            id={PLAYER_INPUT_ID}
          >
            <InputForm
              actions={
                <HintButton
                  disabled={sending}
                  onPress={requestHint}
                  ref={hintRef}
                  remaining={remainingHints(hintsUsed)}
                />
              }
              disabled={sending}
              onSubmit={send}
              onValueChange={setText}
              ref={inputRef}
              value={text}
            />
          </motion.div>
        )}
        <div className="sr-only" role="status">
          {announcement && <p key={announcement.id}>{announcementText(messages, mode, announcement)}</p>}
        </div>
      </main>
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
      <GiveUpDialog
        isOpen={giveUpOpen && !finished}
        isPending={givingUp}
        onConfirm={giveUp}
        onOpenChange={setGiveUpOpen}
      />
    </>
  );
}

/**
 * ログの 1 要素の出現。ログに積まれるすべての要素を包み、下からわずかに上がりながら現す。
 * 中身の左寄せ・右寄せ・中央寄せが効くよう、自身も縦の flex にする。
 */
function ChatItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...chatItemAppear} className="flex flex-col">
      {children}
    </motion.div>
  );
}

/** ライブリージョンで読み上げる文言。ログの要素が画面に出す文言と同じにする。 */
function announcementText(t: Messages, mode: GameMode, entry: AnnouncedEntry): string {
  switch (entry.kind) {
    case "verdict":
      return t.verdict[entry.verdict];
    case "unsupported-language":
      return t.unsupportedLanguage;
    case "answer-feedback":
      return (entry.correct ? t.answerFeedback.correct : t.answerFeedback.incorrect)[mode];
    case "error":
      return errorText(t.error, entry.code, entry.retryAfterSeconds);
  }
}

/**
 * ログの 1 要素。`ref` はフォーカス先になる要素にだけ渡る。
 * プレイヤーの発言とエラーはフォーカス先にならないため、`ref` を受けない。
 */
function Entry({
  entry,
  ref,
}: {
  entry: ChatEntry;
  ref?: (element: HTMLElement | null) => void;
}) {
  switch (entry.kind) {
    case "player":
      return <PlayerMessage text={entry.text} />;
    case "verdict":
      return <VerdictMessage ref={ref} verdict={entry.verdict} />;
    case "unsupported-language":
      return <UnsupportedLanguageMessage ref={ref} />;
    case "answer-feedback":
      return <AnswerFeedback correct={entry.correct} ref={ref} />;
    case "hint":
      return <HintCard index={entry.hint.index} ref={ref} text={entry.hint.text} />;
    case "result":
      return (
        <ResultCard ref={ref} result={entry.result} />
      );
    case "error":
      return <ErrorMessage code={entry.code} retryAfterSeconds={entry.retryAfterSeconds} />;
    case "expired":
      return <ExpiredMessage ref={ref} />;
  }
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { AnswerFeedback, answerText } from "@/components/game/answer-feedback";
import { ErrorMessage } from "@/components/game/error-message";
import { GiveUpDialog } from "@/components/game/give-up-dialog";
import { Header } from "@/components/game/header";
import { HintButton } from "@/components/game/hint-button";
import { HintCard } from "@/components/game/hint-card";
import { InputForm } from "@/components/game/input-form";
import { LeafScatter } from "@/components/game/leaf-scatter";
import { PendingIndicator } from "@/components/game/pending-indicator";
import { PlayerMessage } from "@/components/game/player-message";
import { ResultCard, resultHeading } from "@/components/game/result-card";
import { TeaserCard } from "@/components/game/teaser-card";
import { VerdictMessage, verdictText } from "@/components/game/verdict-message";
import { LinkButton } from "@/components/ui/button";
import { createMockGameClient } from "@/lib/game/mock-client";
import {
  type ChatEntry,
  latestAnnouncement,
  remainingHints,
  screenReducer,
} from "@/lib/game/state";

const TEASER_DURATION_MS = 3000;
const HINT_REQUEST_TEXT = "Give me a hint";

const PHASE_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;
const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function announcementText(entry: ChatEntry): string {
  switch (entry.kind) {
    case "verdict":
      return verdictText(entry.verdict);
    case "answer":
      return answerText(entry.correct);
    case "result":
      return `${resultHeading(entry.result.outcome)}: ${entry.result.word}. ${entry.result.definition}`;
    default:
      return "";
  }
}

function ChatAppear({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function PlayScreen({ wordId }: { wordId?: string }) {
  const client = useMemo(() => createMockGameClient({ wordId }), [wordId]);
  const [state, dispatch] = useReducer(screenReducer, null);
  const [draft, setDraft] = useState("");
  const [isGiveUpOpen, setGiveUpOpen] = useState(false);
  const [hasStartFailed, setStartFailed] = useState(false);

  const announcementRef = useRef<HTMLElement | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const captureAnnouncement = useCallback((node: HTMLElement | null) => {
    announcementRef.current = node;
  }, []);

  useEffect(() => {
    let cancelled = false;

    client
      .startGame("sv")
      .then((start) => {
        if (!cancelled) dispatch({ type: "start", start });
      })
      .catch(() => {
        if (!cancelled) setStartFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const phase = state?.phase;
  useEffect(() => {
    if (phase !== "teaser") return;

    const timer = setTimeout(
      () => dispatch({ type: "enter-chat" }),
      TEASER_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  const announcement = state ? latestAnnouncement(state) : undefined;
  const announcementId = announcement?.id;
  useEffect(() => {
    if (!announcementId) return;
    announcementRef.current?.focus();
  }, [announcementId]);

  const entryCount = state?.entries.length ?? 0;
  useEffect(() => {
    if (entryCount === 0) return;
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [entryCount]);

  const send = useCallback(
    async (text: string) => {
      if (!state) return;

      dispatch({ type: "send", id: crypto.randomUUID(), text });
      try {
        const result = await client.sendInput({ gameId: state.gameId, text });
        if (result.kind === "question") {
          dispatch({
            type: "verdict",
            id: crypto.randomUUID(),
            verdict: result.verdict,
          });
          return;
        }

        dispatch({
          type: "answer",
          id: crypto.randomUUID(),
          correct: result.correct,
        });
        if (result.result) {
          dispatch({
            type: "finish",
            id: crypto.randomUUID(),
            result: result.result,
          });
        }
      } catch {
        dispatch({ type: "fail", id: crypto.randomUUID() });
        setDraft(text);
      }
    },
    [client, state],
  );

  const submit = useCallback(
    (text: string) => {
      setDraft("");
      void send(text);
    },
    [send],
  );

  const revealHint = useCallback(async () => {
    if (!state) return;

    const index = state.hintsUsed + 1;
    dispatch({
      type: "send",
      id: crypto.randomUUID(),
      text: HINT_REQUEST_TEXT,
    });
    try {
      const hint = await client.revealHint(state.gameId, index);
      dispatch({ type: "hint", id: crypto.randomUUID(), hint });
    } catch {
      dispatch({ type: "fail", id: crypto.randomUUID() });
    }
  }, [client, state]);

  const giveUp = useCallback(async () => {
    if (!state) return;

    setGiveUpOpen(false);
    try {
      const result = await client.giveUp(state.gameId);
      dispatch({ type: "finish", id: crypto.randomUUID(), result });
    } catch {
      dispatch({ type: "fail", id: crypto.randomUUID() });
    }
  }, [client, state]);

  if (hasStartFailed) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <ErrorMessage />
      </main>
    );
  }

  if (!state) {
    return <main aria-busy className="flex-1" />;
  }

  const finished = state.status === "finished";
  const sending = state.status === "sending";

  return (
    <AnimatePresence mode="wait">
      {state.phase === "teaser" ? (
        <motion.main
          animate={FADE.animate}
          className="relative flex flex-1 items-center justify-center px-5"
          exit={FADE.exit}
          initial={FADE.initial}
          key="teaser"
          transition={PHASE_TRANSITION}
        >
          <LeafScatter />
          <div className="relative z-10 mx-auto w-full max-w-lg">
            <TeaserCard teaser={state.teaser} variant="presented" />
          </div>
          <button
            className="absolute inset-0 z-20 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => dispatch({ type: "enter-chat" })}
            type="button"
          >
            <span className="sr-only">Start asking questions</span>
          </button>
        </motion.main>
      ) : (
        <motion.div
          animate={FADE.animate}
          className="flex min-h-0 flex-1 flex-col"
          exit={FADE.exit}
          initial={FADE.initial}
          key="chat"
          transition={PHASE_TRANSITION}
        >
          <a
            className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:m-2 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
            href="#chat-log"
          >
            Skip to the conversation
          </a>
          <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
            <Header onGiveUp={() => setGiveUpOpen(true)} />
            <TeaserCard teaser={state.teaser} />

            <main
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
              id="chat-log"
            >
              <h1 className="sr-only">Guess the hidden Swedish word</h1>
              {state.entries.map((entry) => (
                <ChatAppear key={entry.id}>
                  <ChatEntryView
                    entry={entry}
                    announcementRef={captureAnnouncement}
                    isAnnouncement={entry.id === announcementId}
                  />
                </ChatAppear>
              ))}
              {sending && <PendingIndicator />}
              <div ref={logEndRef} />
            </main>

            <div aria-live="polite" className="sr-only">
              {announcement ? announcementText(announcement) : ""}
            </div>

            <div className="flex flex-col gap-2 p-4">
              {finished ? (
                <LinkButton className="h-11 self-center px-6" href="/">
                  Play again
                </LinkButton>
              ) : (
                <>
                  <HintButton
                    disabled={sending}
                    onPress={() => void revealHint()}
                    remaining={remainingHints(state.hintsUsed)}
                  />
                  <InputForm
                    disabled={sending}
                    onSubmit={submit}
                    onValueChange={setDraft}
                    value={draft}
                  />
                </>
              )}
            </div>
          </div>

          <GiveUpDialog
            isOpen={isGiveUpOpen}
            onConfirm={() => void giveUp()}
            onOpenChange={setGiveUpOpen}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatEntryView({
  entry,
  isAnnouncement,
  announcementRef,
}: {
  entry: ChatEntry;
  isAnnouncement: boolean;
  announcementRef: (node: HTMLElement | null) => void;
}) {
  switch (entry.kind) {
    case "player":
      return <PlayerMessage text={entry.text} />;
    case "verdict":
      return (
        <VerdictMessage
          ref={isAnnouncement ? announcementRef : undefined}
          verdict={entry.verdict}
        />
      );
    case "answer":
      return (
        <AnswerFeedback
          correct={entry.correct}
          ref={isAnnouncement ? announcementRef : undefined}
        />
      );
    case "hint":
      return <HintCard hint={entry.hint} />;
    case "result":
      return (
        <ResultCard
          ref={isAnnouncement ? announcementRef : undefined}
          result={entry.result}
        />
      );
    case "error":
      return <ErrorMessage />;
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { levelPool, type ContentPackage, type Track } from '../../content/model.ts';
import type { Level } from '../../content/schema.ts';
import { pickFeature } from '../../engine/feedback.ts';
import { generators } from '../../engine/generators/index.ts';
import {
  answerCurrent,
  currentItem,
  isFinished,
  planSession,
  type SessionItem,
} from '../../engine/session.ts';
import type { AnswerOption, Question } from '../../engine/types.ts';
import { de } from '../../i18n/de.ts';
import { ButtonLink, Button } from '../components/Button.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { Icon } from '../components/Icon.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { UnverifiedBadge } from '../components/UnverifiedBadge.tsx';
import { VehicleImage } from '../components/VehicleImage.tsx';
import { today, useAppStore, usePackage } from '../context.ts';
import { imageUrl, labelText } from '../labels.ts';

export function SessionScreen() {
  const { brandId, collection, levelId } = useParams();
  const pkg = usePackage(brandId);
  const track = pkg?.tracks.find((t) => t.collection === collection);
  const level = track?.levels.find((l) => l.id === levelId);
  if (!pkg || !track || !level) {
    return (
      <main className="mx-auto max-w-content p-4">
        <p>{de.session.notFound}</p>
        <ButtonLink to="/" className="mt-4">
          {de.session.toPath}
        </ButtonLink>
      </main>
    );
  }
  return <SessionRunner key={`${track.id}/${level.id}`} pkg={pkg} track={track} level={level} />;
}

function SessionRunner({ pkg, track, level }: { pkg: ContentPackage; track: Track; level: Level }) {
  const navigate = useNavigate();
  const completeSession = useAppStore((s) => s.completeSession);
  const startProgress = useAppStore((s) => s.progress);
  const input = useMemo(
    () => ({
      level,
      pool: levelPool(pkg.vehicles, track, level),
      generators,
      bodyStyles: pkg.brand.bodyStyles.map((b) => b.id),
    }),
    [pkg, track, level],
  );
  const [state, setState] = useState(() =>
    planSession({
      ...input,
      progress: startProgress,
      today: today(),
      seed: `${Date.now()}-${Math.random()}`,
    }),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const item = currentItem(state);

  const next = () => {
    if (selected === null) return;
    const after = answerCurrent(state, selected, input);
    setSelected(null);
    if (isFinished(after)) {
      completeSession(after, track.id, today());
      navigate('/result', { replace: true });
    } else {
      setState(after);
    }
  };

  if (!item) {
    return (
      <main className="mx-auto max-w-content p-4">
        <h1 className="text-xl font-bold">{de.session.emptyTitle}</h1>
        <p className="mt-2 text-fg-muted">{de.session.emptyText}</p>
        <ButtonLink to="/" className="mt-6" block>
          {de.session.toPath}
        </ButtonLink>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 pt-3 pb-4">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="size-tap shrink-0 px-0"
          aria-label={de.session.abort}
          onClick={() => setConfirmAbort(true)}
        >
          <Icon name="cross" className="size-6" />
        </Button>
        <ProgressBar
          value={state.position}
          max={state.items.length}
          label={de.session.progress(state.position + 1, state.items.length)}
        />
      </header>
      <p className="mt-2 text-sm text-fg-muted">
        {de.session.progress(state.position + 1, state.items.length)}
        {item.kind !== 'planned' && ` · ${de.session.retry}`}
      </p>

      <QuestionView
        key={state.position}
        item={item}
        pkg={pkg}
        selected={selected}
        onChoose={setSelected}
        onNext={next}
        isLast={state.position === state.items.length - 1}
      />

      <ConfirmDialog
        open={confirmAbort}
        title={de.session.abortTitle}
        confirmLabel={de.session.abortConfirm}
        cancelLabel={de.session.abortKeep}
        danger
        onConfirm={() => navigate('/', { replace: true })}
        onCancel={() => setConfirmAbort(false)}
      >
        {de.session.abortText}
      </ConfirmDialog>
    </div>
  );
}

function QuestionView({
  item,
  pkg,
  selected,
  onChoose,
  onNext,
  isLast,
}: {
  item: SessionItem;
  pkg: ContentPackage;
  selected: string | null;
  onChoose: (optionId: string) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const { question } = item;
  const answered = selected !== null;
  const withImages = question.options.some((o) => o.image);
  const prompt = de.prompt[question.prompt.kind](question.prompt.subject ?? '');

  // Number keys 1–4 choose an answer.
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (answered || e.altKey || e.ctrlKey || e.metaKey) return;
      const option = question.options[Number(e.key) - 1];
      if (option) onChoose(option.id);
    },
    [answered, question.options, onChoose],
  );
  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <h1 className="text-xl font-bold">{prompt}</h1>
      {question.prompt.image && (
        <VehicleImage
          eager
          className="mt-3 rounded-lg"
          src={imageUrl(pkg, question.prompt.image.file)}
          alt={
            question.prompt.image.detail
              ? de.image.detail(de.view[question.prompt.image.view])
              : de.image.question(de.view[question.prompt.image.view])
          }
        />
      )}

      <div
        role="group"
        aria-label={de.session.answers}
        className={`mt-4 grid gap-3 ${withImages ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        {question.options.map((option, index) => (
          <OptionButton
            key={option.id}
            option={option}
            index={index}
            pkg={pkg}
            question={question}
            selected={selected}
            onChoose={onChoose}
          />
        ))}
      </div>

      <div className="flex-1" />
      {answered && <Feedback question={question} pkg={pkg} selected={selected} />}
      <Button
        block
        className="mt-4"
        disabled={!answered}
        onClick={onNext}
        // Move focus to "Weiter" once answered, for keyboard and screen reader users.
        ref={(el) => {
          if (el && answered) el.focus();
        }}
      >
        {isLast ? de.session.finish : de.session.next}
      </Button>
    </div>
  );
}

function OptionButton({
  option,
  index,
  pkg,
  question,
  selected,
  onChoose,
}: {
  option: AnswerOption;
  index: number;
  pkg: ContentPackage;
  question: Question;
  selected: string | null;
  onChoose: (id: string) => void;
}) {
  const answered = selected !== null;
  const isCorrect = option.id === question.correctOptionId;
  const isChosen = option.id === selected;
  const vehicleName = option.image
    ? pkg.vehicles.find((v) => v.id === option.image?.vehicleId)?.displayName
    : undefined;

  let state = 'border-border bg-surface hover:bg-surface-muted';
  if (answered && isCorrect) state = 'border-success bg-success-soft';
  else if (answered && isChosen) state = 'border-danger bg-danger-soft';
  else if (answered) state = 'border-border bg-surface opacity-60';

  return (
    <button
      type="button"
      disabled={answered}
      onClick={() => onChoose(option.id)}
      className={`relative flex min-h-tap items-center gap-3 overflow-hidden rounded-md border-2 text-left font-medium ${state} ${
        option.image ? 'flex-col p-0' : 'px-4 py-3'
      }`}
    >
      {option.image ? (
        <>
          <VehicleImage
            src={imageUrl(pkg, option.image.file)}
            alt={de.image.option(index + 1, de.view[option.image.view])}
          />
          {answered && vehicleName && <span className="px-2 pb-2 text-sm">{vehicleName}</span>}
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border text-sm text-fg-muted"
          >
            {index + 1}
          </span>
          <span className="flex-1">
            {labelText(option.label, pkg)}
            {answered && option.reveal?.vehicleName && (
              <span className="block text-sm text-fg-muted">{option.reveal.vehicleName}</span>
            )}
          </span>
        </>
      )}
      {answered && (isCorrect || isChosen) && (
        <span
          className={`flex items-center gap-1 text-sm font-bold ${isCorrect ? 'text-success' : 'text-danger'} ${
            option.image ? 'absolute top-2 right-2 rounded-full bg-surface px-2 py-0.5' : ''
          }`}
        >
          <Icon name={isCorrect ? 'check' : 'cross'} className="size-4" />
          {isCorrect ? de.session.optionCorrect : de.session.optionChosen}
        </span>
      )}
    </button>
  );
}

function Feedback({
  question,
  pkg,
  selected,
}: {
  question: Question;
  pkg: ContentPackage;
  selected: string | null;
}) {
  const correct = selected === question.correctOptionId;
  const vehicle = pkg.vehicles.find((v) => v.id === question.vehicleId);
  const correctOption = question.options.find((o) => o.id === question.correctOptionId);
  const solution = correctOption?.label
    ? labelText(correctOption.label, pkg)
    : (vehicle?.displayName ?? '');
  const shownView = question.prompt.image?.view ?? correctOption?.image?.view;
  const feature = vehicle && pickFeature(vehicle, shownView);
  const powers = question.options.filter((o) => o.reveal?.powerKw ?? o.reveal?.powerPs);

  return (
    <section
      role="status"
      aria-live="polite"
      className={`mt-4 rounded-lg border-2 p-4 ${correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'}`}
    >
      <p
        className={`flex items-center gap-2 text-lg font-bold ${correct ? 'text-success' : 'text-danger'}`}
      >
        <Icon name={correct ? 'check' : 'cross'} className="size-6" />
        {correct ? de.session.correct : de.session.wrong}
      </p>
      {!correct && (
        <p className="mt-1">
          {de.session.solution} <strong>{solution}</strong>
        </p>
      )}
      {powers.length > 0 && (
        <ul className="mt-1 text-sm">
          {powers.map((o) => (
            <li key={o.id}>
              {labelText(o.label, pkg)}: {de.profile.power(o.reveal?.powerKw, o.reveal?.powerPs)}
            </li>
          ))}
        </ul>
      )}
      {feature && (
        <p className="mt-2 text-sm">
          <span className="font-bold">{de.session.feature}</span> {feature.text}
        </p>
      )}
      {vehicle && (
        <div className="mt-2">
          <UnverifiedBadge verified={vehicle.verified} />
        </div>
      )}
    </section>
  );
}

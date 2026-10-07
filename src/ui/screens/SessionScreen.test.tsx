// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../../tests/render-app.tsx';

const LEVEL = '/learn/testbrand/current/basics';

describe('learning unit (component flow)', () => {
  it('plays a complete unit: question, answer, feedback, next … result', async () => {
    const user = userEvent.setup();
    const { store, adapter } = await renderApp(LEVEL);

    expect(screen.getByText('Frage 1 von 10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welches Modell ist das?' })).toBeInTheDocument();
    // The question image never reveals the answer in its alt text.
    const img = screen
      .getAllByRole('img')
      .find((i) => i.getAttribute('alt')?.startsWith('Gesuchtes'));
    expect(img?.getAttribute('alt')).not.toMatch(/Testwagen/);

    let answered = 0;
    while (!screen.queryByRole('heading', { name: 'Einheit geschafft!' })) {
      const options = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole(
        'button',
      );
      expect(options).toHaveLength(4);
      expect(screen.getByRole('button', { name: /Weiter|Zum Ergebnis/ })).toBeDisabled();

      await user.click(options[0]!);
      // Feedback by text and symbol, not only colour.
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/Richtig!|Leider falsch/);
      for (const o of options) expect(o).toBeDisabled();

      await user.click(screen.getByRole('button', { name: /Weiter|Zum Ergebnis/ }));
      answered++;
      expect(answered).toBeLessThan(30);
    }

    expect(answered).toBeGreaterThanOrEqual(10);
    expect(screen.getByText(/von 10 richtig/)).toBeInTheDocument();
    expect(store.getState().progress.sessionsCompleted).toBe(1);
    expect(store.getState().progress.xp).toBeGreaterThan(0);
    // persisted
    await new Promise((r) => setTimeout(r, 0));
    expect(adapter.data).toContain('"sessionsCompleted":1');
  });

  it('can be answered with the keyboard', async () => {
    const user = userEvent.setup();
    await renderApp(LEVEL);
    await user.keyboard('2');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText(/Frage 2 von/)).toBeInTheDocument();
  });

  it('asks before aborting and saves nothing when aborted', async () => {
    const user = userEvent.setup();
    const { store } = await renderApp(LEVEL);
    const options = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
    await user.click(options[0]!);

    await user.click(screen.getByRole('button', { name: 'Einheit abbrechen' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Einheit abbrechen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Weiterlernen' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Einheit abbrechen' }));
    await user.click(screen.getByRole('button', { name: 'Ja, abbrechen' }));
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
    expect(store.getState().progress.sessionsCompleted).toBe(0);
  });

  it('shows a message for an unknown level', async () => {
    await renderApp('/learn/testbrand/current/nope');
    expect(screen.getByText('Dieses Level gibt es nicht.')).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../../tests/render-app.tsx';

describe('learning path', () => {
  it('lists the levels of the track with their state', async () => {
    await renderApp('/');
    expect(screen.getByRole('link', { name: 'Basis starten' })).toHaveAttribute(
      'href',
      '/learn/testbrand/current/basics',
    );
    // "advanced" waits for "basics"
    expect(screen.queryByRole('link', { name: 'Fortgeschritten starten' })).not.toBeInTheDocument();
    expect(screen.getByText('Erst Basis meistern')).toBeInTheDocument();
    expect(screen.getByText('0 Tage Serie')).toBeInTheDocument();
  });
});

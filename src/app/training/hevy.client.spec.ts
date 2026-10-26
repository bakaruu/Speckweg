import { readEventsPage } from './hevy.client';

describe('readEventsPage', () => {
  const updated = { type: 'updated', workout: { id: 'a', title: 'Pierna', exercises: [] } };
  const deleted = { type: 'deleted', id: 'b', deleted_at: '2026-10-05T00:00:00Z' };

  it('lee la respuesta normal de Hevy', () => {
    expect(readEventsPage({ page: 1, page_count: 3, events: [updated, deleted] })).toEqual({
      events: [updated, deleted],
      pageCount: 3,
    });
  });

  it('no falla si no hay cambios y Hevy no manda la lista', () => {
    expect(readEventsPage({ page: 1, page_count: 0 })).toEqual({ events: [], pageCount: 0 });
    expect(readEventsPage({})).toEqual({ events: [], pageCount: 0 });
    expect(readEventsPage(null)).toEqual({ events: [], pageCount: 0 });
    expect(readEventsPage('')).toEqual({ events: [], pageCount: 0 });
  });

  it('se salta los eventos que no entiende', () => {
    expect(
      readEventsPage({ page_count: 1, events: [updated, { type: 'otro' }, null] }).events,
    ).toEqual([updated]);
  });
});

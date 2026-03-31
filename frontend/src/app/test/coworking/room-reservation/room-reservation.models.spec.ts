/**
 * JSON parsing for hallway room reservation API responses.
 */

import { parseReservationJSON, parseEventJson } from '../../../coworking/coworking.models';
import { BASE_RESERVATION_JSON } from './coworking-test-helpers';

describe('Room reservation models (API parsing)', () => {
  describe('parseReservationJSON', () => {
    it('converts ISO strings to Date for times and timestamps', () => {
      const r = parseReservationJSON(BASE_RESERVATION_JSON);
      expect(r.start).toEqual(new Date(BASE_RESERVATION_JSON.start));
      expect(r.end).toEqual(new Date(BASE_RESERVATION_JSON.end));
      expect(r.created_at).toEqual(new Date(BASE_RESERVATION_JSON.created_at));
    });
  });

  describe('parseEventJson', () => {
    it('parses room event bounds from API strings', () => {
      const e = parseEventJson({
        reservation_id: 1,
        user_id: 2,
        room_name: 'Study 1',
        start: '2024-06-01T14:00:00.000Z',
        end: '2024-06-01T15:00:00.000Z'
      });
      expect(e.start).toEqual(new Date('2024-06-01T14:00:00.000Z'));
      expect(e.end).toEqual(new Date('2024-06-01T15:00:00.000Z'));
    });
  });
});

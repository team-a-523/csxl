import { Profile } from 'src/app/models.module';
import { ReservationJSON } from 'src/app/coworking/coworking.models';

/** Shared mocks for CSXL hallway room reservation tests. */
export const MOCK_PROFILE: Profile = {
  id: 1,
  pid: 100,
  onyen: 'student',
  first_name: 'Test',
  last_name: 'User',
  email: 't@unc.edu',
  pronouns: null,
  registered: true,
  role: 0,
  permissions: [],
  github: null,
  github_id: null,
  github_avatar: null,
  accepted_community_agreement: true,
  bio: null,
  linkedin: null,
  website: null
};

export const BASE_RESERVATION_JSON: ReservationJSON = {
  id: 1,
  start: '2024-06-01T10:00:00.000Z',
  end: '2024-06-01T12:00:00.000Z',
  users: [],
  seats: [],
  walkin: false,
  created_at: '2024-06-01T09:00:00.000Z',
  updated_at: '2024-06-01T09:00:00.000Z',
  room: null,
  state: 'DRAFT'
};

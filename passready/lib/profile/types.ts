export type UserProfileRow = {
  user_id: string;
  full_name: string | null;
  postcode: string | null;
  preferred_test_centre: string | null;
  adi_number: string | null;
  teaching_postcode: string | null;
  preferred_test_centre_area: string | null;
  updated_at: string;
};

export type UserProfileInput = {
  full_name?: string | null;
  postcode?: string | null;
  preferred_test_centre?: string | null;
  adi_number?: string | null;
  teaching_postcode?: string | null;
  preferred_test_centre_area?: string | null;
};

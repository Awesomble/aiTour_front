export type UserInfo = {
  user_name: string;
  email: string;
  birth_date?: string;
  blood_type?: string;
  has_special_blood?: boolean;
  emergency_contact?: string;
  emergency_contact_nationality?: string;
  language?: string;
  medical_info?: string;
  nationality?: any;
  special_blood_type_info?: string;
  thumbnail_url?: string;
  groups?: string[];
  accessToken?: string;
  sub?: string;
}